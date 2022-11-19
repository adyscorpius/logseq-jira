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

    console.log("Jira Plugin loaded.")

}


// Regex declarations
// DEV-1000
const issueKeyRegex: RegExp = /(?<![\,\.\/\S])([A-Z][A-Z0-9]+-[0-9]+)(?!.?\])/gim;

// https://company.atlassian.net/browse/DEV-1000
const jiraRegex: RegExp = /(?<!\()(https*:\/\/.{1,25}.atlassian.net\/browse\/([A-Z][A-Z0-9]{1,6}-[0-9]{1,8}))(?!\))/gim;

// [Some Jira status text we could update](https://company.atlassian.net/browse/DEV-1000)
const jiraLinkRegex: RegExp = /\[([^\]]*)?\]\((https?:\/\/[A-Za-z0-9 ]+\.atlassian\.net\/browse\/([A-Za-z0-9\-]+))\)/gim;

// [A Markdown URL](https://some.other-url.com/we-dont-care-about)
const markdownLinkRegex: RegExp = /(?:__|[*#])|\[(.*?)\]\(.*?\)/gi;

// DEV-1000 https://company.atlassian.net/browse/DEV-1000 (basically everything that has an issueKey)
const issueTestRegex: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/i



// Primary function called by slash command
async function updateJiraIssue() {
    try {
        // Get current block value
        const currentBlock = await logseq.Editor.getCurrentBlock();
        const value = currentBlock?.content;

        if (value.length < 3 || !issueTestRegex.test(value)) {                                               // TODO: Find a better logic?
            logseq.UI.showMsg("Text is too short or doesn't contain a valid Jira issue.", 'error');
            return;
        };

        let newValue = await replaceAsync(value, 'issueKey', generateTextFromAPI);
        newValue = await replaceAsync(newValue, 'jiraLink', generateTextFromAPI);
        newValue = await replaceAsync(newValue, 'markdown', generateTextFromAPI);
        await logseq.Editor.updateBlock(currentBlock.uuid, newValue);
        logseq.UI.showMsg('Updated all JIRA links found.')
    } catch (e) {
        console.log('logseq-jira', e.message);
    }
}

// Helper function run regex replacements asynchronously and as soon as possible.
async function replaceAsync(str: string, regexType: 'issueKey' | 'jiraLink' | 'markdown', asyncFn: any) {
    const isIssueType = regexType === 'issueKey';
    const isJiraLink = regexType === 'jiraLink';
    let regex: RegExp = isIssueType ? issueKeyRegex : isJiraLink ? jiraRegex : jiraLinkRegex;
    // Send match value if regex type is issue Key, else send 2nd match group value to correspond to the same value. 
    // Match type for issueKey = ["DEV-7457", "DEV-7457"] 
    // Match type for jiraLink = ["https://company.atlassian.net/browse/DEV-7457", "https://company.atlassian.net/browse/DEV-7457", "DEV-7457"]
    const promises = (Array.from(str.matchAll(regex), (match) => {
        return asyncFn(isIssueType ? match[0] : isJiraLink ? match[2] : match[3])
    }));
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}


// Make API call to Atlassian for generating new text from from Jira Issue key
async function generateTextFromAPI(issueKey: string): Promise<string> {
    try {
        if (!issueTestRegex.test(issueKey)) console.log(`logseq-jira: Badly structured issueKey ${issueKey}`);
        const creds = Buffer.from(`${logseq.settings?.jiraUsername}:${logseq.settings?.jiraAPIToken}`).toString("base64");
        const issueRest = `https://${logseq.settings?.jiraBaseURL}/rest/api/3/issue/${issueKey}`;
        const jiraURL = `https://${logseq.settings?.jiraBaseURL}/browse/${issueKey}`;
        const r = await fetch(issueRest, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${creds}`
            }
        });
        
        const data = await r.json();
        if (r.status >= 300) {
            //logseq.UI.showMsg(`Error requesting info for ${issueKey}`);
            return `[Error ${r.status}|${issueKey}|${data.errorMessages[0]}](${jiraURL})`
        }
        return `[${data?.fields.status.name}|${issueKey}|${data?.fields.summary}](${jiraURL})`;
    } catch(e) {
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
