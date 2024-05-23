import Dexie, { Table } from 'dexie';

export interface Issue {
  blockid?: string;
  name: string;
  useSecondOrg: boolean;
  timestamp: number;
}

export class MyIssuesDexie extends Dexie {
  // 'Issues' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  issues!: Table<Issue>;

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      issues: 'blockid, name, useSecondOrg, timestamp' // Primary key and indexed props
    });
  }
}

export const db = new MyIssuesDexie();