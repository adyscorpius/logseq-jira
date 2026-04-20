/**
 * Factory for creating the appropriate Logseq adapter based on runtime detection
 */

import { LogseqAdapter, LogseqCapabilities } from './types';
import { LegacyLogseqAdapter } from './legacyAdapter';
import { DBLogseqAdapter } from './dbAdapter';

export class AdapterFactory {
  private static instance: LogseqAdapter | null = null;
  private static capabilities: LogseqCapabilities | null = null;

  /**
   * Get the appropriate adapter for the current Logseq environment
   */
  static getAdapter(): LogseqAdapter {
    if (!this.instance) {
      this.instance = this.createAdapter();
    }
    return this.instance;
  }

  /**
   * Get capabilities of the current Logseq environment
   */
  static getCapabilities(): LogseqCapabilities {
    if (!this.capabilities) {
      const adapter = this.getAdapter();
      this.capabilities = adapter.getCapabilities();
    }
    return this.capabilities;
  }

  /**
   * Force recreation of adapter (useful for testing or version changes)
   */
  static resetAdapter(): void {
    if (this.instance && typeof (this.instance as any).cleanup === 'function') {
      (this.instance as any).cleanup();
    }
    this.instance = null;
    this.capabilities = null;
  }

  /**
   * Check if we should use the DB adapter
   */
  static shouldUseDBAdapter(): boolean {
    // Check for explicit DB API
    if (typeof (logseq as any).DB !== 'undefined') {
      return true;
    }

    // Check version if available
    if (typeof logseq.version === 'string') {
      const version = logseq.version;
      // Assume DB version starts at 0.10.0
      return this.compareVersions(version, '0.10.0') >= 0;
    }

    // Check for specific DB-related features
    if (typeof (logseq as any).query !== 'undefined' && 
        typeof (logseq as any).datascript !== 'undefined') {
      return true;
    }

    return false;
  }

  /**
   * Create the appropriate adapter based on environment detection
   */
  private static createAdapter(): LogseqAdapter {
    const useDB = this.shouldUseDBAdapter();
    
    console.log(`Creating ${useDB ? 'DB' : 'Legacy'} Logseq adapter`);
    
    if (useDB) {
      return new DBLogseqAdapter();
    } else {
      return new LegacyLogseqAdapter();
    }
  }

  /**
   * Compare two semantic version strings
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  private static compareVersions(a: string, b: string): number {
    const parseVersion = (version: string): number[] => {
      return version.replace(/[^\d.]/g, '').split('.').map(Number);
    };

    const versionA = parseVersion(a);
    const versionB = parseVersion(b);
    const maxLength = Math.max(versionA.length, versionB.length);

    for (let i = 0; i < maxLength; i++) {
      const numA = versionA[i] || 0;
      const numB = versionB[i] || 0;

      if (numA < numB) return -1;
      if (numA > numB) return 1;
    }

    return 0;
  }

  /**
   * Get detailed environment information for debugging
   */
  static getEnvironmentInfo(): {
    logseqVersion: string;
    hasDBAPI: boolean;
    hasLegacyAPI: boolean;
    adapterType: 'db' | 'legacy';
    capabilities: LogseqCapabilities;
  } {
    const capabilities = this.getCapabilities();
    
    return {
      logseqVersion: capabilities.apiVersion,
      hasDBAPI: typeof (logseq as any).DB !== 'undefined',
      hasLegacyAPI: typeof logseq.Editor !== 'undefined',
      adapterType: this.shouldUseDBAdapter() ? 'db' : 'legacy',
      capabilities
    };
  }
}

// Export singleton instance getter for convenience
export const getLogseqAdapter = (): LogseqAdapter => AdapterFactory.getAdapter();
export const getLogseqCapabilities = (): LogseqCapabilities => AdapterFactory.getCapabilities();