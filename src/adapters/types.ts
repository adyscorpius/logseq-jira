/**
 * Abstraction layer types for Logseq API compatibility
 */

export interface Block {
  uuid: string;
  content: string;
  page?: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
  };
  properties?: Record<string, any>;
}

export interface BlockData {
  content: string;
  properties?: Record<string, any>;
}

export interface InsertOptions {
  before?: boolean;
  sibling?: boolean;
}

export interface PluginSettings extends Record<string, any> {
  [key: string]: any;
}

export interface SettingSchema {
  key: string;
  title: string;
  description: string;
  type: string;
  default: any;
  [key: string]: any;
}

export type MessageType = 'info' | 'error' | 'warning';

export interface LogseqCapabilities {
  hasDBBackend: boolean;
  apiVersion: string;
  supportsBatchInsert: boolean;
  supportsBlockProperties: boolean;
  supportsAdvancedQueries: boolean;
}

/**
 * Main adapter interface for Logseq operations
 */
export interface LogseqAdapter {
  // Block operations
  getCurrentBlock(): Promise<Block | null>;
  getBlock(id: string): Promise<Block | null>;
  updateBlock(id: string, content: string): Promise<void>;
  getEditingBlockContent(): Promise<string>;
  insertBatchBlock(parentId: string, blocks: BlockData[], options?: InsertOptions): Promise<void>;
  
  // Command registration
  registerSlashCommand(name: string, handler: () => Promise<void>): void;
  
  // Settings
  useSettingsSchema(schema: SettingSchema[]): void;
  getSettings(): PluginSettings;
  
  // UI
  showMessage(message: string, type?: MessageType): void;
  hideMainUI(): void;
  isMainUIVisible(): boolean;
  
  // Lifecycle
  ready(): Promise<void>;
  beforeUnload(handler: () => void): void;
  
  // Events
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  
  // Capabilities
  getCapabilities(): LogseqCapabilities;
}