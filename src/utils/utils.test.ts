import { expect, test } from 'vitest';
import { formatIssue } from "./utils";
import { JiraPluginSettings } from '../models';
import { describe } from 'node:test';
import { Issue } from '../jiraTypes';

const issue = {
  key: 'ISSUE-123',
  fields: {
    status: {
      statusCategory: {
        colorName: 'blue',
        name: 'In Progress',
      },
      name: 'In Progress',
    },
    summary: 'This is a test issue summary',
    assignee: {
      displayName: 'John Doe',
    },
    priority: {
      name: 'High',
    },
    fixVersions: [
      { name: 'v1.0.0' },
      { name: 'v2.0.0' },
    ],
    issuetype: {
      name: 'Bug',
    },
    creator: {
      displayName: 'Jane Smith',
    },
    reporter: {
      displayName: 'Alice Brown',
    },
    resolution: {
      name: 'Fixed',
    },
  },
} as Issue;


const r = String.raw;
const l = "(https://test.de)"
describe("formatIssue()", () => {
  test.each([
     /* [issueLinkFormat, expected] */
     [r`Legacy strings without brackets should be links`, r`[Legacy strings without brackets should be links]${l}`],
    [r`This is a [Link] test`, r`This is a [Link]${l} test`], 
    [r`This [should] render [multiple] links`, r`This [should]${l} render [multiple]${l} links`],
    [r`Escaped \c\h\a\r\s outside [brackets] are unescaped`, r`Escaped chars outside [brackets]${l} are unescaped` ],
    [r`Escaped [\c\h\a\r\s inside brackets] stay escaped`, r`Escaped [\c\h\a\r\s inside brackets]${l} stay escaped` ],
    [r`\\[Escaped backslashes] at the beginning are unescaped`, r`\[Escaped backslashes]${l} at the beginning are unescaped` ],
    [r`\[[Escaped brackets] at the beginning are unescaped`, r`[[Escaped brackets]${l} at the beginning are unescaped` ],
    [r`Also \[[Escaped brackets] before brackets are unescaped`, r`Also [[Escaped brackets]${l} before brackets are unescaped` ],
    [r`Also [Escaped brackets]\] after brackets are unescaped`, r`Also [Escaped brackets]${l}] after brackets are unescaped` ],
    [r`Brackets inside bracket [\[\]] do not break`, r`Brackets inside bracket [\[\]]${l} do not break`],
    [r`Brackets around bracket \[[]\] do not break`, r`Brackets around bracket [[]${l}] do not break`],
  ])("%s -> %s", (input, expected) => {
    const settings = {
      issueLinkTextFormat: input
    } as JiraPluginSettings;
    expect(formatIssue({ jiraURL: "https://test.de", body: issue }, settings)).toBe(expected);
  })
})
