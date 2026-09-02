---
description: Give the user a numbered listing the skill call stack that we are in
disable-model-invocation: false
---


## Step 0 - Set Variables

Set:
skill-base-dir = the skill base directory you were provided with when you ran this skill, written with FORWARD slashes (e.g. C:/Users/... on Windows) so it needs no escaping when it goes into JSON.
conversation-file = {skill-base-dir}/conversation-files/conversation-about-call-stack-being-fragile.md

Tell the user:
- the full list of variables you have created above with names and values.

## Step 1 - Give Listing

Give the user a numbered listing of the current stack of skills/commands, from outermost to innermost.

## Step 2 - Summarise Conversation

Read:

{conversation-file}

and tell the user the full filename and summarise to the user what was discussed.

Then tell them ways we can try to avoid this problem of the stack getting lost/forgotten if it's very deep/complex.

## Step 3 - Await Enter Button Before Finishing This Skill

Then get the user to hit Enter to continue...