# Logseq API Adapter Layer

This directory contains the abstraction layer for Logseq API compatibility, enabling the plugin to work with both legacy and database-backed versions of Logseq.

## Architecture

### Core Components

1. **types.ts** - TypeScript interfaces and types for the adapter layer
2. **legacyAdapter.ts** - Implementation for current @logseq/libs API
3. **dbAdapter.ts** - Implementation for future database-backed API
4. **adapterFactory.ts** - Factory pattern for runtime adapter selection

### Usage

```typescript
import { getLogseqAdapter } from './adapters/adapterFactory';

const adapter = getLogseqAdapter();
const block = await adapter.getCurrentBlock();
```

## Adapter Selection Logic

The factory automatically detects the Logseq environment and selects the appropriate adapter:

1. **DB Adapter** is used when:
   - `logseq.DB` API is available
   - Logseq version >= 0.10.0
   - Database-specific features are detected

2. **Legacy Adapter** is used for:
   - Current @logseq/libs API (< 0.10.0)
   - Fallback when DB detection fails

## API Compatibility

All adapters implement the same `LogseqAdapter` interface, ensuring:

- **Consistent API** across Logseq versions
- **Type Safety** with TypeScript
- **Error Handling** with graceful fallbacks
- **Resource Management** with proper cleanup

## Migration Benefits

1. **Future-Proof** - Ready for Logseq DB migration
2. **Backward Compatible** - Works with current Logseq versions
3. **Maintainable** - Clean separation of concerns
4. **Testable** - Easy to mock and test different scenarios

## Development

### Adding New API Methods

1. Add method to `LogseqAdapter` interface in `types.ts`
2. Implement in both `legacyAdapter.ts` and `dbAdapter.ts`
3. Update factory if needed for capability detection

### Testing

```typescript
// Mock adapter for testing
const mockAdapter: LogseqAdapter = {
  getCurrentBlock: jest.fn(),
  // ... other methods
};
```

## Environment Detection

The factory provides detailed environment information:

```typescript
import { AdapterFactory } from './adapterFactory';

const envInfo = AdapterFactory.getEnvironmentInfo();
console.log(envInfo);
// {
//   logseqVersion: "0.9.0",
//   hasDBAPI: false,
//   hasLegacyAPI: true,
//   adapterType: "legacy",
//   capabilities: { ... }
// }
```