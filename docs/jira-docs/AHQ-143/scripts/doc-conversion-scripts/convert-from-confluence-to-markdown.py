#!/usr/bin/env python3
"""
convert-from-confluence-to-markdown.py
======================================

Convert a Confluence page's **storage-format XHTML** into GitHub-flavoured
Markdown, preserving the things the lossy built-in converters throw away:
tables, info/note panels, code blocks, nested lists, internal/external links,
Jira macros, emoji, and "template" blocks.

WHY THIS EXISTS
---------------
The sooperset `mcp-atlassian` MCP server (https://github.com/sooperset/mcp-atlassian)
— and Confluence's own "export to markdown" — produce a *lossy* conversion:
they silently drop info/note panels, table-cell lists, and sometimes whole
tables. This script converts directly from the raw storage XHTML so nothing is
lost.

PROCEDURE (for an AI converting a Confluence page)
--------------------------------------------------
Step 1 — Fetch the page's storage XHTML. Call the sooperset mcp-atlassian tool:
    confluence_get_page(page_id="<ID>", convert_to_markdown=false, include_metadata=false)
  Always use convert_to_markdown=false (the tool's own markdown is lossy). A
  large page is saved by the MCP to a tool-results file instead of returned
  inline — that file is a valid INPUT for this script.

Step 2 — Get the XHTML into a file. EITHER:
    (a) pass the MCP JSON / tool-results file straight to this script — it
        auto-detects JSON, reads `.content.value`, and unwraps a double-encoded
        `.result` string if present; OR
    (b) extract the raw XHTML yourself:
          jq -r '.result' tool-result.txt | jq -r '.content.value' > page-storage.xml
        (the first `jq` is only needed if the JSON is double-wrapped in `.result`).

Step 3 — Build the link-map for internal page links. Cross-page links appear in
  the XHTML as `<ac:link><ri:page ri:content-title="Some Page"/></ac:link>` and
  carry ONLY the title — never a URL — so they cannot be resolved offline. You do
  not need to hunt for them by hand: run Step 4 once WITHOUT --link-map and the
  script prints a warning listing every internal-link title that needs a URL.
  Then, for each listed title:
    (a) look up its URL with the mcp-atlassian tool and take the `url` field:
          confluence_search(query='title ~ "Some Page"')
    (b) write a JSON file mapping each title to that URL:
          { "Some Page": "https://<site>/wiki/spaces/<KEY>/pages/<id>", ... }

Step 4 — Run the conversion:
    python3 convert-from-confluence-to-markdown.py INPUT OUTPUT \
        --title 'Page Title' \
        --source-url https://<site>/wiki/spaces/<KEY>/pages/<id> \
        --link-map link-map.json

Step 5 — Verify the run ends with NO "unresolved internal page link" warning. If
  any remain, add their URLs to the link-map (Step 3) and re-run Step 4. Then
  sanity-check the OUTPUT markdown renders as expected.

ARGUMENTS
---------
  INPUT                 storage-XHTML file, or MCP JSON file (auto-detected)
  OUTPUT                markdown file to write
  --title TEXT          H1 title for the document (default: derived from OUTPUT filename)
  --source-url URL      Confluence page URL, shown in the provenance note at the top
  --no-header           Don't emit the H1 title + provenance note (body only)
  --link-map FILE       JSON {"page title": "url"} for internal page links (Step 3);
                        titles not in the map render as plain text and warn.

EXAMPLE
-------
  python3 convert-from-confluence-to-markdown.py \
      page-storage.xml \
      my-page.md \
      --title 'AHQ-143 - Implement "Add Feature" Workflow' \
      --source-url https://agentic-hq.atlassian.net/wiki/spaces/ahq/pages/67436545 \
      --link-map link-map.json

WHAT IT HANDLES (and how)
-------------------------
  * Parser: Python stdlib `html.parser` (lenient). NOT `xml.etree` — storage
    format uses undeclared `ac:`/`ri:` namespaces and HTML entities that break a
    strict XML parser.
  * Code blocks: `<ac:plain-text-body>` bodies live in CDATA, which html.parser
    mishandles, so CDATA is regex-stashed BEFORE parsing and restored on output.
  * Info / Note panels  -> plain `> ` blockquote (no GitHub `[!NOTE]` label).
  * Code macro          -> fenced ``` block (honours the `language` parameter).
  * Jira macro          -> [KEY](https://agentic-hq.atlassian.net/browse/KEY).
  * TOC macro           -> omitted (GitHub renders its own outline).
  * Emoji (ac:emoticon) -> the `ac:emoji-fallback` unicode char.
  * Links: external `<a>` -> [text](href); if text == href -> <href> (autolink).
           internal `<ac:link>` -> [text](url) when the page title is in the
           --link-map, otherwise its link-body text (+ a warning).
  * Tables -> Markdown pipe tables; multi-paragraph cells joined with <br><br>;
              `|` escaped; any cell list emitted as a one-line <ul><li>..</ul>.
  * Headings -> demoted by one level (source h1 -> "##") so the single document
                title is the only H1 and the outline stays clean.
  * Lists -> nested at 4 spaces/level; list items may contain block children
             (e.g. a code block) rendered as indented continuation.
  * "Template" blocks delimited by `======START TEMPLATE...` / `======END
    TEMPLATE...` paragraphs: the literal-markdown body is wrapped in a
    ```markdown fence (so `#` headings and `<placeholder>` text render
    verbatim instead of being interpreted), while trailing commentary
    (an IMPORTANT/`(NOTE...)` paragraph) is kept as normal prose outside it.

This is a deterministic, dependency-free, stdlib-only script — no install step.
"""

