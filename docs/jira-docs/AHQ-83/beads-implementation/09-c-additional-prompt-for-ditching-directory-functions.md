I've been working hard to refactor everything in this project to interfaces and concrete classes and make the entire thing work in a nicely OO manner.  The only thing that sticks out like a sore thumb as non-OO is src/utils/directory/directory-functions.ts - please investigate how it's used and whether we could introduce a new concept that is currently missing or concepts that are missing - I'm thinking of things like:
UserWorkspace
AHQProjectWorkspace
etc etc.
I've realised that these functions allow state to be obtained/changed deep within code/objects - which I think is a "code smell".  It means if I want to write Unit Test I can't set up the right objects and just "inject" them - I have to worry about side effects and what these directory functions will return in a "hidden" way.  It seems more right to be setting these things **on startup** at the edges of the system in some kind of object and then injecting them through the system in a very clear and open way that is easy to see and control.  Please ask Perplexity about the correct OO way of doing this kind of thing - do we want to have some kind of "system state" object that passed around explicitely (and not pulled out of the background somewhere hidden deep within an object's methods)

Please do some analysis, and come up with where these functions are used, and how, what concepts could be missing and lets have a discussion about them.



Request to Perplexity: 

You've hit on a really important architectural point. Let me research this properly and analyse the codebase simultaneously.
                                                 
  Task(Research OO patterns for system config)
  ⎿  Prompt:                                                                                                                                                                                                   
       Use Perplexity MCP to research the following question thoroughly:
                                                                                                                                                                                                               
       "In object-oriented architecture, what is the correct pattern for handling system-level configuration like directory paths (workspace roots, temp dirs, plugin dirs) that are currently implemented as
       free functions with hidden side effects (calling execSync('git rev-parse'), reading process.env)?                                                                                                       
                                                                                                                                                                                                             
       Specifically:                                                                                                                                                                                           
       1. Is there a well-known OO pattern for creating a 'system context' or 'environment' object at startup at the edges of the system, and then injecting it through the object graph explicitly?         
       2. What are the arguments against free functions that reach into global state (env vars, shell commands) deep inside objects vs. explicit dependency injection of a context/environment object?
       3. What are the relevant design patterns? (e.g., Context Object pattern, Environment Abstraction, Composition Root pattern)
       4. How does this relate to the Ports & Adapters / Hexagonal Architecture approach?
       5. What should this kind of object be called? 'Environment', 'SystemContext', 'Workspace', 'AppContext'?
       6. Should it be one object or multiple (e.g., separate 'AgenticHqInstallation' and 'UserProjectWorkspace')?

       The context is: we have a TypeScript project being refactored to clean OO with interfaces and dependency injection. We currently have free functions like getAgenticHqWorkspaceRoot(),
       getAgenticHqPluginsDir(), getCurrentWorkspaceRoot(), getAgenticHqTempDir(), getProjectWorkingDir() that internally call execSync('git rev-parse --show-toplevel') and read
       process.env.AGENTIC_HQ_WORKSPACE_ROOT. These are called deep inside objects like command builders and marshaller sessions, creating hidden dependencies that make unit testing harder."

       Return the full Perplexity response - do NOT summarise it.

     ❯ Use Perplexity MCP to research the following question thoroughly:                                                                                                                                       

                                                  
     perplexity-ask - perplexity_ask (MCP)(messages: [{"role":"system","content":"You are a software architecture expert specializing in object-oriented design patterns, dependency injection, and clean
                                                  
                                                  






                                                  Final response:

                                                  ⏺ OK, I now have a complete picture. Here's my analysis.                                                                                                                                                       
                                                                                                                                                                                                             
  ---                                                                                                                                                                                                          
  Analysis: The Hidden State Problem in directory-functions.ts                                                                                                                                                 
                                                                                                                                                                                                               
  What exists today                                                                                                                                                                                            
                                                                                                                                                                                                             
  Five free functions in src/utils/directory/directory-functions.ts that internally call execSync('git rev-parse --show-toplevel') and read process.env.AGENTIC_HQ_WORKSPACE_ROOT:
  ┌─────────────────────────────┬────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
  │          Function           │            What it returns             │                                  Called by                                  │
  ├─────────────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ getAgenticHqWorkspaceRoot() │ AHQ installation root                  │ microkernel-config-loader.ts (line 42), claude-command-builder.ts (line 81) │
  ├─────────────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ getAgenticHqPluginsDir()    │ AHQ root + .agentic-hq/plugins         │ Nobody currently (only tests)                                               │
  ├─────────────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ getCurrentWorkspaceRoot()   │ git root of CWD                        │ Used internally                                                             │
  ├─────────────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ getAgenticHqTempDir()       │ User's project root + .agentic-hq/temp │ json-file-io-marshaller-session.ts (line 51)                                │
  ├─────────────────────────────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ getProjectWorkingDir()      │ Alias for git root                     │ marshalled-cli-tool.ts (line 47)                                            │
  └─────────────────────────────┴────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
  Plus a 5th consumer: default-runtime.ts line 50 uses raw process.cwd() directly — same smell, different source.

  The two code smells you identified

  1. Hidden side effects deep inside objects:
  - ClaudeCommandBuilder.build() looks pure — takes args, returns a CLICommand. But internally it shells out to git rev-parse via getPluginDirFlags(). A caller has no idea this happens.
  - JsonFileIOMarshallerSession's constructor silently shells out to git to determine where to write temp files. The SRP comment even says "Knows Nothing About... where the user's project lives" — but it
  literally reaches out and discovers it!
  - MarshalledCLITool.runMarshalledIOCLICommand() calls getProjectWorkingDir() to determine CWD. Hidden from the constructor.

  2. Unit testing requires fighting hidden state:
  - To test ClaudeCommandBuilder you must either set process.env.AGENTIC_HQ_WORKSPACE_ROOT or be inside a git repo. You can't just inject a path.
  - To test JsonFileIOMarshallerSession you must be in a git repo, or mock globals.
  - These are exactly the kind of tests where you end up writing vi.mock('../../utils/directory/directory-functions.js') — mocking free functions rather than injecting dependencies.

  What Perplexity/OO literature says

  The research confirms this is the Service Locator anti-pattern — objects reaching into global state to find their dependencies rather than having them injected. The correct pattern is:

  Create the environment/context at the Composition Root (startup), then inject it explicitly through the object graph.

  The two distinct concepts hiding in these functions

  Looking at the actual usage, there are clearly two separate domain concepts being conflated:

  Concept A: The AHQ Installation (where agentic-hq lives)
  - Root path (from env var or git detection)
  - Config dir: root/.agentic-hq/
  - Plugins dir: root/.agentic-hq/plugins/
  - Consumers: microkernel-config-loader, claude-command-builder

  Concept B: The User's Project Workspace (where the user runs commands)
  - Root path (git root of CWD)
  - Temp dir: root/.agentic-hq/temp/
  - Working directory for CLI tools
  - Consumers: json-file-io-marshaller-session, marshalled-cli-tool, default-runtime

  These are currently the same directory (during development), but the file's own header notes they'll diverge when AHQ is installed globally.

  Proposed OO concepts

                      ┌──────────────────────────────┐
                      │    Created at startup by      │
                      │    Composition Root (CLI)      │
                      └──────────┬───────────────────┘
                                 │ creates
                      ┌──────────▼───────────────────┐
                      │     AgenticHqInstallation     │
                      │  (interface)                  │
                      │  ─────────────────────────    │
                      │  root: string                 │
                      │  configDir: string            │
                      │  pluginsDir: string           │
                      └──────────────────────────────┘

                      ┌──────────────────────────────┐
                      │     UserProjectWorkspace      │
                      │  (interface)                  │
                      │  ─────────────────────────    │
                      │  root: string                 │
                      │  tempDir: string              │
                      └──────────────────────────────┘

  - AgenticHqInstallation — injected into microkernel-config-loader and ClaudeCommandBuilder
  - UserProjectWorkspace — injected into JsonFileIOMarshallerSessionFactory and MarshalledCLITool
  - Concrete implementations created once at startup, resolving env vars / git root at that moment
  - In tests: just pass in a plain object with whatever paths you want. No mocking globals.

  Before vs After (concrete example)

  Before — hidden state, hard to test:
  // Deep inside ClaudeCommandBuilder.build():
  const agenticHqRoot = getAgenticHqWorkspaceRoot(); // SURPRISE! shells out to git

  After — explicit, injectable, testable:
  class ClaudeCommandBuilder {
    constructor(
      private readonly installation: AgenticHqInstallation, // injected
      executable?: string,
      extraArgs?: string[]
    ) {}

    build(aiToolCommand: string, marshallingId: string): CLICommand {
      // uses this.installation.pluginsDir — no hidden side effects
    }
  }

  // In test:
  const builder = new ClaudeCommandBuilder({ root: '/fake', configDir: '/fake/.agentic-hq', pluginsDir: '/fake/.agentic-hq/plugins' });
  // No git, no env vars, no mocking. Just an object.

  Questions for discussion

  1. Two interfaces or one? I lean towards two (AgenticHqInstallation + UserProjectWorkspace) since they represent genuinely different concepts that will diverge. But a single SystemContext that composes
  both is also valid. What's your instinct?
  2. Where should these be created? The natural place is the CLI entry point (agentic-hq-cli.ts / agentic-hq-program.ts) — the Composition Root. The microkernel loader would receive AgenticHqInstallation
  rather than reaching into globals.
  3. Should process.cwd() in DefaultRuntime line 50 also be replaced? It's the same smell — the runtime reaches into process state rather than being told where to run. The UserProjectWorkspace.root would
  cover this.
  4. Naming — do you prefer AgenticHqInstallation / UserProjectWorkspace, or something shorter like AhqInstallation / ProjectWorkspace, or different names entirely?















❯ Please ask Perplexity whether it's a good model to have these kinds of things Created as read-only objects at the composition route, as Perplexity called it.                                                
                                                                                                                                                                                                               
⏺ Task(Research read-only context objects)                                                                                                                                                                     
  ⎿  Prompt:                                                                                                                                                                                                   
       Use Perplexity MCP to research this specific question:                                                                                                                                                  
                                                                                                                                                                                                             
       "In object-oriented architecture with dependency injection, is it considered best practice to create environment/context objects (like an 'AgenticHqInstallation' containing resolved directory paths,  
       or a 'UserProjectWorkspace' containing the user's project root and temp dir) as IMMUTABLE, READ-ONLY objects at the Composition Root?                                                                 

       Specifically:
       1. Should these objects resolve all their values in the constructor (e.g., detect git root, read env vars) and then be frozen/immutable from that point forward?
       2. Is this the 'Value Object' pattern or something else?
       3. What are the benefits of immutability here vs allowing mutation?
       4. Should the interfaces expose only readonly properties (no setters)?
       5. In TypeScript specifically, what's the idiomatic way to do this — readonly properties on the interface, Object.freeze(), or something else?
       6. Are there any well-known authorities (Martin Fowler, Mark Seemann, Uncle Bob) who specifically recommend this pattern for environment/configuration objects?

       The context: We have a TypeScript project using interfaces + dependency injection. We want to create two objects at startup:
       - AgenticHqInstallation (root path, config dir, plugins dir) — resolved from env var or git detection
       - UserProjectWorkspace (project root, temp dir) — resolved from git root of CWD

       These would be created once at the CLI entry point, then injected through the entire object graph. The question is whether making them immutable/read-only from the moment of construction is the right
       pattern."

       Return the full Perplexity response.

     ❯ Use Perplexity MCP to research this specific question:                                                                                                                                                  
                                
                                       
     perplexity-ask - perplexity_ask (MCP)(messages: [{"role":"user","content":"In object-oriented architecture with dependency injection, is it considered best practice to create environment/context objects
                                                                                                                                                                                                               
     ctrl+b to run in background                                                                                                                                                                               
                                                                                                                                                                                                               
✻ Razzle-dazzling… (1m 12s · ↓ 860 tokens)                                                                                                                                                                     
                                                                                                                                                                                                               
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯                                                                                                                                                                                                              
─────────────────────────








  ⎿  perplexity-ask - perplexity_ask (MCP)(messages: [{"role":"user","content":"In object-oriented architecture with dependency injection, is it considered best practice to create environment/context
                                          objects (like an 'AgenticHqInstallation' containing resolved directory paths, or a 'UserProjectWorkspace' containing the user's project root and temp dir) as
                                          IMMUTABLE, READ-ONLY objects at the Composition Root?\n\nSpecifically:\n1. Should these objects resolve all their values in the constructor (e.g., detect git
                                          root, read env vars) and then be frozen/immutable from that point forward?\n2. Is this the 'Value Object' pattern or something else?\n3. What are the benefits
                                          of immutability here vs allowing mutation?\n4. Should the interfaces expose only readonly properties (no setters)?\n5. In TypeScript specifically, what's the
                                          idiomatic way to do this — readonly properties on the interface, Object.freeze(), or something else?\n6. Are there any well-known authorities (Martin Fowler,
                                          Mark Seemann, Uncle Bob) who specifically recommend this pattern for environment/configuration objects?\n\nThe context: We have a TypeScript project using
                                          interfaces + dependency injection. We want to create two objects at startup:\n- AgenticHqInstallation (root path, config dir, plugins dir) — resolved from env
                                          var or git detection\n- UserProjectWorkspace (project root, temp dir) — resolved from git root of CWD\n\nThese would be created once at the CLI entry point,
                                          then injected through the entire object graph. The question is whether making them immutable/read-only from the moment of construction is the right pattern."}])
  ⎿  

  ⎿  Response:
       Here is the full Perplexity response:

       ---
       Perplexity Research: Immutable Environment/Context Objects at the Composition Root

       Constructor Initialization with Immutability

       Yes, resolving all values in the constructor and then freezing the object is the recommended approach. According to Martin Fowler's analysis, constructor initialization offers clear advantages:
       "Another advantage with constructor initialization is that it allows you to clearly hide any fields that are immutable by simply not providing a setter. I think this is important - if something
       shouldn't change then the lack of a setter communicates this very well." [1]

       This principle applies directly to your context objects. By detecting git root, reading environment variables, and resolving directory paths entirely within the constructor, you make the object's
       state deterministic and prevent accidental mutation later in the application lifecycle.

       Pattern Classification

       This is primarily the Value Object pattern combined with the immutable configuration object pattern. Value Objects are characterized by:
       - Identity based on their values, not object identity
       - Immutability after construction
       - No setters; all state established during initialization

       Your AgenticHqInstallation and UserProjectWorkspace objects fit this definition -- they represent stable, read-only environmental context that should not change during execution.

       Benefits of Immutability for Context Objects

       The advantages are substantial:

       1. Thread-safety: Immutable objects eliminate concurrency issues entirely [2]. In a TypeScript context with async/await patterns, this prevents race conditions when multiple async operations
       reference the same context.
       2. Clear semantics: Immutability communicates intent -- these are configuration snapshots, not mutable state containers. Developers immediately understand they cannot and should not attempt
       mutation.
       3. Predictability: Since initialization captures environment state at a single point (composition root), the entire application operates with consistent, known values. This is critical for CLI
       tools where startup conditions matter.
       4. Testability: Immutable context objects are easier to test because their behavior is deterministic and does not depend on mutation order.
       5. Prevents silent bugs: Without setters, accidental attempts to modify these objects fail loudly rather than silently corrupting state.

       Interface Design with Read-Only Properties

       Yes, interfaces should expose only read-only properties without setters. This is the TypeScript idiomatic approach:

       interface IAgenticHqInstallation {
         readonly rootPath: string;
         readonly configDir: string;
         readonly pluginsDir: string;
       }

       interface IUserProjectWorkspace {
         readonly projectRoot: string;
         readonly tempDir: string;
       }

       The readonly keyword in TypeScript interfaces prevents assignment attempts at compile time. Implementation classes can similarly use readonly modifiers on their fields.

       TypeScript Implementation Patterns

       For TypeScript specifically, the idiomatic approach combines several techniques:

       class AgenticHqInstallation implements IAgenticHqInstallation {
         readonly rootPath: string;
         readonly configDir: string;
         readonly pluginsDir: string;

         constructor() {
           this.rootPath = this.detectInstallationRoot();
           this.configDir = path.join(this.rootPath, 'config');
           this.pluginsDir = path.join(this.rootPath, 'plugins');
         }

         private detectInstallationRoot(): string {
           // Resolution logic here
         }
       }

       Object.freeze() is optional but recommended for additional runtime safety:

       constructor() {
         this.rootPath = this.detectInstallationRoot();
         this.configDir = path.join(this.rootPath, 'config');
         this.pluginsDir = path.join(this.rootPath, 'plugins');
         Object.freeze(this);
       }

       Object.freeze() provides runtime protection against accidental mutations, complementing TypeScript's compile-time readonly guarantees. This is particularly valuable in larger teams where not
       everyone may be aware of immutability contracts.

       Authority Guidance

       While the search results don't include specific recommendations from Fowler, Seemann, or Uncle Bob on this exact pattern, the underlying principles are well-established:

       - Fowler advocates constructor initialization and immutability as core to dependency injection design [1]
       - Microsoft's .NET guidelines recommend designing "services small, well-factored, and easily tested" and specifically advise against "direct instantiation of dependent classes within services"
       [3], which aligns with centralizing context creation at the composition root
       - The principle of coding against abstractions, not implementations (attributed to Erich Gamma in the Gang of Four) supports using interfaces for these context objects [2]

       The pattern you're describing -- immutable, interface-based context objects resolved once at startup and injected throughout -- represents a synthesis of established best practices rather than a
       novel pattern. It is well-supported by the dependency injection and object-oriented design literature.

       Recommendation

       For your TypeScript CLI project, the recommended approach is: use readonly properties on interfaces, readonly fields in implementations, freeze objects at construction, and resolve all state in
       the constructor. This gives you compile-time safety, runtime protection, and clear intent signaling throughout your codebase.

       Citations

       1. https://martinfowler.com/articles/injection.html
       2. https://builtin.com/articles/dependency-injection
       3. https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/guidelines
       4. https://www.infoworld.com/article/2261849/how-to-use-immutable-objects-in-aspnet-core-mvc-5.html
       5. https://dev.to/dhanush___b/mastering-dependency-injection-in-spring-boot-real-world-examples-and-best-practices-1dof

  ⎿  Done (2 tool uses · 32.3k tokens · 1m 0s)

· Razzle-dazzling… (1m 30s · ↓ 3.0k tokens)























⏺ Great. Perplexity confirms this strongly. Here's what the concrete code would look like.

  ---                                                                                                                                                                                                          
  The Two Interfaces
                                                                                                                                                                                                               
  // src/interfaces/agentic-hq-installation.ts                                                                                                                                                               
  interface AgenticHqInstallation {
    readonly root: string;        // e.g. /Users/steve/dev/agentic-hq/agentic-hq
    readonly configDir: string;   // root/.agentic-hq
    readonly pluginsDir: string;  // root/.agentic-hq/plugins
  }

  // src/interfaces/user-project-workspace.ts
  interface UserProjectWorkspace {
    readonly root: string;        // git root of CWD (the user's project)
    readonly tempDir: string;     // root/.agentic-hq/temp
  }

  Readonly properties on the interface — no setters, ever.

  The Concrete Implementations

  // src/workspace/default-agentic-hq-installation.ts
  class DefaultAgenticHqInstallation implements AgenticHqInstallation {
    readonly root: string;
    readonly configDir: string;
    readonly pluginsDir: string;

    constructor() {
      this.root = process.env.AGENTIC_HQ_WORKSPACE_ROOT || detectGitRoot();
      this.configDir = path.join(this.root, '.agentic-hq');
      this.pluginsDir = path.join(this.root, '.agentic-hq', 'plugins');
      Object.freeze(this);
    }
  }

  // src/workspace/default-user-project-workspace.ts
  class DefaultUserProjectWorkspace implements UserProjectWorkspace {
    readonly root: string;
    readonly tempDir: string;

    constructor() {
      this.root = detectGitRoot();
      this.tempDir = path.join(this.root, '.agentic-hq', 'temp');
      Object.freeze(this);
    }
  }

  All the side effects (execSync, process.env) happen once, in the constructor, at startup. After construction, these are just frozen bags of strings. The detectGitRoot() helper would be a private function
  in these files (or shared between them).

  How They Get Created — The Composition Root

  Currently your startup in agentic-hq-cli.ts is:

  const runtime = await loadRuntime();
  createProgram(runtime).parse();

  It would become:

  // Create the two context objects ONCE at the edge of the system
  const installation = new DefaultAgenticHqInstallation();
  const workspace = new DefaultUserProjectWorkspace();

  // Pass them into the microkernel loader, which threads them through
  const runtime = await loadRuntime({ installation, workspace });
  createProgram(runtime).parse();

  How They Flow Through The System

  The microkernel loader currently creates the dependency chain:

  IOMarshallerSessionFactory + CLIWrapper → Tool → Runtime

  It would become:

  installation + workspace + IOMarshallerSessionFactory + CLIWrapper → Tool → Runtime

  Concretely, loadRuntime() would pass them into the factory create() functions:

  // microkernel-loader.ts (sketch)
  export async function loadRuntime(context: {
    installation: AgenticHqInstallation;
    workspace: UserProjectWorkspace;
    config?: MicrokernelConfig;
  }): Promise<Runtime> {
    const cfg = context.config ?? (await loadMicrokernelConfig(context.installation));
    // ...
    const sessionFactory = sessionModule.create({ workspace: context.workspace });
    const tool = toolModule.create({ sessionFactory, cliWrapper, installation: context.installation, workspace: context.workspace });
    const runtime = runtimeModule.create({ tool, workspace: context.workspace });
    return runtime;
  }

  What Changes In Each Consumer

  Each consumer stops importing directory-functions.ts and instead receives what it needs via constructor injection:
  ┌────────────────────────────────────┬─────────────────────────────┬───────────────────────────────────────────────┐
  │              Consumer              │    Currently reaches for    │         Would receive via constructor         │
  ├────────────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
  │ microkernel-config-loader          │ getAgenticHqWorkspaceRoot() │ installation.configDir (or installation.root) │
  ├────────────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
  │ ClaudeCommandBuilder               │ getAgenticHqWorkspaceRoot() │ installation: AgenticHqInstallation           │
  ├────────────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
  │ JsonFileIOMarshallerSessionFactory │ getAgenticHqTempDir()       │ workspace: UserProjectWorkspace               │
  ├────────────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
  │ MarshalledCLITool                  │ getProjectWorkingDir()      │ workspace: UserProjectWorkspace               │
  ├────────────────────────────────────┼─────────────────────────────┼───────────────────────────────────────────────┤
  │ DefaultRuntime                     │ process.cwd()               │ workspace: UserProjectWorkspace               │
  └────────────────────────────────────┴─────────────────────────────┴───────────────────────────────────────────────┘
  For example, ClaudeCommandBuilder today:

  // Hidden side effect deep inside build()
  function getPluginDirFlags(): string[] {
    const agenticHqRoot = getAgenticHqWorkspaceRoot(); // SURPRISE! shells out to git
    // ...
  }

  Would become:

  class ClaudeCommandBuilder {
    constructor(
      private readonly installation: AgenticHqInstallation,  // injected, visible
      executable?: string,
      extraArgs?: string[]
    ) {}

    private getPluginDirFlags(): string[] {
      // No surprise — uses the injected, frozen object
      return [
        path.join(this.installation.pluginsDir, 'agentic-hq-core-plugin'),
        // ...
      ].map(dir => `--plugin-dir=${dir}`);
    }
  }

  In Tests — The Payoff

  This is where the real value is. Today you'd need vi.mock('../../utils/directory/directory-functions.js'). After:

  // No mocking globals. No git. No env vars. Just objects.
  const fakeInstallation: AgenticHqInstallation = {
    root: '/fake/ahq',
    configDir: '/fake/ahq/.agentic-hq',
    pluginsDir: '/fake/ahq/.agentic-hq/plugins',
  };

  const builder = new ClaudeCommandBuilder(fakeInstallation);
  const cmd = builder.build('/my-command', '/tmp/session-123');
  // Assert on cmd — pure, deterministic, no side effects

  Summary

  - Two interfaces (AgenticHqInstallation, UserProjectWorkspace) with readonly properties
  - Two concrete classes that resolve everything in the constructor, then Object.freeze(this)
  - Created once at the CLI entry point (Composition Root)
  - Injected explicitly through the microkernel loader → factories → concrete classes
  - directory-functions.ts gets deleted — its responsibilities are absorbed into the two constructors
  - Tests become trivial — just pass plain objects, no mocking globals

  Want me to create beads tasks and start implementing this?

✻ Cooked for 1m 46s                                                                                                                                                                                            
   
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯                                     



