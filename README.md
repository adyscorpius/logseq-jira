[![Build plugin](https://github.com/adyscorpius/logseq-jira/actions/workflows/publish.yml/badge.svg)](https://github.com/adyscorpius/logseq-jira/actions/workflows/publish.yml)

## Logseq Jira Sync Plugin

Are you tired of copying Jira links, only to not remember which Jira is it? What about getting updates without clicking on each link? Or querying blocks within Logseq based on ticket status?

Bring your Jira issue status and summaries into Logseq with Logseq-Jira. Include important fields like Priority, Status, Assignee and Reporter as block properties to then query within Logseq as needed.

Check out the discussion on Logseq Forums by [clicking here](https://discuss.logseq.com/t/logseq-jira-plugin/12414?u=adit)

## What it does?

![Demo](./demo.gif)

## Current Functionality

1. Use the slash command "Update Jira Issue" to replace issue keys (PM-100, ISS-12143, etc.) or Jira issue links like subdomain.atlassian.net/browse/PM-100 with `[<issueKey>|<issueSummary>](https://orgname.atlassian.net/browse/<issueKey>)` formats.
2. Use optional block properties to keep the text as in, but add key issue fields as block properties.
3. *NEW* Supports two Jira Cloud instances. Keep your work JIRA separate from your personal JIRA.

### Known Limitations

1. Earlier issue details are not automatically updated. (Need to check performance impact).
3. Supports **Jira Cloud only**. 

### Roadmap

- [X]  Refresh summary on rerun on existing links.
- [X]  Add more fields to help with context of the tickets
- [X]  Support for multiple organizations.
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
