# Full John Ousterhout / APoSD Research Notes

> **What this is.** The raw research behind [§2 of doc 14](../14-birgitta-ousterhout-full-build-kick-off-guidance.md) — the *Ousterhout Design Principles List*. Every source consulted, every quotation collected in full, and a note on how each was verified.
>
> **Why it exists separately.** Doc 14 is a kick-off guidance handed to a `create-workflow` agent; it needs the principles and one quotation each, not the evidence pile. This file is the evidence pile, so that any later claim in doc 14 or doc 15 can be traced without re-doing the browsing.
>
> **Gathered:** 2026-07-27, via `WebSearch`, `WebFetch` and the Claude-in-Chrome extension (used where `WebFetch` was blocked or returned a summariser's paraphrase rather than page text).
>
> **On quoting a copyrighted book.** Everything below is a short excerpt used to identify and source a named design principle, taken from publicly published quotation pages and from Ousterhout's own freely published writing. It is a working notes file, not a substitute for the book — [*A Philosophy of Software Design*](https://web.stanford.edu/~ouster/cgi-bin/aposd.php) is worth buying, and the second edition is the current one.

---

## 1. Sources

| # | Source | URL | What it is good for | Provenance |
|---|---|---|---|---|
| **S-A** | *A Philosophy of Software Design* — collected verbatim excerpts | [goodreads.com/work/quotes/61938796](https://www.goodreads.com/work/quotes/61938796-a-philosophy-of-software-design) | The book's own words, including **both appendices** — *Summary of Design Principles* and *Summary of Red Flags*. 205 excerpts across 7 pages; pages 1–3 read for this work. | **Page text read directly** via Chrome. Highest confidence. |
| **S-B** | Ousterhout & Martin, *A Philosophy of Software Design vs. Clean Code* | [github.com/johnousterhout/aposd-vs-clean-code](https://github.com/johnousterhout/aposd-vs-clean-code) | Ousterhout's **own words, published by him, on the open web** — deep vs shallow methods, entanglement, comments, and the fullest statement of his TDD position. | `WebFetch` of the raw Markdown, read twice with different prompts; the TDD passage re-fetched specifically to confirm wording. |
| **S-C** | *The Pragmatic Engineer* — "The Philosophy of Software Design – with John Ousterhout" (Gergely Orosz, 9 Apr 2025) | [newsletter.pragmaticengineer.com](https://newsletter.pragmaticengineer.com/p/the-philosophy-of-software-design) | The **AI angle**: Ousterhout on why design matters more as agents write more code, and the "tactical tornadoes" framing applied to AI tools. Also his one endorsement of test-first (bug fixes). | **Page text read directly** via Chrome. Note: the takeaways are *Orosz's summary of the conversation*, not verbatim Ousterhout — attributed as such below. |
| **S-D** | Ousterhout's own book page | [web.stanford.edu/~ouster/cgi-bin/aposd.php](https://web.stanford.edu/~ouster/cgi-bin/aposd.php) | Edition history; his note that general-purpose design grew *more* important to him for the 2nd edition. | `WebFetch`; content is summarised, so nothing from here is quoted in doc 14. |
| **S-E** | Derek Sivers' book notes | [sive.rs/book/PoSD](https://sive.rs/book/PoSD) | Cross-check only. | `WebFetch` via a summarising model — **paraphrase risk**, so nothing from here was used as a quotation. Listed for completeness. |

**Rule applied throughout:** a quotation went into doc 14 only if it came from **S-A**, **S-B** or **S-C**, i.e. from text I read as page text or as raw Markdown. Anything reaching me only through a summarising layer was treated as a lead, not as a quote.

---

## 2. APoSD's *Summary of Design Principles* (the book's own list)

Ousterhout's appendix, quoted in full from **S-A**. This is the backbone of doc 14 §2.1 and the reason the principle names there are what they are.

> "Here are the most important software design principles discussed in this book: Complexity is incremental: you have to sweat the small stuff (see p. 11). Working code isn't enough (see p. 14). Make continual small investments to improve system design (see p. 15). Modules should be deep (see p. 23) Interfaces should be designed to make the most common usage as simple as possible (see p. 27). It's more important for a module to have a simple interface than a simple implementation (see pp. 61, 74). General-purpose modules are deeper (see p. 39). Separate general-purpose and special-purpose code (see pp. 45, 68). Different layers should have different abstractions (see p. 51). Pull complexity downward (see p. 61). Define errors out of existence (see p. 81). Design it twice (see p. 91). Comments should describe things that are not obvious from the code (see p. 101). Software should be designed for ease of reading, not ease of writing (see p. 151). The increments of software development should be abstractions, not features (see p. 156). Separate what matters from what doesn't matter and emphasize the things that matter (see p. 171"

*(The trailing quotation is truncated at source — the page number is 171.)*

**How doc 14 maps onto it:** sixteen principles, consolidating "interfaces should make the most common usage simple" and "simple interface over simple implementation" into **P3 · Modules Should Be Deep**; consolidating "separate general-purpose and special-purpose code" into **P5**; and adding four the appendix does not list but the book devotes chapters to — **Information Hiding** (ch. 5), **Better Together Or Better Apart** (ch. 9), **Choosing Names** (ch. 14), **Consistency** (ch. 17). "Separate what matters" is the one appendix principle doc 14 deliberately does not give a P-number (doc 14 §2.2 says why).

---

## 3. APoSD's *Summary of Red Flags* (the book's own list)

Quoted in full from **S-A**. This is the source of doc 14 §2.4, and each definition below is the book's, not mine.

> "Here are a few of of the most important red flags discussed in this book. The presence of any of these symptoms in a system suggests that there is a problem with the system's design: **Shallow Module**: the interface for a class or method isn't much simpler than its implementation (see pp. 25, 110). **Information Leakage**: a design decision is reflected in multiple modules (see p. 31). **Temporal Decomposition**: the code structure is based on the order in which operations are executed, not on information hiding (see p. 32). **Overexposure**: An API forces callers to be aware of rarely used features in order to use commonly used features (see p. 36). **Pass-Through Method**: a method does almost nothing except pass its arguments to another method with a similar signature (see p. 52). **Repetition**: a nontrivial piece of code is repeated over and over (see p. 68). **Special-General Mixture**: special-purpose code is not cleanly separated from general purpose code (see p. 71). **Conjoined Methods**: two methods have so many dependencies that its hard to understand the implementation of one without understanding the implementation of the other (see p. 75). **Comment Repeats Code**: all of the information in a comment is immediately obvious from the code next to the comment (see p. 104). **Implementation Documentation Contaminates Interface**: an interface comment describes implementation details not needed by users of the thing being documented (see p. 114). **Vague Name**: the name of a variable or method is so imprecise that it doesn't convey much useful information (see p. 123). **Hard to Pick Name**: it is difficult to come up with a precise and intuitive name for an entity (see p. 125). **Hard to Describe**: in order to be complete, the documentation for a variable or method must be long. (see p. 133). **Nonobvious Code**: the behavior or meaning of a piece of code cannot be understood easily. (see p. 150)."

*(Bold added; the typo "a few of of" and "its hard" are in the source. Fourteen red flags.)*

---

## 4. Quotations by principle

All from **S-A** unless marked. Doc 14 uses one of these per principle; the rest are here for doc 15, for command-file wording, or for anyone who wants a better fit.

### P1 · Complexity Is Incremental (ch. 2)

> "This book is about one thing: complexity. Dealing with complexity is the most important challenge in software design. It is what makes systems hard to build and maintain, and it often makes them slow as well."

> "Complexity comes from an accumulation of dependencies and obscurities. As complexity increases, it leads to change amplification, a high cognitive load, and unknown unknowns. As a result, it takes more code modifications to implement each new feature. In addition, developers spend more time acquiring enough information to make the change safely and, in the worst case, they can't even find all the information they need."

> "Complexity comes about because hundreds or thousands of small dependencies and obscurities build up over time. Eventually, there are so many of these small issues that every possible change to the system is affected by several of them."

> "Of the three manifestations of complexity, unknown unknowns are the worst. An unknown unknown means that there is something you need to know, but there is no way for you to find out what it is, or even whether there is an issue. You won't find out about it until bugs appear after you make a change."

> "Cognitive load: The second symptom of complexity is cognitive load, which refers to how much a developer needs to know in order to complete a task."

> "Complexity is more apparent to readers than writers."

> "The overall complexity of a system (C) is determined by the complexity of each part p (cp) weighted by the fraction of time developers spend working on that part (tp). Isolating complexity in a place where it will never be seen is almost as good as eliminating the complexity entirely."

> "the greatest limitation in writing software is our ability to understand the systems we are creating."

> "The first approach is to eliminate complexity by making code simpler and more obvious." / "The second approach to complexity is to encapsulate it, so that programmers can work on a system without being exposed to all of its complexity at once. This approach is called modular design."

> "Overall, the best way to reduce bugs is to make software simpler."

> "In order for an element to provide a net gain against complexity, it must eliminate some complexity that would be present in the absence of the design element."

### P2 · Strategic, Not Tactical (ch. 3)

> "The first step towards becoming a good software designer is to realize that working code isn't enough. It's not acceptable to introduce unnecessary complexities in order to finish your current task faster. The most important thing is the long-term structure of the system."

> "If you program tactically, each programming task will contribute a few of these complexities. Each of them probably seems like a reasonable compromise in order to finish the current task quickly. However, the complexities accumulate rapidly, especially if everyone is programming tactically."

**The tactical tornado, in full:**

> "Almost every software development organization has at least one developer who takes tactical programming to the extreme: a tactical tornado. The tactical tornado is a prolific programmer who pumps out code far faster than others but works in a totally tactical fashion. When it comes to implementing a quick feature, nobody gets it done faster than the tactical tornado. In some organizations, management treats tactical tornadoes as heroes. However, tactical tornadoes leave behind a wake of destruction. They are rarely considered heroes by the engineers who must work with their code in the future. Typically, other engineers must clean up the messes left behind by the tactical tornado, which makes it appear that those engineers (who are the real heroes) are making slower progress than the tactical tornado."

> "Good design doesn't really take much longer than quick-and-dirty design, once you know how."

**The AI link (S-C — this is Orosz's summary of the conversation, not verbatim Ousterhout):**

> "Currently, AI coding tools and agents are akin to 'tactical tornadoes' that code fast, fix issues fast… while creating new issues and adding tech debt. John doesn't see the current tools being able to replace high-level design. And so software design could be more important than before – thanks to more code being written than before!"

> "AI code generation could mirror the work of 'tactical tornadoes' who prioritize quick output, often leading to maintainability challenges."

> "The explosion of AI coding could make software design more important than before."

### P3 · Modules Should Be Deep (ch. 4)

> "Methods containing hundreds of lines of code are fine if they have a simple signature and are easy to read. These methods are deep (lots of functionality, simple interface), which is good."

> "Deep classes are more efficient than shallow ones, because they get more work done for each method call. Shallow classes result in more layer crossings, and each layer crossing adds overhead."

> "The extreme of the 'classes should be small' approach is a syndrome I call classitis, which stems from the mistaken view that 'classes are good, so more classes are better.' In systems suffering from classitis, developers are encouraged to minimize the amount of functionality in each new class: if you want more functionality, introduce more classes."

> "One of the most visible examples of classitis today is the Java class library. The Java language doesn't require lots of small classes, but a culture of classitis seems to have taken root in the Java programming community."

> "The best features are the ones you get without even knowing they exist."

> "The most fundamental problem in computer science is problem decomposition: how to take a complex problem and divide it up into pieces that can be solved independently."

**From Ousterhout's own web writing (S-B), section *Method Length*:**

> "The best methods are those that provide a lot of functionality but have a very simple interface: they replace a large cognitive load (reading the detailed implementation) with a much smaller cognitive load (learning the interface). I call these methods 'deep'."

> "I call these interfaces 'shallow': they don't help much in terms of reducing what the programmer needs to know."

> "However, like most ideas in software design, decomposition can be taken too far. As methods get smaller and smaller there is less and less benefit to further subdivision."

> "The amount of functionality hidden behind each interface drops, while the interfaces often become more complex."

### P4 · Information Hiding (ch. 5)

> "One of the most important elements of software design is determining who needs to know what, and when. When the details are important, it is better to make them explicit and as obvious as possible,"

> "When designing modules, focus on the knowledge that's needed to perform each task, not the order in which tasks occur."

> "one of the goals of software design is to reduce the number of dependencies and to make the dependencies that remain as simple and obvious as possible."

> "One of the most important elements of good software design is separating what matters from what doesn't matter. Structure software systems around the things that matter. For the things that don't matter as much, try to minimize their impact on the rest of the system. Things that matter should be emphasized and made more obvious; things that don't matter should be hidden as much as possible."

### P5 · General-Purpose Modules Are Deeper (ch. 6)

> "the sweet spot is to implement new modules in a somewhat general-purpose fashion. The phrase 'somewhat general-purpose' means that the module's functionality should reflect your current needs, but its interface should not. Instead, the interface should be general enough to support multiple uses."

> "specialized code should be cleanly separated from general-purpose code. This can be done by pushing the specialized code either up or down in the software stack."

> "Sometimes the best approach is to push specialization downwards. One example of this is device drivers."

**The counter-argument Ousterhout states in order to reject it** — directly relevant to doc 14 §3.2's defence of slicing, and worth reading before leaning too hard on "generalise on the second example":

> "some might argue that it's better to focus on today's needs, building just what you know you need, and specializing it for the way you plan to use it today. If you take the special-purpose approach and discover additional uses later, you can always refactor it to make it general-purpose. The special-purpose approach seems consistent with an incremental approach to software development."

> "Once you discover the need for an abstraction, don't create the abstraction in pieces over time; design it all at once (or at least enough to provide a reasonably comprehensive set of core functions)."

### P6 · Different Layers, Different Abstractions (ch. 7)

Red-flag definitions only (see §3 above): *Pass-Through Method*, and from the chapter, pass-through variables. No additional chapter quote was collected.

### P7 · Pull Complexity Downward (ch. 8)

> "Most modules have more users than developers, so it is better for the developers to suffer than the users. As a module developer, you should strive to make life as easy as possible for the users of your module, even if that means extra work for you. Another way of expressing this idea is that it is more important for a module to have a simple interface than a simple implementation."

> "Your job as a developer is not just to create code that you can work with easily, but to create code that others can also work with easily."

### P8 · Better Together Or Better Apart (ch. 9)

> "You shouldn't break up a method unless it makes the overall system simpler;"

> "Sometimes an approach that requires more lines of code is actually simpler, because it reduces cognitive load."

**From S-B, on entanglement — the clearest statement of *Conjoined Methods*:**

> "Two methods are entangled (or 'conjoined' in APOSD terminology) if, in order to understand how one of them works internally, you also need to read the code of the other."

> "Entangled methods can usually be improved by combining them so that all the code is in one place."

> "If two pieces of code are tightly related, the solution is to bring them together. Separating the pieces, even in physically adjacent methods, makes the code harder to understand."

> "To me, all of the methods in `PrimeGenerator` are entangled: in order to understand the class I had to load all of them into my mind at once."

### P9 · Define Errors Out Of Existence (ch. 10)

> "Define errors out of existence" — *Summary of Design Principles*

> "In general, simpler code tends to run faster than complex code. If you have defined away special cases and exceptions, then no code is needed to check for those cases and the system runs faster."

**Caveat, from S-C (Orosz's summary):**

> "The tactical approach is trying to 'define errors out of existence' by designing systems to prevent certain errors from occurring. Be careful of simply ignoring necessary error checks though!"

*(No stronger chapter-10 quotation was found on pages 1–3 of S-A. If a better one is wanted, pages 4–7 are unread.)*

### P10 · Design It Twice (ch. 11)

> "I have noticed that the design-it-twice principle is sometimes hard for really smart people to embrace. When they are growing up, smart people discover that their first quick idea about any problem is sufficient for a good grade; there is no need to consider a second or third possibility. This tends to result in bad work habits. However, as these people get older, they get promoted into environments with harder and harder problems. Eventually, everyone reaches a point where your first ideas are no longer good enough; if you want to get really great results, you have to consider a second possibility, or perhaps a third, no matter how smart you are. The design of large software systems falls in this category: no-one is good enough to get it right with their first try."

> "Try to pick approaches that are radically different from each other; you'll learn more that way. Even if you are certain that there is only one reasonable approach, consider a second design anyway, no matter how bad you think it will be. It will be instructive to think about the weaknesses of that design and contrast them with the features of other designs."

> "Designing it twice does not need to take a lot of extra time. For a smaller module such as a class, you may not need more than an hour or two to consider alternatives. This is a small amount of time compared to the days or weeks you will spend implementing the class. The initial design experiments will probably result in a significantly better design, which will more than pay for the time spent designing it twice."

> "Unfortunately, I often see smart people who insist on implementing the first idea that comes to mind, and this causes them to underperform their true potential (it also makes them frustrating to work with)."

**Note for the workflow:** *"consider a second design anyway, no matter how bad you think it will be"* is in tension with doc 14's S15, which treats "trivial slice — no alternative required" as a passing outcome, precisely to avoid training fabricated strawmen. The book's position is stricter than the workflow's. Worth a conscious decision if S15 is ever tightened.

### P11 · Comments Describe What The Code Cannot (ch. 12–13)

> "The overall idea behind comments is to capture information that was in the mind of the designer but couldn't be represented in the code."

> "Some people believe that if code is written well, it is so obvious that no comments are needed. This is a delicious myth, like a rumor that ice cream is good for your health: we'd really like to believe it! Unfortunately, it's simply not true."

> "Comments augment the code by providing information at a different level of detail. Some comments provide information at a lower, more detailed, level than the code; these comments add precision by clarifying the exact meaning of the code. Other comments provide information at a higher, more abstract, level than the code; these comments offer intuition, such as the reasoning behind the code, or a simpler and more abstract way of thinking about the code."

> "The first step in documenting abstractions is to separate interface comments from implementation comments. Interface comments provide information that someone needs to know in order to use a class or method; they define the abstraction. Implementation comments describe how a class or method works internally in order to implement the abstraction. It's important to separate these two kinds of comments, so that users of an interface are not exposed to implementation details."

> "If you want code that presents good abstractions, you must document those abstractions with comments."

> "In-code documentation plays a crucial role in software design. Comments are essential to help developers understand a system and work efficiently, but the role of comments goes beyond this. Documentation also plays an important role in abstraction; without comments, you can't hide complexity."

> "Inadequate documentation creates a huge and unnecessary drag on software development."

> "Developers should be able to understand the abstraction provided by a module without reading any code other than its externally visible declarations."

> "When documenting a variable, think nouns, not verbs."

> "When writing comments, try to put yourself in the mindset of the reader and ask yourself what are the key things he or she will need to know."

**A counterweight worth keeping in view — more documentation is not automatically better:**

> "If a system has a clean and obvious design, then it will need less documentation. The need for extensive documentation is often a red flag that the design isn't quite right."

**From S-B (Ousterhout's own web writing), section *Comments*:**

> "The problem is that there is a lot of important information that simply cannot be expressed in code. By adding comments to fill in this missing information, developers can make code dramatically easier to read."

> "Abstraction is one of the most important components of good software design. I define an abstraction as 'a simplified way of thinking about something that omits unimportant details.'"

> "It should be possible to use a method without reading its code. The way we achieve this is by writing a header comment that describes the method's *interface*."

> "If the method is well designed, the interface will be much simpler than the code of the method (it omits implementation details), so the comments reduce the amount of information people must have in their heads."

> "I believe that it is not possible to define interfaces and create abstractions without a lot of comments."

> "Comments often contain qualitative information such as *why* something is being done, or the overall idea of something. English works better for these than code because it is a more expressive language."

> "For me the cost of missing comments is easily 10-100x the cost of incorrect comments."

> "It is our professional responsibility to do the best we can to convey that knowledge in comments, so that readers do not have to reconstruct it over and over."

> "Most methods I write have no comments in the body, just a header comment describing the interface." *(from his rewrite of `PrimeGenerator`)*

### P12 · Comments As Design (ch. 15 — *Write The Comments First*)

> "Writing the comments first makes documentation part of the design process. Not only does this produce better documentation, but it also produces better designs and it makes the process of writing documentation more enjoyable."

> "the process of writing comments, if done correctly, will actually improve a system's design. Conversely, a good software design loses much of its value if it is poorly documented."

### P13 · Choosing Names (ch. 14)

> "Selecting names for variables, methods, and other entities is one of the most underrated aspects of software design. Good names are a form of documentation: they make code easier to understand. They reduce the need for other documentation and make it easier to detect errors. Conversely, poor name choices increase the complexity of code and create ambiguities and misunderstandings that can result in bugs."

> "The greater the distance between a name's declaration and its uses, the longer the name should be." *(via S-E — paraphrase risk, not used in doc 14)*

### P14 · Consistency (ch. 17)

> "Consistency creates cognitive leverage: once you have learned how something is done in one place, you can use that knowledge to immediately understand other places that use the same approach. If a system is not implemented in a consistent fashion, developers must learn about each situation separately. This will take more time."

> "Don't change existing conventions. Resist the urge to 'improve' on existing conventions. Having a 'better idea' is not a sufficient excuse to introduce inconsistencies. Your new idea may indeed be better, but the value of consistency over inconsistency is almost always greater than the value of one approach over another."

### P15 · Code Should Be Obvious (ch. 18)

> "One of the most important goals of good design is for a system to be obvious."

> "If code is obvious, a reader doesn't need to spend much time or effort to gather all the information they need to work with the code. If code is not obvious, then a reader must expend a lot of time and energy to understand it. Not only does this reduce their efficiency, but it also increases the likelihood of misunderstanding and bugs. Obvious code needs fewer comments than nonobvious code."

> "If your code is undergoing review and a reviewer tells you that something is not obvious, don't argue with them; if a reader thinks it's not obvious, then it's not obvious. Instead of arguing, try to understand what they found confusing and see if you can clarify that, either with better comments or better code."

**Relevant to an unattended run:** the only stated test for obviousness is *another reader*. In this experiment there is none until the judges arrive, which is an argument for E1 being a genuinely fresh session rather than a continuation.

### P16 · Increments Are Abstractions, Not Features (ch. 16 & 19)

> "Developing incrementally is generally a good idea, but the increments of development should be abstractions, not features. It's fine to put off all thoughts about a particular abstraction until it's needed by a feature. Once you need the abstraction, invest the time to design it cleanly; follow the advice of Chapter 6 and make it somewhat general-purpose."

> "If you want to maintain a clean design for a system, you must take a strategic approach when modifying existing code. Ideally, when you have finished with each change, the system will have the structure it would have had if you had designed it from the start with that change in mind. To achieve this goal, you must resist the temptation to make a quick fix."

> "Even if your particular change doesn't require refactoring, you should still be on the lookout for design imperfections that you can fix while you're in the code. Whenever you modify any code, try to find a way to improve the system design at least a little bit in the process. If you're not making the design better, you are probably making it worse."

> "Because software is so malleable, software design is a continuous process that spans the entire lifecycle of a software system; this makes software design different from the design of physical systems such as buildings, ships, or bridges."

**The agile warning, in full — the failure mode doc 14's slice loop has to avoid:**

> "One of the risks of agile development is that it can lead to tactical programming. Agile development tends to focus developers on features, not abstractions, and it encourages developers to put off design decisions in order to produce working software as soon as possible. For example, some agile practitioners argue that you shouldn't implement general-purpose mechanisms right away; implement a minimal special-purpose mechanism to start with, and refactor into something more generic later, once you know that it's needed. Although these arguments make sense to a degree, they argue against an investment approach, and they encourage a more tactical style of programming. This can result in a rapid accumulation of complexity."

---

## 5. The waterfall / big-design-up-front material

Directly supports doc 14 §3.2's argument for slices — **in Ousterhout's own words**, which is worth knowing given the rest of this file cuts the other way:

> "the waterfall model rarely works well for software. Software systems are intrinsically more complex than physical systems; it isn't possible to visualize the design for a large software system well enough to understand all of its implications before building anything. As a result, the initial design will have many problems. The problems do not become apparent until implementation is well underway."

> "it isn't possible to visualize a complex system well enough at the outset of a project to determine the best design. The best way to end up with a good design is to develop a system in increments, where each increment adds a few new abstractions and refactors existing abstractions based on experience."

**This second quotation is the strongest single sentence in support of the whole slice model** — "each increment adds a few new abstractions **and refactors existing abstractions based on experience**" is L2 and L6 respectively, from the man himself.

---

## 6. The TDD problem — everything gathered in one place

This is the section that prompted **Q5** in doc 14 §10.

> **RESOLVED, 2026-07-27 (Steve).** The **L3-before-L4 ordering stays; the *TDD* label goes.** Reasoning: Ousterhout's objection is to *tests driving the design*, and in this workflow the **design** drives the development — L2 designs the whole slice against the Guides before any check exists, and L4 builds what L2 designed rather than the minimum that turns a check green. The failing check survives on the narrower ground that a check never observed failing is not yet evidence of anything. Nothing in doc 14, in any command file, or in the built system's own documentation may describe the process as test-driven. See doc 14 §2.3 and §5.4; the cycle is **DESIGN → CHECK-FAILS → CODE → REFACTOR → VERIFY**.

The evidence that produced that decision is kept below in full.

**From the book (S-A), ch. 19 *Software Trends*:**

> "The problem with test-driven development is that it focuses attention on getting specific features working, rather than finding the best design. This is tactical programming pure and simple, with all of its disadvantages. Test-driven development is too incremental: at any point in time, it's tempting to just hack in the next feature to make the next test pass. There's no obvious time to do design, so it's easy to end up with a mess."

**The one exception he grants:**

> "One place where it makes sense to write the tests first is when fixing bugs. Before fixing a bug, write a unit test that fails because of the bug."

**From Ousterhout's own web writing (S-B), section *Test-Driven Development*:**

> "However, I am not a fan of Test-Driven Development (TDD), which dictates that tests must be written before code and that code must be written and tested in tiny increments. This approach has serious problems without any compensating advantages that I have been able to identify."

> "The fundamental problem with TDD is that it forces developers to work too tactically, in units of development that are too small; it discourages design thinking."

> "With TDD the basic unit of development is one test: first the test is written, then the code to make that test pass. However, the natural units for design are larger than this: a class or method."

> "If a developer thinks only about the next test, they are only considering part of a design problem at any given time. It's hard to design something well if you don't think about the whole design problem at once."

> "TDD explicitly prohibits developers from writing more code than is needed to pass the current test; this discourages the kind of strategic thinking needed for good design."

> "TDD guarantees that developers will initially write bad code."

**His stated alternative — "bundling":**

> "The approach I prefer is one where the developer works in somewhat larger units than in TDD, perhaps a few methods or a class. The developer first writes some code (anywhere from a few tens of lines to a few hundred lines), then writes unit tests for that code."

> "I believe that the bundling approach is superior to TDD because it focuses the development process around design: design first, then code, then write unit tests."

**And he is not against testing itself:**

> "It used to be that developers rarely wrote tests. If tests were written at all, they were written by a separate QA team. However, one of the tenets of agile development is that testing should be tightly integrated with development, and programmers should write tests for their own code. This practice has now become widespread."

**From the interview (S-C — Orosz's summary):**

> "John firmly believes that TDD is counter-productive because it forces thinking about the small details before thinking about the high-level design. This observation could explain why TDD has not gained much traction in the last decade or so!"

> "Instead of TDD, he suggests focusing development on abstractions rather than individual tests. The one place when writing tests first is helpful: when fixing bugs!"

### What this means for the workflow

| | |
|---|---|
| **The contradiction** | Doc 14 §5.4 orders L3 (failing tests) before L4 (implementation). That is the ordering Ousterhout calls "tactical programming pure and simple". |
| **The mitigation already present** | The workflow's unit of development is a **whole vertical slice**, and **L2 designs the slice before any test is written**. Ousterhout's objection is specifically that TDD leaves "no obvious time to do design" — the slice loop has a dedicated stage for it. On his own criterion, that is the crux of the objection answered. |
| **What remains** | *"design first, then code, then write unit tests"* is his order. The workflow does design first, then **tests**, then code. The disagreement is now narrow — one stage swap — but it is real, and it is in the part of the loop that runs N times. |
| **Bundling would look like** | L2 Design → L3 Implement → L4 Test → L5 Check → L6 Refactor → L7 Commit. Same seven stages, two of them swapped. |
| **Cost of switching** | Loses the RED-proves-the-test-can-fail property, which is doc 14's stated guard against tests written to agree with code that already exists (§5.4). That property is *more* valuable here than in normal development, because the same unattended process writes both the code and the tests with nobody reviewing either — the exact concern S18 exists for. |
| **Cost of not switching** | A workflow named `birgitta-ousterhout-full-build`, whose Guides are APoSD principles, ships a stage ordering its namesake has published an argument against. If the write-up reaches John, this is the first thing he will notice. |

**Outcome:** neither (a) as originally framed nor (b). The ordering of (a) was kept, but the *justification* changed — and with it the vocabulary. The workflow is not doing TDD-with-a-disclaimer; it is doing design-driven development in which a failing check is the entry condition for writing code. That distinction is why L4's instruction is **build what L2 designed**, not *write the minimum to pass*, which removes the specific thing Ousterhout objects to (*"TDD explicitly prohibits developers from writing more code than is needed to pass the current test"*) rather than merely apologising for it.

---

## 7. Other material worth keeping

**On design patterns** — relevant to any Guide that recommends a pattern:

> "The greatest risk with design patterns is over-application. Not every problem can be solved cleanly with an existing design pattern; don't try to force a problem into a design pattern when a custom approach will be cleaner."

> "One of the risks of establishing a design pattern is that developers assume the pattern is good and try to use it as much as possible. This has led to overusage of getters and setters in Java."

**On moderation** — quoted in doc 14 §2.4, and the single best counterweight to an over-zealous automated refactor stage:

> "When applying the ideas from this book, it's important to use moderation and discretion. Every rule has its exceptions, and every principle has its limits. If you take any design idea to its extreme, you will probably end up in a bad place. Beautiful designs reflect a balance between competing ideas and approaches."

**On why the problems are hard** — worth a line in a command file that tells an agent to design something twice:

> "It isn't that you aren't smart; it's that the problems are really hard! Furthermore, that's a good thing: it's much more fun to work on a difficult problem where you have to think carefully, rather than an easy problem where you don't have to think at all."

**On performance:**

> "not only does simplicity improve a system's design, but it usually makes systems faster."

**On Ousterhout's teaching method (S-C)** — of interest for how a review stage could be shaped:

> "John's software design course at Stanford uses a pedagogical approach modeled after English writing classes, emphasizing feedback and revision." … "John personally reviews every line of student code and provides detailed feedback" … "Students are encouraged to compare different solutions to the same problem developed by their peers."

**Fun fact worth knowing given where this Jira started (S-C):** at the time of the April 2025 interview Ousterhout was upstreaming **Homa** into the Linux kernel himself — the same protocol AHQ-192's research phase covered in docs 02–04.

---

## 8. Gaps in this research

Stated so nobody assumes coverage that isn't here:

- **Pages 4–7 of S-A are unread** (quotes 91–205 of 205). Chapter 10 (*Define Errors Out Of Existence*) and chapter 7 (*Different Layer, Different Abstraction*) are the two principles left with the thinnest quotations as a result.
- **The book itself was not consulted** — only publicly published excerpts of it. Page numbers above are as given at source and are first-edition.
- **The second edition's changes were not researched** beyond Ousterhout's note that he expanded the general-purpose-modules material because *"the importance of choosing general-purpose approaches has become even more clear to me"* (S-D, via a summarising fetch — treat as indicative, not verbatim).
- **No video/podcast transcript was read.** The Talks-at-Google lecture and the full interview audio may contain better AI-specific material than the written summary in S-C.