import argparse
import json
import re
import sys
from html.parser import HTMLParser

# --- constants ---------------------------------------------------------------
JIRA_BROWSE_BASE = "https://agentic-hq.atlassian.net/browse/"
VOID_TAGS = {"br", "col", "img", "hr"}
INDENT = "    "  # 4 spaces per nesting level
HEADING_DEMOTE = 1  # source h1 -> "##", leaving the doc title as the only H1
TEMPLATE_FENCE_LANG = "markdown"
START_TEMPLATE_RE = re.compile(r"^=+\s*START TEMPLATE\s*=+$")
END_TEMPLATE_RE = re.compile(r"^=+\s*END TEMPLATE\s*=+$")
# A paragraph that begins a "(NOTE ...)" aside is treated as commentary, not
# template body, so it renders outside the fenced template block.
COMMENTARY_LEAD_RE = re.compile(r"^\(NOTE\b", re.IGNORECASE)

# Internal Confluence page links store only a TITLE in storage format (no URL),
# so they cannot be resolved offline. A {title: url} map supplied via --link-map
# turns them into real links; any internal link whose title is NOT in the map is
# rendered as plain text and reported as a warning (so it is never silent).
# Populated once from --link-map in main(); read in inline_node().
LINK_MAP = {}
UNRESOLVED_INTERNAL_LINKS = []


# --- CDATA stashing (code-block bodies) --------------------------------------
class CDataStore:
    """Stash CDATA sections to opaque tokens before parsing, restore on output.

    html.parser does not handle CDATA, so we pull the bodies out first and put
    them back verbatim when we emit the code fences.
    """

    _TOKEN = "\x00CD%d\x00"
    _TOKEN_RE = re.compile(r"\x00CD(\d+)\x00")

    def __init__(self):
        self._bodies = []

    def stash(self, raw):
        def repl(m):
            self._bodies.append(m.group(1))
            return self._TOKEN % (len(self._bodies) - 1)

        return re.sub(r"<!\[CDATA\[(.*?)\]\]>", repl, raw, flags=re.S)

    def restore(self, s):
        return self._TOKEN_RE.sub(lambda m: self._bodies[int(m.group(1))], s)


# --- parse tree --------------------------------------------------------------
class Node:
    __slots__ = ("tag", "attrs", "children", "text")

    def __init__(self, tag=None, attrs=None):
        self.tag = tag
        self.attrs = dict(attrs or {})
        self.children = []
        self.text = None


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        node = Node()
        node.text = data
        self.stack[-1].children.append(node)


