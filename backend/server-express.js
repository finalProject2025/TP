require("dotenv").config();
const express = require("express");
const cors = require("cors");


const app = express();
const NODE_ENV = process.env.NODE_ENV;
const PORT = process.env.PORT;

// CORS-Konfiguration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.178.167:3000",
      "http://46.5.119.140:3000",
    ];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    // database: global.dbConnected ? "Connected" : "Disconnected", // Optional: DB-Status
  });
});

// Modularisierte User-API
const usersRouter = require("./routes/users");
const postsRouter = require("./routes/posts");
const messagesRouter = require("./routes/messages");
const ratingsRouter = require("./routes/ratings");
const helpOffersRouter = require("./routes/helpOffers");
app.use("/api/auth", usersRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api", messagesRouter);
app.use("/api/ratings", ratingsRouter);
app.use("/api/help-offers", helpOffersRouter);

// TODO: Weitere Routen (posts, messages, ratings) analog einbinden

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
