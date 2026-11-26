import type { EditorialActive } from '@workspace/api-client-react';
import type { Edition } from '@/localization/edition-inventory';
export const seriesRelease: {
  id: string;
  contentDigest: string;
  records: { identity:string;locale:string;path:string;episode:number;hash:string;sourceHash:string;oldPath?:string;seoTitle?:string }[];
};
export function seriesEntries(active: EditorialActive[]): Edition[];
