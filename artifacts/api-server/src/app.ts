import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Replit's HTTPS edge supplies HSTS in production; do not duplicate it.
  if (process.env.NODE_ENV !== "production") res.setHeader("Strict-Transport-Security", "max-age=86400");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader(
    process.env.MARENETTO_CSP_MODE === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  );
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// CORS: only the site's own origins may call the API with credentials.
// Extra origins can be added with ALLOWED_ORIGINS (comma separated, full https:// origins).
const allowedOrigins = new Set(
  [
    "https://marenettobuild.com",
    "https://www.marenettobuild.com",
    ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
    ...(process.env.NODE_ENV === "production" ? [] : [process.env.REPLIT_DOMAINS, process.env.REPLIT_DEV_DOMAIN])
      .flatMap((value) => (value ?? "").split(","))
      .map((domain) => (domain.trim() ? `https://${domain.trim()}` : "")),
  ]
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
);
app.use((_req, res, next) => { res.vary("Origin"); next(); });
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Same-origin and server-to-server requests carry no Origin header.
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);
app.use("/api/internal/editorial", express.json({ limit: "1mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use((_req, res) => { res.status(404).json({ error: "Not found." }); });
const handleError: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) req.log.error({ status }, "API request failed");
  res.status(status).json({ error: status < 500 ? "Invalid request." : "Internal server error." });
};
app.use(handleError);

export default app;