def build_tree(xhtml):
    builder = TreeBuilder()
    builder.feed(xhtml)
    return builder.root


# --- small helpers -----------------------------------------------------------
def norm(s):
    """Collapse runs of whitespace to a single space (HTML whitespace rules)."""
    return re.sub(r"\s+", " ", s)


def raw_text(node):
    """All descendant text, concatenated, with NO markdown transformation."""
    if node.text is not None:
        return node.text
    return "".join(raw_text(c) for c in node.children)


def wrap_emphasis(inner, marker):
    """Wrap `inner` in a markdown emphasis marker, keeping boundary whitespace
    OUTSIDE the markers (markdown requires `**`/`*` to hug non-space chars)."""
    stripped = inner.strip()
    if not stripped:
        return inner  # whitespace-only: nothing to emphasise, preserve spacing
    lead = inner[: len(inner) - len(inner.lstrip())]
    trail = inner[len(inner.rstrip()):]
    return f"{lead}{marker}{stripped}{marker}{trail}"


# --- inline rendering --------------------------------------------------------
def inline(node, cdata):
    return "".join(inline_node(c, cdata) for c in node.children)


def inline_node(c, cdata):
    if c.text is not None:
        return norm(c.text)
    tag = c.tag
    if tag == "strong":
        return wrap_emphasis(inline(c, cdata), "**")
    if tag == "em":
        return wrap_emphasis(inline(c, cdata), "*")
    if tag == "u":
        # Markdown has no underline; pass the text through (often nested inside
        # <em>/<a>, which still carry their own formatting).
        return inline(c, cdata)
    if tag == "code":
        return f"`{raw_text(c)}`"
    if tag == "a":
        href = c.attrs.get("href", "")
        text = inline(c, cdata).strip() or href
        if text == href:
            return f"<{href}>"  # autolink when the text is just the URL
        return f"[{text}]({href})"
    if tag == "br":
        return "  \n"  # markdown hard line break
    if tag == "ac:link":
        body = ""
        title = ""
        for cc in c.children:
            if cc.tag == "ac:link-body":
                body = inline(cc, cdata).strip()
            elif cc.tag == "ri:page":
                title = cc.attrs.get("ri:content-title", "")
        if not body:
            body = title
        url = LINK_MAP.get(title) if title else None
        if url:
            return f"[{body}]({url})"
        if title:
            UNRESOLVED_INTERNAL_LINKS.append(title)
        return body  # internal page link with no URL in --link-map: plain text
    if tag == "ac:emoticon":
        return c.attrs.get("ac:emoji-fallback", "")
    if tag == "ac:structured-macro":
        name = c.attrs.get("ac:name", "")
        if name == "jira":
            key = ""
            for cc in c.children:
                if cc.tag == "ac:parameter" and cc.attrs.get("ac:name") == "key":
                    key = raw_text(cc).strip()
            return f"[{key}]({JIRA_BROWSE_BASE}{key})"
        if name == "smile":
            return "🙂"
        return inline(c, cdata)
    if tag in ("ac:parameter", "ri:page", "ac:link-body"):
        return ""
    return inline(c, cdata)


# --- block rendering ---------------------------------------------------------
def render_paragraph(p, cdata):
    text = inline(p, cdata).strip()
    # Collapse accidental double spaces in prose (e.g. left behind when moving
    # an emphasis marker's boundary whitespace outside the `**`/`*`) WITHOUT
    # touching the two-space markdown hard break, which is always followed by a
    # newline (so the lookahead for a non-space char never matches it).
    return re.sub(r" {2,}(?=\S)", " ", text)


