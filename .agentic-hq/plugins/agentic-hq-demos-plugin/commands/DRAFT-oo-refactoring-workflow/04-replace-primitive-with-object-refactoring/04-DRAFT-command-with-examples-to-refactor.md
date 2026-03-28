# DRAFT Command: Replace Primitive with Object Refactoring

> **IMPORTANT**: This is a DRAFT of a single conversational command. In the final, real workflow plugin, this should almost certainly be split into **multiple separate commands** — e.g. one for Research/Discovery, one for Planning, one for Execution — so each can be run independently, resumed, and composed into a pipeline. Combining them here for prototyping and demonstration purposes only.

---

## Background: Why This Refactoring Matters

This command applies **Fowler's "Replace Primitive with Object" refactoring** (Refactoring R71) to cure **Primitive Obsession** — the code smell where raw primitives (`string`, `number`, `boolean`) are used to represent domain concepts that deserve their own types.

**Key references:**
- Martin Fowler, *Refactoring* (1999/2018) — Chapter 3 "Bad Smells in Code", Refactoring R71
- Eric Evans, *Domain-Driven Design* (2003) — Chapter 5 "Value Objects"
- Kent Beck / Ward Cunningham, *CHECKS Pattern Language* — "Whole Value" pattern

**Why wrap primitives in classes, even if they have no behaviour yet?**
1. **Type safety** — `send(Email, Money)` can't swap arguments like `send(string, number)` can
2. **Single source of truth** — Validation lives in the constructor, not scattered everywhere
3. **Self-documenting** — `WorkflowMissionId` is clearer than `string`
4. **Tell, Don't Ask** — Behaviour lives on the object, not in external functions
5. **Future-proofing** — When you need to add behaviour later, the class already exists

**The principle**: Every domain concept that gets passed around the system should be a class, not a primitive — even if it currently wraps a single value with no extra behaviour. The type name communicates intent, the compiler catches misuse, and you have a natural home for behaviour when it inevitably arrives.

---

## PHASE 1: Research & Discovery

You are an AI agent performing the Research phase of the "Replace Primitive with Object" refactoring.

### Instructions

1. **Scan the codebase** for Primitive Obsession. Search `src/` for:
   - Parameters and properties typed as `string` that represent domain concepts (IDs, paths, commands, names)
   - Functions taking multiple `string` parameters where types could be confused or swapped
   - `string[]` representing domain-specific collections (e.g. CLI arguments, skill paths)
   - `type Foo = string` aliases (halfway to a Value Object but without a class)
   - Return types of `string` that represent specific domain concepts

2. **For each discovery**, document:
   - **File path and line number**
   - **Current type** (e.g. `string`, `string[]`)
   - **Domain concept it represents** (e.g. "I/O marshalling session identifier")
   - **Suggested Value Object class name** (e.g. `MarshallingId`)
   - **Why it matters** — what bug or confusion could the primitive cause?

3. **Prioritise** findings by impact:
   - **HIGH**: Parameters that could be swapped/confused with other same-typed parameters (e.g. two `string` params side by side)
   - **HIGH**: Domain concepts used across multiple files/interfaces (widespread primitive)
   - **MEDIUM**: Concepts that would benefit from validation in the constructor
   - **LOW**: Concepts used in a single location with no ambiguity risk

### Known Examples From This Codebase

The following have already been identified as candidates. Verify these still exist and find additional ones:

| # | Domain Concept | Current Type | Location | Suggested Value Object |
|---|---|---|---|---|
| 1 | I/O Session ID | `marshallingId: string` | `src/interfaces/marshalled-io-cli-command-builder.ts` | `MarshallingId` |
| 2 | AI Skill Command | `aiToolCommand: string` | `src/tools/marshalled-io-tools/claude-code/claude-command-builder.ts` | `AIToolCommand` |
| 3 | Skill Invocation Path | `skillPath: string` | `src/runtime/default-runtime.ts`, `src/interfaces/runtime.ts` | `SkillPath` |
| 4 | Tool Command (ambiguous name) | `command: string` | `src/interfaces/tool.ts`, `src/tools/marshalled-io-tools/marshalled-cli-tool.ts` | `ToolCommand` |
| 5 | Tool Input Data | `input: string` | `src/interfaces/tool.ts` | `ToolInput` |
| 6 | Executable Name | `executable: string` | `src/interfaces/cli-command.ts`, `src/io/terminal/default-cli-command.ts` | `ExecutableName` |
| 7 | Working Directory | `currentWorkingDirectory: string` | `src/interfaces/cli-wrapper.ts`, `src/io/terminal/pty-cli-wrapper.ts` | `WorkingDirectory` |
| 8 | Skill Aliases/Names | `shortName: string`, `fullPath: string` etc. | `src/demo/demo-workflow-skills-registry.ts` | `SkillAlias`, `SkillFullPath` |
| 9 | Config Directory Path | `getConfigDir(): string` | `src/interfaces/agentic-hq-installation.ts` | `ConfigDirectory` |
| 10 | CLI Passthrough Arguments | `passthroughArgs: string[]` | `src/runtime/default-runtime.ts`, `src/interfaces/runtime.ts` | `PassthroughArgs` |

### Key Observations To Verify

- **Type ambiguity**: `skillPath`, `skillCommand`, `aiToolCommand`, `command` are all `string` but represent different concepts. Easy to pass the wrong one.
- **Multiple path types**: `currentWorkingDirectory`, `configDir`, `root`, `tempDir` are all `string` but have different validation rules and semantics.
- **Safety**: `passthroughArgs` requires `shellEscape()` which callers could forget; `executable` could be vulnerable to injection.

---

## STOP: Discuss Discoveries With Human

**You MUST stop here and present your findings to the human before proceeding.**

