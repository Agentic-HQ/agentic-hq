Creates commit message for approval then stages, commit and pushes changes.
When I run this "commit" command I would like you to please:
- Check if I passed in any additional info on the /commit command.  If I did: you must STILL RUN THROUGH THIS ENTIRE PROCESS INCLUDING APPROVAL ETC - the additional info will just help you craft the commit message I will be approving.
- Run in bash: date "+%Y-%m-%d_%H-%M-%S"
- Use the output of the bash command as the TIMESTAMP field in the following file names.
- Run the git status command to list all changed files and all unstaged and send the output to .agentic-hq/temp/git-statuses/git-status-<TIMESTAMP>.txt where you update the timestamp based on the current date and time.
- Run the "git diff origin/main" command to show detailed diff of any modified tracked files and send the output to .agentic-hq/temp/git-diffs/git-diff-<TIMESTAMP>.txt where you update the timestamp based on the current date and time.
- Run the "git ls-files --others --exclude-standard" to show the full list of all new files and send the output to .agentic-hq/temp/git-new-files-list/git-new-files-list-<TIMESTAMP>.txt where you update the timestamp based on the current date and time.
- Tell the human the filenames so they can check them themselves
- Analyse the files to work out what will be in the commit 
- Analyse the files to determine whether some files should not be committed and so should be in the .gitignore file.  If there are any then STOP and ask the human for approval for adding those recommended files or directories to .gitignore.  If approved - add them and continue.
- Use the file info, the recent AI conversation history and the context from the project to work out a really nice commit *title* for the commit, that summarises in one sentence all the main things included in the commit, e.g. bug fixes, UI changes, documentation updates, script updates - whatever the main things were.
- Use the conversation history and the context from the project to work out a really nice, comprehensive commit *message body* that is a detailed, well formatted description of what is being committed.  NOTE:  If the change in the commit is small (e.g. a small addition to some documentation) please don't write a full detailed, description of that one change, as the human will only want a summary of the change, and they can read the code/doc themselves if they need the full detail.  If there are lots of changes though - then obviously the human will want a detailed breakdown of what was done (summarised into sections - which is what you are already doing very well :-)
- Only if the changes done were related to Linear Issues: please add a section at the top listing them all.
- Then present a Menu to me, with 3 choices:
    1. Approve
    2. Edit commit message
    3. Abandon commit    

- If I select Edit and explain what I want changed, please just do that.  If I just select Edit without specifying then please ask me what I want changed and I will tell you, then please update the commit message and present to me for approval again and present the above Menu to me again.

- If I select Approve please
    - stage changes
    - commit changes
    - push to the remote repo

- If I select Abandon then please abandon this whole process and confirm no commands were run to make any changes.


CHECKLIST:
    - If the commit is small, double check the bit above about: "If the change in the commit is small..."