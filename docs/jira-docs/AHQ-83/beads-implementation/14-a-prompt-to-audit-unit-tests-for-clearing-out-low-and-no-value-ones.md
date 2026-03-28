We've done a lot of refactoring in this branch.

Please do a comparison of the branch to the main and see what tests have been created, and do a full audit.

Then go through all the unit tests and do a complete audit of whether each individual test is one of the following:
- High Value - Answer: what it tests and why that is highly valuable
- Medium Value - Answer: what it tests and why that is of medium value
- Low Value - ditto
- No Value - ditto

Also for each test indicate a recommendation of whether to delete/keep and why.

Also indicate whether it was created on this branch (NEW) or already on main branch (OLD)

All this in a table for every single test (there are 84).

Sorry, forgot to mention: Create your report in:

14-b-claude-report-about-unit-tests.md