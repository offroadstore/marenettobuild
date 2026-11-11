const campaignParamNames = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id']);

export function approvedCampaignParams(search: string) {
  const approved = new URLSearchParams();
  new URLSearchParams(search).forEach((value, key) => {
    if (campaignParamNames.has(key) && !approved.has(key)) approved.append(key, value);
  });
  return approved;
}

export function withCampaignParams(href: string, search = typeof window === 'undefined' || document.documentElement.dataset.hydrated !== 'true' ? '' : window.location.search) {
  const target = new URL(href, typeof window === 'undefined' ? 'https://preview.invalid' : window.location.origin);
  approvedCampaignParams(search).forEach((value, key) => target.searchParams.set(key, value));
  return `${target.pathname}${target.search}${target.hash}`;
}
