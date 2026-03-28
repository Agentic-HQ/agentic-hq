Please read:

docs/jira-docs/AHQ-83/beads-implementation/10-a-prompt-to-create-full-report-to-help-another-agent-remove-microkernal-changes.md
and
docs/jira-docs/AHQ-83/beads-implementation/10-b-claude-report-detailing-full-system-state-for-another-agent-to-use-to-remove-microkernal.md

and then decide what other things you need to investigate in order to create and execute a full Plan to remove the microkernal code.

At the end I want:
- The brilliant refactoring that was done to remain - in terms of dependency injection and SRP comments etc etc
- The additional files that were added (not related to microkernal or refactoring)
- The files identified that are "microkernal" ones to be removed and replaced with "hard coded" implementation.  We are basically removing all the functionality that was added that allows a developer to override classes with their own using config.  Also removing demo code that demonstrates that ability and the tests that test those features/modules.

Please also:

- Note that I just ran: "pnpm validate" works fine and "pnpm demo:plugin-direct:string-reversal" and they both work fine.
- Add a "Step 0" to copy the **approved** plan to docs/jira-docs/AHQ-83/beads-implementation/10-d-copy-of-plan-for-removal.md
- Add a second to last step to confirm "pnpm validate" works fine and "pnpm demo:plugin-direct:string-reversal" works fine.
- Add a final step to the plan (after all the work is done) to write a new docs/jira-docs/AHQ-83/beads-implementation/10-e-refactored-architecture-without-microkernal.md that describes in detail with 2 nice diagrams like in 10-b-claude-report-detailing-full-system-state-for-another-agent-to-use-to-remove-microkernal.md the final architecture.  Also please include and end-to-end "plain English language" description in sentences (as a paragraph or two) of the entire system with the concepts/interfaces in Bold that are used in the system.  This should show how the system is now easily understood by the concepts that are codified in the Interface names that we have refactored to.  If it doesn't read fluently and clearly we'll know we have to do more refactoring (later... not now).

---

## UPDATE (added during planning session)

**Key insight from planning:** We don't actually want to "remove" the Microkernel code. We want to **simplify** it. The Microkernel's modular wiring structure is good — it's a proper Composition Root that creates workspace objects, wires the dependency chain, and produces a ready-to-use `WorkflowCommandBuilder`. What we want to remove is the **config-driven dynamic loading** (JSON config files, `await import()`, factory wrapper modules, `defu` deep-merging, override configs).

The simplified Microkernel becomes a **CompositionRoot** — same wiring, but with direct `new` calls instead of dynamic imports. This also eliminates the code duplication between `Microkernel` and `DefaultClaudeCodeTool`, which both independently created the same workspace → sessionFactory → cliWrapper → MarshalledCLITool chain.

### Dependency Chain Diagram (showing the duplication problem)

```
                    ┌─ DefaultGitWorkspace ─┐
                    │                       │
          DefaultAgenticHq          DefaultUserProject
          Installation              Workspace
                │                       │
        ClaudeCommand           JsonFileIOMarshaller
        Builder                 SessionFactory
                │                       │
                └───────┬───────────────┘
                        │
    PtyCLIWrapper ──── MarshalledCLITool ◄── DefaultClaudeCodeTool wraps THIS
    (= CLIWrapper)      (= Tool)              (used by 4 demo plugins + tests)
                        │
                        │  ← CLI entry point needs MORE:
                        ▼
          ClaudeWorkflowCommandBuilder ◄── needs tool + cliWrapper + workspace
                        │
                        ▼
               createProgram(builder, registry)
```

### Solution: Single Composition Root (eliminates duplication)

```
     ┌──────────────────────────────────────────────────┐
     │  CompositionRoot (simplified Microkernel)         │
     │  File: src/kernel/composition-root.ts             │
     │                                                   │
     │  constructor():                                   │
     │    Creates GitWorkspace, Installation,             │
     │    Workspace, SessionFactory, CLIWrapper,          │
     │    MarshalledCLITool — ALL via direct new calls    │
     │                                                   │
     │  Exposes:                                         │
     │    .tool: Tool                                    │
     │    .cliWrapper: CLIWrapper                        │
     │    .workspace: UserProjectWorkspace                │
     │                                                   │
     │  createWorkflowCommandBuilder():                  │
     │    → new ClaudeWorkflowCommandBuilder(...)         │
     └──────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
     DefaultClaudeCodeTool        CLI entry point
     (for demos/tests):           (for the program):

     const root = new             const root = new
       CompositionRoot();           CompositionRoot();
     this.tool = root.tool;       const builder = root
                                    .createWorkflowCommand
                                    Builder();
                                  createProgram(builder,
                                    registry).parse();
```

See `10-d-copy-of-plan-for-removal.md` for the full approved implementation plan.

