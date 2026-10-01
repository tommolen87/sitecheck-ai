import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Render/Vercel plaatsen de client-IP in de eerste trusted proxylaag.\napp.set("trust proxy", 1);

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
const frontendOrigin = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\\/$/, "");\napp.use(\n  cors({\n    origin: frontendOrigin,\n    methods: ["GET", "POST", "OPTIONS"],\n  }),\n);

// Stripe webhook moet de originele, onbewerkte body ontvangen
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
);

app.use(express.json({ limit: "32kb" }));

app.use(express.urlencoded({ extended: true, limit: "32kb" }));

app.use("/api", router);

export default app;
