---
description: Investigates git stuff for the user
disable-model-invocation: true
---

## Variables
Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill.
git-last-log-time-script-path = {skill-base-dir}/scripts/git-last-log-item.sh
show-git-status-script-path = {skill-base-dir}/../../plugin-scripts/git-scripts/show-git-status.sh


Tell the user:
- the skill base directory you were provided with when you ran this skill.
- the plugin base directory you were provided with when you ran this plugin skill (if you were given it)
- the full list of variables you have created above with names and values.

Run the script that comes packages with the skill:
{git-last-log-time-script-path}

Run the script that comes with the plugin at:
{show-git-status-script-path}

Look at the output from both and give the user a quick summary.