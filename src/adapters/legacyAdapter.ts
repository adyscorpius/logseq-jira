/**
 * Legacy Logseq API Adapter
 * Wraps the current @logseq/libs API for compatibility
 */

import { BlockEntity } from "@logseq/libs/dist/LSPlugin";
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
import { 
  LogseqAdapter, 
  Block, 
  BlockData, 
  InsertOptions, 
  PluginSettings, 
  SettingSchema, 
  MessageType,
  LogseqCapabilities 
} from './types';

export class LegacyLogseqAdapter implements LogseqAdapter {
  private eventHandlers = new Map<string, Set<Function>>();

  constructor() {
    // Initialize any legacy-specific setup
  }

  async getCurrentBlock(): Promise<Block | null> {
    try {
      const block = await logseq.Editor.getCurrentBlock();
      return this.convertBlockEntity(block);
    } catch (error) {
      console.error('Failed to get current block:', error);
      return null;
    }
  }

  async getBlock(id: string): Promise<Block | null> {
    try {
      const block = await logseq.Editor.getBlock(id);
      return this.convertBlockEntity(block);
    } catch (error) {
      console.error(`Failed to get block ${id}:`, error);
      return null;
    }
  }

  async updateBlock(id: string, content: string): Promise<void> {
    try {
      await logseq.Editor.updateBlock(id, content);
    } catch (error) {
      console.error(`Failed to update block ${id}:`, error);
      throw error;
    }
  }

  async getEditingBlockContent(): Promise<string> {
    try {
      return await logseq.Editor.getEditingBlockContent();
    } catch (error) {
      console.error('Failed to get editing block content:', error);
      return '';
    }
  }

  async insertBatchBlock(
    parentId: string, 
    blocks: BlockData[], 
    options: InsertOptions = {}
  ): Promise<void> {
    try {
      await logseq.Editor.insertBatchBlock(
        parentId,
        blocks.map(block => ({ content: block.content })),
        {
          before: options.before ?? false,
          sibling: options.sibling ?? false
        }
      );
    } catch (error) {
      console.error(`Failed to insert batch blocks for ${parentId}:`, error);
      throw error;
    }
  }

  registerSlashCommand(name: string, handler: () => Promise<void>): void {
    try {
      logseq.Editor.registerSlashCommand(name, handler);
    } catch (error) {
      console.error(`Failed to register slash command ${name}:`, error);
    }
  }

  useSettingsSchema(schema: SettingSchema[]): void {
    try {
      const legacySchema = schema.map(this.convertSettingSchema);
      logseq.useSettingsSchema(legacySchema);
    } catch (error) {
      console.error('Failed to use settings schema:', error);
    }
  }

  getSettings(): PluginSettings {
    return (logseq.settings as PluginSettings) || {};
  }

  showMessage(message: string, type: MessageType = 'info'): void {
    try {
      logseq.UI.showMsg(message, type);
    } catch (error) {
      console.error('Failed to show message:', error);
    }
  }

  hideMainUI(): void {
    try {
      if (window.logseq?.hideMainUI) {
        window.logseq.hideMainUI();
      }
    } catch (error) {
      console.error('Failed to hide main UI:', error);
    }
  }

  isMainUIVisible(): boolean {
    try {
      return logseq.isMainUIVisible ?? false;
    } catch (error) {
      console.error('Failed to check main UI visibility:', error);
      return false;
    }
  }

  async ready(): Promise<void> {
    return new Promise((resolve, reject) => {
      logseq.ready()
        .then(() => resolve())
        .catch(reject);
    });
  }

  beforeUnload(handler: () => void): void {
    try {
      logseq.beforeunload(handler);
    } catch (error) {
      console.error('Failed to register beforeunload handler:', error);
    }
  }

  on(event: string, handler: Function): void {
    try {
      logseq.on(event as any, handler);
      
      // Track handlers for cleanup
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, new Set());
      }
      this.eventHandlers.get(event)!.add(handler);
    } catch (error) {
      console.error(`Failed to register event handler for ${event}:`, error);
    }
  }

  off(event: string, handler: Function): void {
    try {
      logseq.off(event as any, handler);
      
      // Remove from tracking
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    } catch (error) {
      console.error(`Failed to remove event handler for ${event}:`, error);
    }
  }

  getCapabilities(): LogseqCapabilities {
    return {
      hasDBBackend: false,
      apiVersion: this.detectVersion(),
      supportsBatchInsert: typeof logseq.Editor.insertBatchBlock !== 'undefined',
      supportsBlockProperties: true,
      supportsAdvancedQueries: false
    };
  }

  // Private helper methods

  private convertBlockEntity(block: BlockEntity | null): Block | null {
    if (!block) return null;

    return {
      uuid: block.uuid,
      content: block.content || '',
      page: block.page ? {
        id: block.page.id?.toString() || '',
        name: block.page.name || block.page['journal-day']?.toString() || ''
      } : undefined,
      parent: block.parent ? {
        id: block.parent.id?.toString() || ''
      } : undefined,
      properties: block.properties || {}
    };
  }

  private convertSettingSchema(schema: SettingSchema): SettingSchemaDesc {
    return {
      key: schema.key,
      title: schema.title,
      description: schema.description,
      type: schema.type as any,
      default: schema.default,
      ...schema
    };
  }

  private detectVersion(): string {
    // Try to detect Logseq version
    if (typeof logseq.version === 'string') {
      return logseq.version;
    }
    
    // Fallback version detection based on available APIs
    if (typeof logseq.Editor.insertBatchBlock !== 'undefined') {
      return '0.9.0+';
    }
    
    return '0.8.0';
  }

  // Cleanup method for proper resource management
  cleanup(): void {
    // Remove all event handlers
    for (const [event, handlers] of this.eventHandlers) {
      for (const handler of handlers) {
        this.off(event, handler);
      }
    }
    this.eventHandlers.clear();
  }
}