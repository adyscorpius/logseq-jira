import '@logseq/libs';
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

/**
 * Known Issues with code
 * 1. If the first value is the JIRA string, the function errors out. DONE
 * 2. Haven't tested with multiple values in a single row. 
 * 3. Running this on a link causes an error. 
 *      - Potential options 
 *          Prioritizing URLs over IssueKey regex
 *          Update regex to require whitespace on both sides. \S
 *          replace vs replaceAll
 *          Possible better execution with the following example
 *              https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
 */


const jira_matcher: RegExp = /([A-Z][A-Z0-9]+-[0-9]+)/g;

const getJiraIssue = async (
    issueRest: string, creds: string ) => {

    const r = await fetch(issueRest, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${creds}`
        }
    })
    const response = await r.json();
    return response;
}


const replaceJira = async (restURL, jiraURL, creds) => {
    const currentBlock = await logseq.Editor.getCurrentBlock();

    const value = currentBlock?.content || "";
    let matches = value.match(jira_matcher);

    if (matches === null) {
        logseq.UI.showMsg('No JIRA issues found.', 'error');
        return;
    }
    let newLinks: Array<string> = [];
    matches.forEach(
        async (m, i) => {
            try {
                const issueURL = `${jiraURL}${m.trim()}`;
                const issueRest = `${restURL}${m.trim()}`;
                const jiraData = await getJiraIssue(issueRest, creds);
                newLinks[i] = `[[${jiraData.fields.status.name}] - ${jiraData.fields.summary}](${issueURL})`;
                const newBlockValue = value.replace(m, newLinks[i]);
                await logseq.Editor.updateBlock(currentBlock.uuid, newBlockValue);
            } catch (e) {
                logseq.UI.showMsg(`Couldn't make API request ${e}`, 'error');
                return;
            }
        })

}

function main() {

    const user = logseq.settings?.jiraUsername;
    const apiToken = logseq.settings?.jiraAPIToken;
    const baseURL = logseq.settings?.jiraBaseURL;
    const restURL = `https://${baseURL}/rest/api/3/issue/`;
    const jiraURL = `https://${baseURL}/browse/`;
    const creds = Buffer.from(`${user}:${apiToken}`).toString("base64");

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
            description: "Your JIRA API Token.",
            type: "string",
            default: "",
            title: "JIRA API Token",
        },
        {
            key: "jiraBaseURL",
            description: "Base URL for your Jira instance (don't include the https:// and trailing /",
            type: "string",
            default: "orgname.atlassian.net",
            title: "Base URL for your organization",
        },
    ];

    logseq.useSettingsSchema(settings);

    logseq.Editor.registerSlashCommand('Refresh Jira', (_) => {
        return replaceJira(restURL, jiraURL, creds);
    })
    console.log("Jira Plugin loaded.")
}



logseq.ready(main).catch(console.error);
