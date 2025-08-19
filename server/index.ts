import 'dotenv/config';
import express, { type Request, Response, NextFunction, RequestHandler } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session, { Session, SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      claims: { sub: string };
      access_token: string;
      expires_at: number;
    };
  }
}

// Extend Express Request type to include session
declare global {
  namespace Express {
    interface Request {
      session: Session & Partial<SessionData>;
    }
  }
}

// Simple in-memory session store
const sessions: Record<string, any> = {};
const app = express();

// Custom session middleware
const sessionMiddleware: RequestHandler = (req, res, next) => {
  // Get session ID from cookie or generate a new one
  let sessionId = req.headers.cookie?.split('; ')
    .find((row: string) => row.startsWith('connect.sid='))
    ?.split('=')[1];

  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    res.cookie('connect.sid', sessionId, { 
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Initialize session if it doesn't exist
  if (!sessions[sessionId]) {
    sessions[sessionId] = {};
  }

  // Add session to request
  req.session = sessions[sessionId];
  
  // Clean up old sessions (optional)
  const oneDay = 24 * 60 * 60 * 1000;
  Object.keys(sessions).forEach(id => {
    if (Date.now() - parseInt(id, 36) > oneDay) {
      delete sessions[id];
    }
  });

  next();
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
 const port = 3000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
