[![Build plugin](https://github.com/adyscorpius/logseq-jira/actions/workflows/publish.yml/badge.svg)](https://github.com/adyscorpius/logseq-jira/actions/workflows/publish.yml)

## Logseq Jira Sync Plugin

Bring Jira issue status and summaries to Logseq with Logseq-Jira. Include important fields like Priority, Status, Assignee and Reporter as block properties to then query within Logseq as needed.

Check out the discussion on Logseq Forums by [clicking here](https://discuss.logseq.com/t/logseq-jira-plugin/12414?u=adit)

## Quick Start

Start by using `ctrl+shift+j` in a block containing a JIRA issue key or link.

## What it does?

![Demo](./demo.gif)

## Current Functionality

1. Use the slash command "Update Jira Issue" or "Mod+Shift+J" to replace issue keys (PM-100, ISS-12143, etc.) or issue links like subdomain.atlassian.net/browse/PM-100 with `[<issueKey>|<issueSummary>](https://orgname.atlassian.net/browse/<issueKey>)` formats. Enable the option to add block properties to further enhance ticket details, all from within Logseq.

### Known Limitations

1. Limited to current block.
2. Statuses and issue details are not automatically updated. (Need to check performance impact).
3. Supports Jira Cloud.

### Roadmap

- [x]  Refresh summary on rerun on existing links.
- [x]  Add more fields to help with context of the tickets
- [ ]  Auto refresh/update all links when page is loaded.
- [ ]  Auto refresh all Jira links across vault (need to verify performance impact on doing this).
- [ ]  Create your own Link description format with Jira variables ( '{issueKey} - {status} - {summary}' )

### Download

The plugin is available to download directly from Logseq's Plugins marketplace. Alternatively, you can download the latest release from [Releases](https://github.com/adyscorpius/logseq-jira/releases) published on Github.

### How to build the plugin

- Git clone the repository to your local system. Or download and extract to a known path.
- `npm install && npm run build` in terminal to install dependencies and generate distribution folder.
- Enable Developer mode in Logseq by going to Settings -> Advanced -> Turn on Developer Mode.
- `Load unpacked plugin` in Logseq Desktop client and select the folder for the plugin on your disk.
- For updates, git pull the main branch and 'Reload Package' under Plugins > Logseq Jira.

### Release process

- Update version in package.json
- Add all updates to master branch
- Tag the latest commit with new version.