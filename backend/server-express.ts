import "dotenv/config";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

const app: Application = express();
const PORT = process.env.PORT || 3002;

// Trust proxy für Rate Limiting
app.set('trust proxy', 1);

// Helmet Security Headers (nur einmal!)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://accounts.google.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      // Zusätzlicher XSS-Schutz
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Logging
app.use(morgan('combined'));

// Rate Limiting nur für externe IPs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000, // Erhöht für normale Nutzung
  message: { error: "Zu viele Requests." },
  skip: (req) => {
    // Interne IPs überspringen
    const clientIP = req.ip || req.connection.remoteAddress;
    return clientIP === '127.0.0.1' || 
           clientIP === 'localhost' || 
           clientIP === '::1' ||
           clientIP?.startsWith('192.168.') ||
           clientIP?.startsWith('10.') ||
           clientIP?.startsWith('172.');
  }
});

// Chat Rate Limiting - weniger streng
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: 100, // Erhöht von 10 auf 100 Nachrichten pro Minute
  message: { error: "Zu viele Nachrichten. Bitte warten Sie." },
  skip: (req) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    return clientIP === '127.0.0.1' || 
           clientIP === 'localhost' || 
           clientIP === '::1';
  }
});

// Messages Rate Limiting - weniger streng für unread-count und message loading
const messagesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 Minute
  max: 200, // Erhöht für unread-count und message loading
  message: { error: "Zu viele Requests. Bitte warten Sie." },
  skip: (req) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    return clientIP === '127.0.0.1' || 
           clientIP === 'localhost' || 
           clientIP === '::1';
  }
});

// Auth Rate Limiting (auch mit IP-Filter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Zu viele Login-Versuche." },
  skip: (req) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    return clientIP === '127.0.0.1' || 
           clientIP === 'localhost' || 
           clientIP === '::1';
  }
});

// CORS-Konfiguration
const corsOrigins: string[] = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://neighborly.website",
      "http://neighborly.website",
      "https://www.neighborly.website",
      "http://www.neighborly.website",
    ];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting anwenden
app.use(limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/conversations/start', chatLimiter);
app.use('/api/messages', messagesLimiter); // Geändert von chatLimiter zu messagesLimiter

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
  });
});

// Routes
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";
import messagesRouter from "./routes/messages";
import ratingsRouter from "./routes/ratings";
import helpOffersRouter from "./routes/helpOffers";
import authRouter from "./routes/auth";
import contactRouter from "./routes/contact";

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api", messagesRouter);
app.use("/api/ratings", ratingsRouter);
app.use("/api", helpOffersRouter);
app.use("/api/contact", contactRouter);

// Global Error Handler (verbessert)
app.use((err: Error, req: Request, res: Response) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validierungsfehler',
      details: isProduction ? undefined : err.message 
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Nicht autorisiert' 
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({ 
      error: 'Ressource nicht gefunden' 
    });
  }

  // Default error
  res.status(500).json({ 
    error: isProduction ? 'Interner Server-Fehler' : err.message 
  });
});

app.listen(3002, "0.0.0.0", () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});