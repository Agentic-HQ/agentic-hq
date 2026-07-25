OK.  So you've done a load of research into Homa and ended up theorising about a potential pivot.

The big reveal is that I was asking all this not because I wanted to give John advice about what to do with his time (I'm sure he can decide that without me, someone who knows very little about networking or Linux or John himself), but because I wanted to come up with a sample coding project that is related, but very different, to Homa that I can build with and without Agentic HQ to see if it actually can make a big difference to the output.

Agentic HQ is the project you're in now, and basically lets you chain together multiple Skills, each run in their own, fresh context.  The idea is to create a dev workflow that incorporates rules, guidance and checks/reviews based on the core ideas proposed by John in his Philosophy of Software Design book (see .agentic-hq/plugins/agentic-hq-demos-plugin/skills/add-feature-detailed-example/ts-workflow/src/add-feature-detailed-example-cli.ts for my most detailed workflow which it could be based on).

The workflow would be called the birgitta-ousterhout-dev workflow because it would use John's design ideas and will have named "Guides" and "Sensors" proposed by Birgitta Böckeler from ThoughtWorks in https://martinfowler.com/articles/harness-engineering.html.  The Guides prompt Fable to do the right thing before doing it, the Sensors check that they have been done right and correct where they haven't.

The system would be called Amoh.

The aim is to create a amoh-requirement-doc.md for what should be built - based on all this research, but be sure to intentionally **miss out** anything relating to how it is designed and architected.  Just the key parts of the idea in terms of the required performance test results (e.g. intended minimum speedup of 3x tail improvement for TCP workloads and max 10% slowdown for non-tail traffic type??) and how it will work from the user's point of view and rough description of why/how it would work.

Then...

(1) Just give it to Fable - as a one-shot prompt in a empty workspace, and come back when it's cooked.  Documented, performance tested, ready to "drop in" on any test system at Meta and run a performance test to see if it really does the 3x tail improvement.

(2) Run the birgitta-ousterhout-dev workflow in a single run (each Skill in the workflow runs once - usually someone would break it up and run it multiple times, but that's too much effort for me).  NOTE: All *real* workflows would use Human In The Loop to improve and guide the AI.  But as an initial test, to keep it fair, I'll run this fully automated like the test (1).  I may come back and do a HITL version to see how much better we can get the output (if John is interested?)

(3) Fable and myself (Steve) compare the resulting systems, hoping that that the workflow version is much better designed and validates Agentic HQ.

(4) Steve sends resulting Github repos and reports to John in email (and all of these initial reports/files)

So, now you know the actual plan please write:

09-claudes-thoughts-and-questions-on-the-proposed-plan.md


