# Logseq-JIRA Plugin Setup Guide

This guide provides step-by-step instructions for setting up and using the Logseq-JIRA plugin.

## Installation

### Method 1: From Logseq Marketplace
1. Open Logseq
2. Click the three dots menu (⋮) in the top-right corner
3. Select "Plugins"
4. Search for "Jira" in the marketplace
5. Click "Install" on the Logseq Jira Sync plugin

### Method 2: Manual Installation
1. Download the latest release from [GitHub](https://github.com/adyscorpius/logseq-jira/releases)
2. In Logseq, click the three dots menu (⋮) > "Plugins"
3. Click "Load unpacked plugin"
4. Select the downloaded plugin folder

## Configuration

### Primary JIRA Account

1. Click the three dots menu (⋮) > "Plugins" > "Logseq Jira Sync" > "Settings"
2. Configure your primary JIRA account:
   - **JIRA Base URL**: Enter your JIRA instance's base URL (e.g., `company.atlassian.net`). Do not include 'https://' or a trailing '/'.
   - **JIRA Username**: Your JIRA username (usually your email address)
   - **JIRA API Token**: Generate a token from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - **Authentication Method**: Choose "Basic Auth" (default) or "PAT"
   - **API Version**: Select "3" for Cloud or newer instances, "2" for older on-premise installations

### Display Options

Configure how JIRA issues appear in your notes:

- **Issue Format**: Customize how issues appear using variables like `%key%`, `%summary%`, `%status%`, etc.
- **Support Org Mode**: Enable if you use Org Mode instead of Markdown
- **Auto-update Settings**: Configure automatic updates on paste and at startup
- **Block Properties**: Choose what JIRA fields to include as block properties

### Second JIRA Account (Optional)

If you work with multiple JIRA instances:

1. Enable "Enable Second JIRA Account"
2. Configure credentials similar to the primary account
3. Restart Logseq or reload the plugin for changes to take effect

## Usage

### Update JIRA Issue

1. Type a JIRA issue key (e.g., `PROJ-123`) in a Logseq block
2. Type `/Jira` and select "Jira: Update Issue"
3. The plugin will fetch the issue details and format it according to your settings

Example result:
```
🟢 Done - PROJ-123|Implement login functionality
```

### Working with Multiple JIRA Accounts

If you've configured a second JIRA account:

1. Type a JIRA issue key from your second account
2. Type `/Jira` and select "Jira: Update Issue for 2nd Org."

### JQL Queries

Fetch multiple issues with a JQL query:

1. Type `/Jira` and select "Jira: Pull JQL results"
2. The plugin will use the JQL query defined in Settings
3. Results will be displayed as child blocks

Default query: `assignee = currentUser() AND statusCategory != Done and Updated >= -30d`

## Advanced Features

### Auto-refresh on Startup

Enable "Auto refresh on start" in settings to automatically update all JIRA issues when Logseq starts.

### Custom Issue Format

Use variables in the "Issue Format" setting to customize how issues are displayed:

- `%key%` - Issue key (e.g., PROJ-123)
- `%statuscategoryicon%` - Status icon (🟢, 🔵, ⚪️)
- `%statuscategoryname%` - Status category (Done, In Progress, To Do)
- `%summary%` - Issue summary
- `%assignee%` - Assigned user
- `%priority%` - Issue priority
- `%fixversion%` - Fix version
- `%status%` - Issue status
- `%issuetype%` - Issue type
- `%creator%` - Issue creator
- `%reporter%` - Issue reporter
- `%resolution%` - Resolution status

### Auto-update on Paste

Enable "Update Issue when you Paste it" to automatically update any JIRA issue keys when pasted into Logseq.

## Troubleshooting

### Issues Not Updating

1. Verify your JIRA credentials in the plugin settings
2. Check that your API token is valid and hasn't expired
3. Confirm you have permission to access the issues
4. Try using the "Jira: Update Issue" command manually

### Connection Problems

1. Ensure your JIRA base URL is correct (no https://, no trailing slash)
2. Check if your network can reach the JIRA instance
3. Verify you're using the correct API version for your JIRA instance

### Error Messages

If you see error messages in Logseq's UI, they typically indicate:
- Invalid credentials
- Network connectivity issues
- Insufficient permissions
- Invalid issue keys

## Support

For issues, questions, or feature requests:
- Visit the [GitHub repository](https://github.com/adyscorpius/logseq-jira)
- Check the [discussion on Logseq Forums](https://discuss.logseq.com/t/logseq-jira-plugin/12414?u=adit)