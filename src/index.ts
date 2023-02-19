import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

/**
 * Main Logseq-Jira Function to register the plugin.
 */

function main() {

    logseq.useSettingsSchema(settings);

    logseq.Editor.registerSlashCommand('Update Jira Issue', (_) => {
        return updateJiraIssue();
    })

    logseq.App.registerCommand('refreshJira', {
        key: 'refreshJira',
        label: 'Refresh Jira',
        desc: 'Refresh Jira links in block',
        keybinding: { binding: 'mod+shift+j' }
    }, (e) => {
        return updateJiraIssue();
    })

    console.log("Jira Plugin loaded.")

}


// Regex declarations
// DEV-1000
const issueKeyRegex: RegExp = /(?<![\,\.\/\S])(?<issue>[A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim;

// https://company.atlassian.net/browse/DEV-1000
const jiraRegex: RegExp = /(?<!\()(?<url>https*:\/\/.{1,25}.atlassian.net\/browse\/(?<issue>[A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim;

// [Some Jira status text we could update](https://company.atlassian.net/browse/DEV-1000)
const jiraLinkRegex: RegExp = /\[(?<description>[^\]]*)?\]\((?<url>https?:\/\/[A-Za-z0-9 ]+\.atlassian\.net\/browse\/(?<issue>[A-Za-z0-9\-]+))\)/gim;

// [A Markdown URL](https://some.other-url.com/we-dont-care-about)
const markdownLinkRegex: RegExp = /(?:__|[*#])|\[(.*?)\]\(.*?\)/gi;

// DEV-1000 https://company.atlassian.net/browse/DEV-1000 (basically everything that has an issueKey)
const issueTestRegex: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/i



// Primary function called by slash command
async function updateJiraIssue() {
    try {

        // Get current block value
        const currentBlock = await logseq.Editor.getCurrentBlock();
        let value = currentBlock?.content;

        if (!value || value.length < 3 || !issueTestRegex.test(value)) {                                               // TODO: Find a better logic?
            logseq.UI.showMsg("Couldn't find a valid Jira issue key.", 'error');
            return;
        };

        value = await replaceAsync(value, 'issueKey', generateTextFromAPI);
        value = await replaceAsync(value, 'jiraLink', generateTextFromAPI);
        value = await replaceAsync(value, 'markdown', generateTextFromAPI);
        await logseq.Editor.updateBlock(currentBlock.uuid, value);
        logseq.UI.showMsg('Updated all JIRA links found.')
    } catch (e) {
        console.log('logseq-jira', e.message);
    }
}

// Helper function run regex replacements asynchronously and as soon as possible.
async function replaceAsync(
    str: string,
    regexType: 'issueKey' | 'jiraLink' | 'markdown',
    getAPIResponseText: any) {

    const isIssueType = regexType === 'issueKey';
    const isJiraLink = regexType === 'jiraLink';
    let regex: RegExp = isIssueType ? issueKeyRegex : isJiraLink ? jiraRegex : jiraLinkRegex;
    const promises = (Array.from(str.matchAll(regex), (match) => {
        return getAPIResponseText(match.groups.issue);
    }));
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


// Make API call to Atlassian for generating new text from from Jira Issue key
async function generateTextFromAPI(issueKey: string): Promise<string> {
    try {
        if (!issueTestRegex.test(issueKey)) {
            console.log(`logseq-jira: Badly structured issueKey ${issueKey}`);
        }

        const baseURL = logseq.settings?.jiraBaseURL;
        if (!baseURL) {
            logseq.UI.showMsg('Jira base URL not set. Update in Plugin settings.')
            throw new Error('Jira base URL not set.');
        }

        const creds = Buffer.from(`${logseq.settings?.jiraUsername}:${logseq.settings?.jiraAPIToken}`).toString("base64");
        const issueRest = `https://${baseURL}/rest/api/3/issue/${issueKey}`;
        const jiraURL = `https://${baseURL}/browse/${issueKey}`;
        const response = await fetch(issueRest, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${creds}`
            }
        });
        
        const data = await response.json();
        if (response.status >= 300) {
            const error = data.errorMessages[0] || 'Unknown Error';
            //logseq.UI.showMsg(`Error requesting info for ${issueKey}`);
            return `[Error ${response.status}|${issueKey}|${error}](${jiraURL})`
        }
        return `[${issueKey}|${data?.fields.summary}](${jiraURL})`;
    } catch (e) {
        console.log('logseq-jira', e.message);
        return `${issueKey} : Error.`
    }
}


const settings: SettingSchemaDesc[] = [
    {
        key: "jiraUsername",
        description: "Your JIRA Username (Normally an email ID)",
        type: "string",
        default: "",
        title: "JIRA Username",
    },
    {
        key: "jiraAPIToken",
        description: "Your JIRA API Token generated as per https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
        type: "string",
        default: "",
        title: "JIRA API Token",
    },
    {
        key: "jiraBaseURL",
        description: "Base URL for your Jira instance in the format <orgname>.atlassian.net (Don't include the initial https:// and trailing /",
        type: "string",
        default: "orgname.atlassian.net",
        title: "Base URL for your organization",
    },
];


logseq.ready(main).catch(console.error);