def render_list(node, depth, ordered, cdata):
    lines = []
    idx = 0
    for li in node.children:
        if li.tag != "li":
            continue
        idx += 1
        marker = f"{idx}." if ordered else "-"
        indent = INDENT * depth
        cont = INDENT * (depth + 1)
        lead = ""
        lead_set = False
        extra_blocks = []
        nested = []
        for cc in li.children:
            if cc.tag in ("ul", "ol"):
                nested.append(cc)
            elif cc.tag == "p":
                t = render_paragraph(cc, cdata)
                if not t:
                    continue
                if not lead_set:
                    lead, lead_set = t, True
                else:
                    extra_blocks.append(t)
            elif cc.text is not None:
                t = norm(cc.text).strip()
                if not t:
                    continue
                if not lead_set:
                    lead, lead_set = t, True
                else:
                    extra_blocks.append(t)
            else:
                # block-level child (e.g. a code macro) or stray inline element
                rb = render_block_node(cc, depth + 1, cdata)
                if rb and rb.strip():
                    extra_blocks.append(rb)
        if not lead and not nested and extra_blocks:
            # Confluence sometimes wraps a lone code block in a single-item list.
            # Emit its content as continuation at this indent — no empty bullet.
            for blk in extra_blocks:
                for bl in blk.split("\n"):
                    lines.append((indent + bl) if bl else "")
            continue
        lines.append(f"{indent}{marker} {lead}".rstrip())
        for blk in extra_blocks:
            lines.append("")
            for bl in blk.split("\n"):
                lines.append((cont + bl) if bl else "")
        for n in nested:
            lines.append(render_list(n, depth + 1, n.tag == "ol", cdata))
    return "\n".join(lines)


def render_cell(cell, cdata):
    parts = []
    for c in cell.children:
        if c.tag == "p":
            t = render_paragraph(c, cdata)
            if t.strip():
                parts.append(t.strip())
        elif c.tag in ("ul", "ol"):
            items = []
            for li in c.children:
                if li.tag == "li":
                    items.append(
                        inline(li, cdata).strip()
                        or " ".join(
                            render_paragraph(x, cdata)
                            for x in li.children
                            if x.tag == "p"
                        )
                    )
            parts.append("<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>")
        elif c.text is not None:
            t = norm(c.text).strip()
            if t:
                parts.append(t)
        else:
            t = inline_node(c, cdata).strip()
            if t:
                parts.append(t)
    md = "<br><br>".join(parts)
    md = md.replace("|", "\\|")
    md = md.replace("  \n", "<br>").replace("\n", " ")
    return md


def find_rows(table):
    rows = []

    def walk(n):
        for c in n.children:
            if c.tag == "tr":
                rows.append(c)
            else:
                walk(c)

    walk(table)
    return rows


def render_table(table, cdata):
    rows = find_rows(table)
    if not rows:
        return ""
    rendered = []
    header_idx = None
    for i, tr in enumerate(rows):
        cells = [c for c in tr.children if c.tag in ("th", "td")]
        rendered.append([render_cell(c, cdata) for c in cells])
        if header_idx is None and any(c.tag == "th" for c in cells):
            header_idx = i
    ncols = max(len(r) for r in rendered)
    for r in rendered:
        while len(r) < ncols:
            r.append("")
    out = []
    if header_idx is None:
        header = [""] * ncols
        body = rendered
    else:
        header = rendered[header_idx]
        body = [r for i, r in enumerate(rendered) if i != header_idx]
    out.append("| " + " | ".join(header) + " |")
    out.append("| " + " | ".join(["---"] * ncols) + " |")
    for r in body:
        out.append("| " + " | ".join(r) + " |")
    return "\n".join(out)


def render_macro_block(c, depth, cdata):
    name = c.attrs.get("ac:name", "")
    if name == "toc":
        return ""  # GitHub renders its own outline; explicit TOC macro omitted
    if name == "code":
        lang = ""
        body = ""
        for cc in c.children:
            if cc.tag == "ac:parameter" and cc.attrs.get("ac:name") == "language":
                lang = raw_text(cc).strip()
            if cc.tag == "ac:plain-text-body":
                body = raw_text(cc)
        body = cdata.restore(body).strip("\n")
        return f"```{lang}\n{body}\n```"
    if name in ("info", "note"):
        rtb = next((cc for cc in c.children if cc.tag == "ac:rich-text-body"), None)
        blocks = render_block_children(rtb, 0, cdata) if rtb else []
        inner = "\n\n".join(x for x in blocks if x)
        # Plain '>' blockquote in both directions (no GitHub [!NOTE]/[!WARNING]).
        return "\n".join((f"> {ln}" if ln else ">") for ln in inner.split("\n"))
    if name == "jira":
        return inline_node(c, cdata)
    return "\n\n".join(render_block_children(c, depth, cdata))


