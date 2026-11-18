import express, { type Express } from "express";
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
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
// CORS: only the site's own origins may call the API with credentials.
// Extra origins can be added with ALLOWED_ORIGINS (comma separated, full https:// origins).
const allowedOrigins = new Set(
  [
    "https://marenettobuild.com",
    "https://www.marenettobuild.com",
    ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
    ...[process.env.REPLIT_DOMAINS, process.env.REPLIT_DEV_DOMAIN]
      .flatMap((value) => (value ?? "").split(","))
      .map((domain) => (domain.trim() ? `https://${domain.trim()}` : "")),
  ]
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Same-origin and server-to-server requests carry no Origin header.
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }),
);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
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

export default app;
