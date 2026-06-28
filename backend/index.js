import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db/db.config.js";
import mainRouter from "./srs/api/main.routes.js";
import { errorHandler } from "./srs/middlewares/errorHandler.js";

// Handle __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly look for the .env file in the same directory as this file (backend/)
dotenv.config({ path: path.resolve(__dirname, ".env") });

// server initialization
const app = express();

// Apply CORS to all routes
app.use(cors());

// middleware for json parsing
app.use(express.json());
// form data parsing
app.use(express.urlencoded({ extended: true }));

// main routes
app.use("/api", mainRouter);

// final middleware for handling errors
app.use(errorHandler);

async function startServer() {
  try {
    const connection = await db.getConnection();
    console.log("Database connected");
    connection.release();

    // Use Clever Cloud's dynamic PORT variable, fallback to 3888 locally
    const PORT = process.env.PORT || 3888;

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
  }
}

startServer();
