import { vi } from "vitest";

globalThis.logseq = {} as any;
vi.stubGlobal('logseq', {
  isMainUIVisisble: false,
  on: vi.fn(() => ({} as any))
})
