import { getDomain } from 'tldts';

// This public-suffix dependency belongs to build/server validation, never to
// browser code. Exact allowlists keep the browser independent of provider names.
export function validatePublicHosts(policy) {
  if (!policy || !Array.isArray(policy.siteHosts) || !policy.siteHosts.length ||
      !Array.isArray(policy.analyticsRuntimeHosts)) throw new Error('Invalid public host policy');
  const domain = host => {
    if (typeof host !== 'string' || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) ||
        /^[\d.]+$/.test(host) || new URL(`https://${host}`).hostname !== host) {
      throw new Error('Public hosts must be exact DNS names without ports, paths or wildcards');
    }
    const value = getDomain(host, { allowPrivateDomains: true });
    if (!value) throw new Error('Public host has no registrable domain');
    return value;
  };
  const sites = new Set(policy.siteHosts.map(domain));
  for (const host of policy.analyticsRuntimeHosts) {
    if (sites.has(domain(host))) throw new Error('Analytics runtime must use a different registrable domain');
  }
}