def render_block_node(c, depth, cdata):
    if c.text is not None:
        return norm(c.text).strip()
    tag = c.tag
    if tag and re.fullmatch(r"h[1-6]", tag):
        level = min(int(tag[1]) + HEADING_DEMOTE, 6)
        txt = inline(c, cdata).strip()
        # Strip a heading that is entirely bold-wrapped (Confluence sometimes
        # does this) so we don't get "## **Title**".
        if txt.startswith("**") and txt.endswith("**") and txt.count("**") == 2:
            txt = txt[2:-2].strip()
        return "#" * level + " " + txt
    if tag == "p":
        return render_paragraph(c, cdata)
    if tag in ("ul", "ol"):
        return render_list(c, depth, tag == "ol", cdata)
    if tag == "table":
        return render_table(c, cdata)
    if tag == "ac:structured-macro":
        return render_macro_block(c, depth, cdata)
    if tag in ("ac:rich-text-body", "tbody", "colgroup", "div", "span"):
        return "\n\n".join(render_block_children(c, depth, cdata))
    if tag in ("br", "col"):
        return ""
    return "\n\n".join(render_block_children(c, depth, cdata))


# --- template blocks ---------------------------------------------------------
def is_marker(node, regex):
    return node.tag == "p" and bool(regex.match(raw_text(node).strip()))


def template_body_line(node):
    """Render one template-body node as the LITERAL markdown the user typed
    (it lives inside a ```markdown fence, so nothing is interpreted)."""
    if node.tag == "p":
        return raw_text(node).strip()
    if node.tag in ("ul", "ol"):
        lines = []
        for li in node.children:
            if li.tag == "li":
                t = raw_text(li).strip()
                if t:
                    lines.append(f"- {t}")
        return "\n".join(lines)
    return raw_text(node).strip()


def is_commentary(node):
    """True if a template-block node is trailing commentary (rendered as normal
    prose OUTSIDE the fence) rather than literal template body."""
    if node.tag != "p":
        return False
    text = raw_text(node).strip()
    if not text:
        return False
    if COMMENTARY_LEAD_RE.match(text):
        return True
    # A paragraph whose first real child is bold (e.g. "**IMPORTANT**: ...").
    for cc in node.children:
        if cc.text is not None and cc.text.strip() == "":
            continue
        return cc.tag == "strong"
    return False


def render_template_block(start_marker, interior, end_marker, cdata):
    """Render a `======START/END TEMPLATE======` region: the literal-markdown
    body goes in a ```markdown fence; trailing commentary stays as prose."""
    body_nodes, comment_nodes, in_comment = [], [], False
    for node in interior:
        if not in_comment and is_commentary(node):
            in_comment = True
        (comment_nodes if in_comment else body_nodes).append(node)

    body_blocks = []
    for node in body_nodes:
        rendered = template_body_line(node)
        if rendered:
            body_blocks.append(rendered)

    parts = [raw_text(start_marker).strip()]
    if body_blocks:
        # Blank line between blocks so the fenced template reads like the real
        # markdown file it represents; list items within a block stay contiguous.
        fenced = "\n\n".join(body_blocks)
        parts.append(f"```{TEMPLATE_FENCE_LANG}\n{fenced}\n```")

    for node in comment_nodes:
        rendered = render_block_node(node, 0, cdata)
        if rendered and rendered.strip():
            parts.append(rendered)

    parts.append(raw_text(end_marker).strip())
    return "\n\n".join(parts)


