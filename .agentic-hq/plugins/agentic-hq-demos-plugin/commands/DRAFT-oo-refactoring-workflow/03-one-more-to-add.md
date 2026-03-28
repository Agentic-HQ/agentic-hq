Naming - don't want classes like "GitRootDetector" - want instead GitWorkspace

AND:

Exception handling and throwing.  In:
docs/jira-docs/AHQ-83/beads-implementation/09-d-getting-rid-of-git-functions-as-well.FULL_PLAN.md
export class NotInGitWorkspaceError extends Error class that is thrown when unexpected thing happens (fails fast) and calling functions (up the chain) should handle this and deal with it (usually logging the error and informing the user)


See plan in:

docs/jira-docs/AHQ-83/beads-implementation/09-d-getting-rid-of-git-functions-as-well.FULL_PLAN.md


Here's the conversation (part of it) including Perplexity's opinion on naming of classes....




❯ Don't want GitRootDetector (don't want "...or" things - that's an anti-pattern - ask Perplexity to confirm)  You want a "thing" like GitInfo that "is" the info about the Git situation (later can have      
  git status added, or git version etc etc)                                                                                                                                                                    
                                                                                                                                                                                                               
⏺ Good call — a GitInfo is the domain object (the "what"), not a GitRootDetector (the "how"). Let me confirm the naming pattern with Perplexity.                                                               
                                                                                                                                                                                                               
⏺ perplexity-ask - perplexity_ask (MCP)(messages: [{"role":"user","content":"In object-oriented design and domain-driven design, is it considered an anti-pattern to name classes with '-er' or '-or' suffixes 
                                       (like Detector, Validator, Processor, Handler)? What's the reasoning? What are the preferred alternatives? For example, if I have a class that holds git repository
                                       information (root directory, and potentially later git status, git version, etc.), should I name it GitRootDetector or GitInfo? What do experts like Martin Fowler,     
                                       Uncle Bob, or the DDD community say about this?"}])                                                                                                                   
  ⎿ In object-oriented design (OOD) and domain-driven design (DDD), naming classes with **-er** or **-or** suffixes (e.g., Detector, Validator, Processor, Handler) is widely considered an                    
    **anti-pattern**, particularly in DDD's domain layer, as it introduces anemic, implementation-focused, or technical terminology that obscures the **ubiquitous language** of the business                
    domain[1][2][3].                                                                                                                                                                                           
                                                                                                                                                                                                               
    ### Reasoning                                                                                                                                                                                              
    - **Procedural rather than domain-expressive**: These suffixes describe *what the class does* (a verb-noun hybrid) instead of *what it represents* in the domain model. DDD prioritizes nouns from the     
     **ubiquitous language**—terms experts use in conversation—to make code a readable model of the business, readable even by non-technical stakeholders. Technical verbs like "detect" or "process"          
    create a "tangled, tightly coupled mess" disconnected from domain context[1][2].                                                                                                                           
    - **Violates Single Responsibility Principle (SRP) signaling**: Such names signal generic utilities or services rather than cohesive domain concepts, leading to "Small Balls of Mud" (low cohesion).
    DDD patterns (e.g., Entities, Value Objects, Aggregates) enforce SRP by focusing on core domain responsibilities, not actions[3].
    - **Expert consensus**:
      | Expert/Source | View on -er/-or Names |
      |---------------|-----------------------|
      | **DDD Community** (e.g., Evans' Blue Book via talks) | Avoid technical terms like "PlayerImpl"; use domain-specific nouns (e.g., AvailableCar over generic handlers) for conceptual contours and
    bounded contexts. Code must match spoken domain language[1][2]. |
      | **Martin Fowler** (implied in DDD intros) | Emphasizes modeling from ubiquitous language; expects class names like "exposure" if domain uses it, not action-oriented utils[3]. |
      | **Uncle Bob (Clean Architecture)** | "Never mention the name of anything concrete"; favor abstract domain nouns over volatile, action-based concretes[4]. |

    This aligns with DDD's building blocks: prefer Entities/Value Objects for state/identity, Domain Services only for cross-cutting operations (not default), and Repositories/Factories for
    infrastructure[3][4][5].

    ### Preferred Alternatives
    - **Domain nouns**: Use precise, contextual terms from the business (e.g., AvailableCar, CarForRent, UnrentedCar). Explicitness > brevity; duplication signals missing context[1].
    - **Bounded Context qualifiers**: Prefix with domain (e.g., SourcingCandidate vs. generic Candidate)[2].
    - **Patterns over suffixes**:
      | Scenario | Anti-Pattern | Domain Alternative |
      |----------|--------------|--------------------|
      | Validation | Validator | ValidatableOrder (or domain rules in Entity) |
      | Detection | Detector | DetectableIssue |
      | Processing | Processor | OrderFulfillment |
      | Handling | Handler | IncidentResponse |

    ### Example: Git Repository Class
    **GitRootDetector** is an anti-pattern—it screams "technical action" (detecting roots), unfit for a domain layer.
    **GitInfo** is better (noun-focused), but still generic; enhance with domain context like **RepositoryLocation**, **GitWorkspace**, or **ProjectRoot** if it holds root directory, status, version,
    etc. Embed invariants (e.g., via private constructors/static factories) to keep it a rich Value Object/Entity[1][4]. If purely infrastructural, isolate outside the domain layer.

    Citations:
    [1] https://jdriven.com/blog/2025/10/DDD-whats-in-a-name
    [2] https://www.youtube.com/watch?v=QHhrdCV3stE
    [3] https://learn.microsoft.com/en-us/archive/msdn-magazine/2009/february/best-practice-an-introduction-to-domain-driven-design
    [4] https://handbook.chaineapp.com/handbook/engineering/resources/ddd/domain-driven-design-handbook/
    [5] https://groupe-maison-fr.github.io/Coding-Guidelines/DomainDrivenDesign/



✻ Julienning… (53s · ↓ 659 tokens · thinking)      

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯  