Present:
1. A summary table of all Primitive Obsession instances found (including any new ones beyond the known examples above)
2. Your prioritisation (HIGH / MEDIUM / LOW) for each
3. Any patterns you noticed (e.g. "all ID types are strings", "all path types are strings")
4. Your recommendation for which ones to tackle first and why

Ask the human:
- "Which of these do you want to refactor in this session?"
- "Are there any I've missed that you know about?"
- "Do you want to tackle them all, or start with the highest-priority ones?"
- "Any naming preferences for the Value Object classes?"

**Do NOT proceed to Phase 2 until the human has reviewed and approved the discovery list.**

---

## PHASE 2: Plan the Refactoring

You are now planning the refactoring based on the discoveries approved by the human.

### Instructions

For each approved Value Object, plan:

1. **Class design:**
   - Class name and file location (co-locate with primary consumer, NOT in a barrel `interfaces/` dir)
   - Constructor: what validation (if any) to add
   - `toString()` method (for logging/debugging — returns the wrapped value)
   - `equals()` method if the concept needs value equality
   - Whether to add `Object.freeze(this)` (yes for immutable concepts like IDs and paths)
   - Interface vs. concrete class (prefer concrete class unless there's a clear need for multiple implementations)

2. **Migration path:**
   - Which files import/use the current primitive
   - What changes to each consumer (constructor params, method signatures, property types)
   - What changes to tests (constructing Value Objects instead of passing raw strings)
   - Whether any existing validation logic scattered in consumers should move into the Value Object constructor

3. **Execution order:**
   - Start with the most widely-used primitives (biggest bang for the buck)
   - Do one Value Object at a time — create class, update all consumers, run tests, commit
   - Follow TDD: write a test for the Value Object first, then implement it

4. **Value Object template** — each class should follow this pattern:

```typescript
/**
 * {ClassName} - Value Object representing {domain concept description}.
 *
 * Wraps a raw {primitive type} to provide type safety and prevent
 * accidental confusion with other {primitive type} parameters.
 */
export class {ClassName} {
  private readonly value: {primitive type};

  constructor(value: {primitive type}) {
    // Add validation here if the domain concept has rules
    // e.g. if (value.trim().length === 0) throw new Error('{ClassName} cannot be empty');
    this.value = value;
    Object.freeze(this);
  }

  /** Returns the underlying {primitive type} value. */
  toString(): string {
    return String(this.value);
  }

  /** Value equality — two {ClassName}s are equal if their values match. */
  equals(other: {ClassName}): boolean {
    return this.value === other.value;
  }
}
```

### Output

Present a numbered list of refactoring steps, e.g.:

```
1. Create `MarshallingId` class at src/io/marshalling/marshalling-id.ts
   - Wraps string, validates non-empty
   - Consumers: MarshalledIOCLICommandBuilder.build(), ClaudeCommandBuilder.build(), IOMarshallerSession.getMarshallingId()
   - Tests: Update 3 test files to construct MarshallingId instead of passing raw string

2. Create `AIToolCommand` class at src/tools/ai-tool-command.ts
   - Wraps string, validates non-empty
   - Consumers: Tool.execute(), MarshalledCLITool.execute(), ClaudeCommandBuilder.build()
   ...
```

---

## STOP: Discuss Refactoring Plan With Human

**You MUST stop here and present your plan to the human before proceeding.**

Present:
1. The full refactoring plan (numbered steps)
2. The execution order and rationale
3. Estimated number of files that will change per Value Object
4. Any risks or concerns (e.g. "this will touch 15 files across 4 modules")

Ask the human:
- "Does this plan look right?"
- "Do you want to change the order?"
- "Any Value Objects you want to skip for now?"
- "Should we do this incrementally (one Value Object per commit) or batch them?"

**Do NOT proceed to Phase 3 until the human has reviewed and approved the plan.**

---

## PHASE 3: Execute the Refactoring

You are now executing the approved refactoring plan. Follow TDD strictly.

### Instructions

For **each** Value Object in the approved plan:

#### RED Phase
1. Write a unit test for the new Value Object class:
   - Test construction with valid value
   - Test `toString()` returns the wrapped value
   - Test `equals()` for matching and non-matching values
   - Test validation rejects invalid values (if validation was planned)
   - Test `Object.freeze()` prevents mutation
2. Run the test — verify it **fails** (class doesn't exist yet)
3. Verify the failure is the **expected** failure (import error / class not found)

#### GREEN Phase
1. Create the Value Object class (following the template from Phase 2)
2. Run the test — verify it **passes**
3. Update all consumers identified in the plan:
   - Change parameter types from primitive to Value Object
   - Update constructors, method signatures, property types
   - Update call sites to wrap raw values in `new ValueObject(rawValue)`
   - Update test files to construct Value Objects
4. Run **all tests** — verify everything passes
5. Run `pnpm validate` — verify typecheck + lint + tests all pass

#### REFACTOR Phase
1. Look for opportunities to:
   - Move scattered validation logic into the Value Object constructor
   - Simplify consumer code now that the type is explicit
   - Remove any comments that were explaining what a string parameter "really was"
2. Run all tests again after refactoring

#### Commit
1. Tell the human: "Ready to commit the {ClassName} Value Object. Please run `/commit` when ready."
2. Wait for the human to commit before proceeding to the next Value Object.

### Rules During Execution

- **One Value Object per TDD cycle** — do NOT batch multiple Value Objects
- **Run tests after every change** — not just at the end
- **Do NOT skip the REFACTOR phase** — it's part of TDD
- **Do NOT modify tests between RED and GREEN** — if the test is wrong, start the cycle over
- **Follow CLAUDE.md rules** — especially "run code before AND after modifications"
- **If any test fails unexpectedly** — STOP, investigate, fix before continuing
