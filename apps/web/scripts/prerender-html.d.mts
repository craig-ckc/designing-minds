/** Types for the plain-JS prerender helpers, so tests/ can typecheck their use. */
export function createSnapshotAsset(snapshot: unknown): { fileName: string; source: string; scriptTag: string }
export function buildHtml(parts: { template: string; headTags: string; snapshotScript: string; appHtml: string }): string
export function buildShellHtml(parts: { template: string; snapshotScript: string }): string
