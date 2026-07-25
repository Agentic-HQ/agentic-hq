❯ Who would find Homa really, really useful and save them a *tonne* of money very quickly if it was in Linux in 1 year's time?  And why?  And would they save/make millions or billions from it?                  

⏺ Great question — and the research gives a surprisingly sharp answer, including a sting in the tail. Let me build the profile first, because "who saves money" falls straight out of the mechanics.
  
  Why Homa turns into money at all

  Two mechanisms, one big and one small:

  The big one: fan-out math → over-provisioning. A single user action at a large web/SaaS company fans out into hundreds of internal RPCs, and the response can't ship until the slowest leg returns. With 100
  parallel legs, the P99 of a single leg hits ~63% of all user requests (1 − 0.99¹⁰⁰). So the P99 of tiny internal RPCs effectively is your median user latency. Today's defence against TCP's exploding tails is
  Two mechanisms, one big and one small:

  The big one: fan-out math → over-provisioning. A single user action at a large web/SaaS company fans out into hundreds of internal RPCs, and the response can't ship until the slowest leg returns. With 100
  parallel legs, the P99 of a single leg hits ~63% of all user requests (1 − 0.99¹⁰⁰). So the P99 of tiny internal RPCs effectively is your median user latency. Today's defence against TCP's exploding tails is
  brutal: run everything half-empty. Clusters and network fabrics sit at 30–40% utilisation because TCP's tail goes vertical as load rises. Homa's defining measured property is that its tail curve stays flat up
  to 80–90% load (02 §8 (docs/jira-docs/AHQ-192/02-homa-detailed-research-document.md)). Being able to run the same SLO at twice the utilisation means buying roughly half the machines and switch ports for the
  latency-sensitive tier. That's not a performance win, it's a capex/opex win — and it scales linearly with fleet size.

  The small one: direct revenue-per-millisecond. In a few businesses latency literally is revenue — real-time ad bidding (miss the ~10–20ms internal budget → you simply don't bid → zero revenue on that auction)
  and e-commerce (the old Amazon "100ms = 1% of sales" family of results).

  The ideal beneficiary profile

  Five traits, all needed for the fast payoff:

  1. Owns its datacenters (can program switch DSCP priority queues — public-cloud tenants can't touch the fabric, which quietly excludes most of the industry);
  2. Commodity Ethernet (hasn't already paid the RDMA/lossless-fabric tax);
  3. Massive east-west small-RPC fan-out (caching tiers, microservices, storage metadata);
  4. Strict user-facing latency SLOs (so tails force the over-provisioning);
  5. Controls one internal RPC framework in a monorepo (port Homa once, every service benefits — this is what makes "within a year" plausible; everyone else waits for gRPC-style integration, which is currently
  suspended).

  So, named names

  - Meta is the single best fit on earth — almost comically so. The workload traces in Homa's own papers are partly Facebook's (W1 = Facebook memcached, W4 = Facebook Hadoop). They own their DCs, run commodity
  Ethernet for the frontend estate, live and die by memcached/TAO fan-out, control their RPC stack (Thrift) in a monorepo — and unlike Google/AWS they have no publicly-known private transport (Snap/SRD
  equivalents). Realistic prize: hundreds of millions per year in avoided over-provisioning at their fleet scale.
  - Adtech/RTB platforms (The Trade Desk, Criteo, Magnite tier): fastest revenue-side payback — tail latency converts directly to auctions won. Tens to low hundreds of millions per year for the big ones.
  - Large SaaS/infra companies running their own metal — Dropbox, Cloudflare, Datadog, big storage operators (Ceph-scale deployments, ScyllaDB-style databases where small-op tails gate everything): tens of
  millions per year each, real but not transformative.
  - Explicitly not: the hyperscalers (they already spent the billions building Snap/Swift/Falcon and SRD privately — they don't need mainline Homa), public-cloud tenants (no switch control, and the fabric is
  opaque), and HFT (already on kernel-bypass/FPGA; Homa's microseconds aren't competitive there, and their DCs are tiny).

  Millions or billions?

  Millions to low-hundreds-of-millions per year for the best-placed single company (Meta being the ceiling case); billions only in industry aggregate — and the actors who could bank billions already solved it
  privately. That's the structural irony the whole research kept bumping into: Homa's ideas are demonstrably worth billions, because the hyperscalers each spent that kind of money building their own Homa-shaped
  transports. Mainline Homa is the attempt to give that same capability to everyone who can't afford a private network stack team.

  And here's the sting: this question has a built-in empirical test, and the kernel community is running it right now. If someone truly stood to save a tonne of money very quickly, they'd be funding the
  upstreaming — corporate reviewers, Acked-bys, engineers assigned. Instead, the patch series has spent 21 months with its author, working essentially alone, posting v19 into intermittent silence (02 §13
  (docs/jira-docs/AHQ-192/02-homa-detailed-research-document.md)). LWN's Corbet made exactly this point: merging depends on datacenter operators demonstrating they want it. The revealed preference of the market
  so far says the fast-money case is real but bounded — big enough to be worth adopting if it lands in the kernel for free, not yet big enough that anyone's paying to accelerate it.

✻ Brewed for 1m 26s

※ recap: AHQ-192 Homa research is complete: 02 detailed doc, 03 summary, terms table, and supporting notes are all written in docs/jira-docs/AHQ-192. Next action: run /commit when you're ready to commit them.
  (disable recaps in /config)

❯ Is there a section in the detailed document and in the summary where you've basically said all of what you just told me? If not, do you think it's worth modifying an existing one or adding a new section like 
  this? I am actually genuinely interested in what the point of this is and whether it's going to save money, whether it's really worth the effort. It's making me realise I want more research into why no one   
  is funding this if it could save possibly low hundreds of millions per year for some companies. Say, take Facebook: if Facebook really thought that this could mean they just rent out a third of their servers 
  to other people, or give them back, or don't have to keep buying new servers, and that saves them tens of millions or hundreds of millions per year, then it seems like there must be a reason they're not      
  paying one or two million to get that this year instead of in five years. What's the answer? If you don't know, I'd like you to research this further and create a new document with your findings that will be 
  a 04 document.    

  


Is there a section in the detailed document and in the summary where you've basically said all of what you just told me? If not, do you think it's worth modifying an existing one or adding a new section like 
  this? I am actually genuinely interested in what the point of this is and whether it's going to save money, whether it's really worth the effort. It's making me realise I want more research into why no one   
  is funding this if it could save possibly low hundreds of millions per year for some companies. Say, take Facebook: if Facebook really thought that this could mean they just rent out a third of their servers 
  to other people, or give them back, or don't have to keep buying new servers, and that saves them tens of millions or hundreds of millions per year, then it seems like there must be a reason they're not      
  paying one or two million to get that this year instead of in five years. What's the answer? If you don't know, I'd like you to research this further and create a new document with your findings that will be 
  a 04 document.