def render_block_children(node, depth, cdata):
    out = []
    children = node.children
    i = 0
    while i < len(children):
        c = children[i]
        if is_marker(c, START_TEMPLATE_RE):
            # Consume up to the matching END TEMPLATE marker.
            j = i + 1
            while j < len(children) and not is_marker(children[j], END_TEMPLATE_RE):
                j += 1
            if j < len(children):
                interior = children[i + 1:j]
                out.append(
                    render_template_block(c, interior, children[j], cdata)
                )
                i = j + 1
                continue
        r = render_block_node(c, depth, cdata)
        if r and r.strip():
            out.append(r)
        i += 1
    return out


# --- input loading -----------------------------------------------------------
def load_storage_xhtml(path):
    """Read INPUT and return the raw storage XHTML, whether the file is raw
    XHTML or an MCP `confluence_get_page` JSON payload."""
    raw = open(path, encoding="utf-8").read().strip()
    if not raw.startswith("{"):
        return raw  # already raw storage XHTML
    data = json.loads(raw)
    # MCP sometimes double-encodes: {"result": "<json string>"}
    if isinstance(data, dict) and "result" in data and isinstance(data["result"], str):
        data = json.loads(data["result"])
    try:
        return data["content"]["value"]
    except (KeyError, TypeError):
        raise SystemExit(
            f"Could not find storage XHTML at .content.value in JSON input: {path}"
        )


# --- assembly ----------------------------------------------------------------
def build_document(xhtml, title, source_url, emit_header):
    cdata = CDataStore()
    xhtml = cdata.stash(xhtml)
    root = build_tree(xhtml)

    blocks = render_block_children(root, 0, cdata)
    body = "\n\n".join(blocks)
    body = re.sub(r"\n{3,}", "\n\n", body)

    if not emit_header:
        return body.strip() + "\n"

    head_lines = [f"# {title}", ""]
    note = "> **DRAFT — converted from Confluence.**"
    if source_url:
        note += f" Source page: [{title}]({source_url})"
    head_lines.append(note)
    head_lines.append(
        "> This Markdown is the working copy for editing; "
        "the Confluence page is the original."
    )
    head = "\n".join(head_lines)
    return head + "\n\n" + body.strip() + "\n"


def derive_title(output_path):
    stem = re.sub(r"\.md$", "", output_path.rsplit("/", 1)[-1])
    return stem.replace("-", " ").replace("_", " ").strip() or "Converted Document"


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Convert Confluence storage-format XHTML to Markdown.",
    )
    parser.add_argument("input", help="storage-XHTML file, or MCP JSON file")
    parser.add_argument("output", help="markdown file to write")
    parser.add_argument("--title", help="H1 title (default: derived from OUTPUT name)")
    parser.add_argument("--source-url", default="", help="Confluence page URL for the note")
    parser.add_argument(
        "--no-header",
        action="store_true",
        help="omit the H1 title + provenance note (body only)",
    )
    parser.add_argument(
        "--link-map",
        help='JSON file of {"page title": "url"} for internal Confluence page '
        "links (see Step 3 in the module docstring).",
    )
    args = parser.parse_args(argv)

    if args.link_map:
        LINK_MAP.update(json.load(open(args.link_map, encoding="utf-8")))

    title = args.title or derive_title(args.output)
    xhtml = load_storage_xhtml(args.input)
    out = build_document(xhtml, title, args.source_url, not args.no_header)
    open(args.output, "w", encoding="utf-8").write(out)

    print(f"wrote {args.output}: {len(out)} chars, {out.count(chr(10)) + 1} lines")
    print(f"  blockquote lines (panels): {sum(1 for ln in out.splitlines() if ln.startswith('>'))}")
    print(f"  table header separators:   {out.count('| --- |')}")
    print(f"  code fences:               {out.count(chr(96) * 3) // 2}")

    unresolved = sorted(set(UNRESOLVED_INTERNAL_LINKS))
    if unresolved:
        print(
            f"\nWARNING: {len(unresolved)} internal page link(s) had no URL and were "
            "rendered as plain text.\n"
            "  Add them to a --link-map JSON to turn them into real links:"
        )
        for t in unresolved:
            print(f'    "{t}": "<url>"')
    return 0


if __name__ == "__main__":
    sys.exit(main())
