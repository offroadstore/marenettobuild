import {seriesRelease} from './series-release.mjs';
const norm=p=>p.replace(/\/+$/,'')||'/';
export const seriesRedirects=Object.fromEntries(seriesRelease.records.filter(r=>r.oldPath).map(r=>[norm(r.oldPath),r.path]));
export function seriesRedirect(pathname) {return seriesRedirects[norm(pathname)];}
