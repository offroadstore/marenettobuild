function analyticsFrameOrigin(value) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === value ? value : undefined;
  } catch { return undefined; }
}

export function setWebSecurityHeaders(res) {
  // The same-origin proxy serves Clerk's SDK. Fraud protection rotates its
  // client hostname, so scope the wildcard to that exact service suffix.
  const clerkProtect = 'https://*.client.protect.clerk.com';
  const analytics = analyticsFrameOrigin(process.env.MARENETTO_ANALYTICS_RUNTIME_ORIGIN);
  const directives = [
    "default-src 'self'",
    `script-src 'self' https://cdn.protect.clerk.com ${clerkProtect}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://img.clerk.com https://storage.googleapis.com",
    `connect-src 'self' https://storage.googleapis.com ${[clerkProtect, ...[18443, 2082, 8443, 992].map(port => `${clerkProtect}:${port}`)].join(' ')}`,
    `frame-src 'self'${analytics ? ` ${analytics}` : ''}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];
  res.setHeader(
    process.env.MARENETTO_CSP_MODE === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
    directives.join('; '),
  );
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Production TLS and HSTS are supplied by Replit's edge. Setting the same
  // header here produces a duplicated Strict-Transport-Security field.
  if (process.env.NODE_ENV !== 'production') res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
}
