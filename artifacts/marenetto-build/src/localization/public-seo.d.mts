type SeoEdition = { path: string; locale: string; contentLanguage: string; id: string; title: string; description: string };
export function isNativeEdition(edition: SeoEdition): boolean;
type ActiveMeta = { path: string; revisionId: string; content?: { seoTitle?: string; title?: string; seoDescription?: string; summary?: string; contentLanguage?: string } };
export function mergeActiveMetadata<T extends SeoEdition>(entries: T[], active: ActiveMeta[]): T[];
export function releaseMetadata(edition: SeoEdition, html?: string, entries?: SeoEdition[]): { title: string; description: string };
