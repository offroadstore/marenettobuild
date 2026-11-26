import type { EditorialActive, EditorialVideo } from '@workspace/api-client-react';
export const seriesLabels: Record<string, string[]>;
export const seriesCardLabels: Record<string, string[]>;
export const sourceLabels: Record<string, string>;
export function readyVideo(video?: EditorialVideo): boolean;
export function embedURL(video: EditorialVideo): string;
export function seriesStructuredData(edition: Pick<EditorialActive, 'content' | 'path' | 'locale' | 'revisionId'>, origin: string): Record<string, unknown>[];
