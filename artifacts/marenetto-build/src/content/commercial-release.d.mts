import type { EditorialActive } from '@workspace/api-client-react';
import type { Edition } from '@/localization/edition-inventory';
export const RELEASE_IMAGE: string;
export function commercialRecord(live: EditorialActive): {identity:string;locale:string;path:string;area:string;hash:string;sourceHash:string;preparedAt:string;readOnlySeries?:boolean;presentation?:{body:string;seoTitle:string;seoDescription:string;faq:{question:string;answer:string}[]}}|undefined;
export function commercialEntries(active: EditorialActive[]): Edition[];
export const releaseSourceLabels: Record<string,string>;
export function commercialFAQ(body: string,retained?:{question:string;answer:string}[]): {question:string;answer:string}[];
