type SeoEdition = { path: string; locale: string; contentLanguage: string; id: string; title: string; description: string; coreMetadata?: { title: string; description: string }; activeSeoTitle?: boolean; activeSeoDescription?: boolean; commercialRelease?:string };
export function isNativeEdition(edition: SeoEdition): boolean;
export function hasTranslationApproval(edition: { translationRevision?: string; translationApprovalRevision?: string; approval?: string | null; translationSourceStale?: boolean }): boolean;
type ActiveMeta = { identity?:string;locale?:string;path: string; revisionId: string;revisionHash?:string;sourceHash?:string; content?: { seoTitle?: string; title?: string; seoDescription?: string; summary?: string; contentLanguage?: string; image?: string; tags?:string[] } };
export function mergeActiveMetadata<T extends SeoEdition>(entries: T[], active: ActiveMeta[]): T[];
export function releaseMetadata(edition: SeoEdition, html?: string, entries?: SeoEdition[]): { title: string; description: string };
