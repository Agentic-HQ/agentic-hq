⏺ perplexity-ask - perplexity_ask (MCP)(messages: [{"role":"user","content":"Martin Fowler advocates that you should never pass primitives (strings, numbers, booleans) around your system as domain concepts. Instead, every 'thing' should be wrapped in its own class/type, even if it currently has no behavior or extra properties. The anti-pattern of using primitives is called 'Primitive Obsession'. What is the full name of this principle/pattern? Describe: 1) The anti-pattern name ('Primitive Obsession') and what it  means, 2) The solution patterns (Value Objects, Whole Value, tiny types, etc.), 3) Martin Fowler's specific writings on this, 4) The benefits of wrapping primitives in domain-specific types, 5) Any other notable advocates or references (e.g., Kent Beck's 'Whole Value' pattern, Eric Evans DDD Value Objects). Please be thorough and cite sources."}])                                                                                                                                                  
  ⎿ ### 1. The Anti-Pattern: Primitive Obsession                                                                                                                                                                                                                                                                                                                         
    **Primitive Obsession** is a code smell (not a strict anti-pattern, though often described as such) identified by Martin Fowler, where developers overuse primitive types (e.g., `string`, `int`,
    `bool`, `float`, arrays) to represent domain concepts that warrant richer modeling. Instead of creating dedicated types, code relies on primitives with explanatory names or comments, leading to        
    brittle, error-prone systems.                                                                                                                                                                                                                                                                                                                                          
    **Key symptoms and problems** (from search results [1], [2], [3], [4]):                                                                                                                                  
    - **Mixing arguments**: Primitives lack type safety, causing errors from swapped parameters (e.g., passing `name` as `age`) [1].                                                                         
    - **Scattered behavior and validation**: Rules (e.g., email format checks) are duplicated across functions, violating single source of truth and increasing maintenance costs [1], [3].
    - **No encapsulation**: Behavior can't live "inside" primitives, leading to feature envy (functions asking primitives too many questions) and low cohesion [1], [4].
    - **Obscured intent**: Primitives hide domain meaning (e.g., `string` for email vs. `Email` type) [3].
    - **Cognitive bias**: Driven by "Law of the Hammer" – over-relying on familiar primitives [1].

    Fowler notes it's common because primitives are simple, but it scales poorly [3]. It's not always harmful if logic stays co-located [4], but generally signals deeper design issues.

    ### 2. Solution Patterns

    The core fix is **Replace Primitive with Object** (Fowler's refactoring). Wrap primitives in domain-specific types. Key patterns:

    | Pattern          | Description | Example | Sources |
    |------------------|-------------|---------|---------|
    | **Value Objects** (DDD) | Immutable types encapsulating data + behavior/validation. Equality by value, not identity. | `Email(string value)` with `isValid()` method. | [1], [2] (DDD reference),
    Evans (below) |
    | **Whole Value** (Kent Beck) | Convert primitives to objects treating them as atomic units; copy/convert freely without mutation. Counters scattering. | `Money(int amount, string currency)` as a
    single, validated unit. | [4] (Cunningham/Beck reference), Code Retreat practices |
    | **Tiny Types** / Wrapper Types | Lightweight structs/traits around primitives for type safety. Common in FP/Rust. | Rust `struct Name(String);` prevents `Name("123")`. | [5] (Rust refactoring),
    [2] (FP culture) |
    | **Custom Collections** | Wrap collections if they need domain behavior (e.g., `OrderLines` list with `total()`). Skip if parent entity handles it. | Root-level `Customers` with `findByStatus()`.
     | [2] |

    These enforce invariants at construction (e.g., `new Email(s)` validates `s` or panics), centralize logic, and enable composition over inheritance [1].

    ### 3. Martin Fowler's Specific Writings

    Fowler coined/introduced **Primitive Obsession** in his seminal book **Refactoring: Improving the Design of Existing Code** (1999, 1st ed.; updated 2018) [3], [4], [6].

    - **Chapter 3: Bad Smells in Code** lists it under "Bloaters" > "Data" (with "Type Embedded in Name," "Obscured Intent") [3].
    - **Refactoring Catalog**: **R71: Replace Primitive with Object** (or "Introduce Parameter Object"). Example: `string telephoneNumber` → `TelephoneNumber` class with parsing/validation [implied in
     [3]].
    - Fowler emphasizes reluctance to create "fundamental types" [3]; primitives seem efficient but hide complexity.
    - No "full named principle" like a capitalized pattern (e.g., not "No Primitives Principle"). The query's claim ("never pass primitives... every 'thing' wrapped") is a strong interpretation;
    Fowler advocates selectively for domain concepts, not *every* primitive [4] critiques over-obsession.
    - Online: Fowler's catalog (refactoring.com) details it; HN [6] links to book.

    Fowler doesn't mandate *zero* primitives – use where trivial [4].

    ### 4. Benefits of Wrapping Primitives in Domain-Specific Types

    | Benefit | Explanation | Sources |
    |---------|-------------|---------|
    | **Type Safety** | Compile-time checks prevent invalid states (e.g., `Email` won't accept phone number) [1], [5]. | [1], [2], [5] |
    | **Encapsulation & Single Source of Truth** | Behavior/validation in one place; no duplication [1], [3]. | [1], [4] |
    | **Self-Documenting Code** | `send(Email, Money)` clearer than `send(string, double)` [2]. | [1], [3] |
    | **Tell, Don't Ask** | Objects handle their logic (e.g., `email.isValid()` vs. scattered if-checks), reducing feature envy [1]. | [1] |
    | **Immutability & Validity** | Constructors enforce rules; always valid instances [1]. | [1], [2] |
    | **Maintainability** | Easier refactoring; high cohesion, low coupling [4]. | [4] |
    | **Testability** | Mock/isolate domain types easily. | Inferred [1], [5] |

    Drawbacks: Boilerplate (mitigated in modern langs like Rust/FP) [2], [5]. Benefits outweigh for non-trivial domains [4].

    ### 5. Other Notable Advocates and References

    | Advocate/Work | Contribution | Key Reference |
    |---------------|--------------|---------------|
    | **Eric Evans** (Domain-Driven Design, 2003) | **Value Objects** as primitive wrappers for concepts without identity (e.g., `Address`). Core DDD tactic vs. primitive obsession. | [2]; Evans book,
     Ch. 5 |
    | **Kent Beck** / **Ward Cunningham** | **Whole Value** pattern: Primitives as copyable "whole" objects to avoid partial mutations/duplication. From "CHECKS" pattern language. | [4] ("The CHECKS
    Pattern Language of Information Integrity") |
    | **Vladimir Khorikov** (Enterprise Craftsmanship) | Applies to collections; custom classes only if root-level with behavior. | [2] |
    | **Code Retreat** / Workshops | "No primitives" constraint to practice whole values early. | [4] |
    | **Rust Community** | Structs/traits refactor primitives (e.g., `struct LeapYear(i32)`). | [5] |
    | **Mäntylä** (Object-Oriented Metrics in Practice, 2005) | Money as classic example. | [3] |

    **Further Reading**:
    - Fowler's *Refactoring* (1999/2018) [3], [6].
    - Evans' *DDD* (2003).
    - Cunningham's "CHECKS" [4].

    This approach aligns with OO/DDD/FP: model domain richly for robust systems [1]–[6]. Not dogmatic – primitives OK for simple cases [4].

    Citations:
    [1] https://acairns.co.uk/posts/primitive-obsession
    [2] https://enterprisecraftsmanship.com/posts/collections-primitive-obsession/
    [3] https://luzkan.github.io/smells/primitive-obsession/
    [4] https://blog.thecodewhisperer.com/permalink/primitive-obsession-obsession
    [5] https://www.designisrefactoring.com/2016/08/31/refactoring-rust-primitive-obsession/
    [6] https://news.ycombinator.com/item?id=39521568





⏺ Great research from Perplexity. Here's the summary:                                                                                                                                                        
   
  The Anti-Pattern: Primitive Obsession                                                                                                                                                                                                                                                                                                                                  
  This is the code smell name from Fowler's Refactoring (1999/2018). It's when you use raw primitives (string, number, boolean) to represent domain concepts that deserve their own types.                                                                                                                                                                                 
  The Solution Patterns (multiple names for the same idea):
  ┌───────────────────────────────┬───────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────┐
  │            Pattern            │                        Origin                         │                                     Description                                     │
  ├───────────────────────────────┼───────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Value Objects                 │ Eric Evans (DDD, 2003)                                │ Immutable types with equality by value, not identity. The most widely used term.    │
  ├───────────────────────────────┼───────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Whole Value                   │ Kent Beck / Ward Cunningham (CHECKS pattern language) │ Every domain concept should be a single, atomic object — not a scattered primitive. │
  ├───────────────────────────────┼───────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Tiny Types / Wrapper Types    │ FP/Rust communities                                   │ Lightweight structs wrapping a single primitive for type safety.                    │
  ├───────────────────────────────┼───────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Replace Primitive with Object │ Fowler's refactoring catalog (R71)                    │ The specific refactoring technique to fix Primitive Obsession.                      │
  └───────────────────────────────┴───────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘
  Key Benefits

  1. Type safety — send(Email, Money) can't accidentally swap arguments like send(string, number) can
  2. Single source of truth — Validation lives in one place (the constructor), not scattered across the codebase
  3. Self-documenting — WorkflowMissionId is clearer than string
  4. Tell, Don't Ask — Behavior lives on the object (email.isValid()) instead of in external functions
  5. Immutability & validity — Constructors enforce invariants; if it exists, it's valid
  6. Future-proofing — When you need to add behavior later, the class already exists — you just add a method

  The Fowler Quote Essence

  From Refactoring, Chapter 3 ("Bad Smells in Code"): Fowler lists Primitive Obsession under "Bloaters" and provides the refactoring Replace Primitive with Object — e.g., string telephoneNumber becomes a
  TelephoneNumber class with parsing/validation.

  He doesn't say literally zero primitives ever, but for domain concepts that get passed around, the strong recommendation is: wrap them. Even if they have no behavior yet, because:
  - They almost always grow behavior
  - The type name communicates intent
  - The compiler catches misuse

  Relevant to This Codebase

  Looking at things like workflowMissionId: string, processId: string, outcomeId: string — these are exactly the kind of domain concepts that would benefit from being WorkflowMissionId, ProcessId,
  OutcomeId value objects.

  References

  - Fowler, Refactoring: Improving the Design of Existing Code (1999/2018) — Chapter 3, Refactoring R71
  - Evans, Domain-Driven Design (2003) — Chapter 5 (Value Objects)
  - Beck/Cunningham, CHECKS Pattern Language of Information Integrity (Whole Value)
  - https://acairns.co.uk/posts/primitive-obsession
  - https://enterprisecraftsmanship.com/posts/collections-primitive-obsession/

  So the terms you'll want for your refactoring command are: curing Primitive Obsession by introducing Value Objects (DDD term) / Whole Values (Beck term) via the Replace Primitive with Object refactoring.

✻ Crunched for 55s

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯  
