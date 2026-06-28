import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db/db.config.js";
import mainRouter from "./srs/api/main.routes.js";
import { errorHandler } from "./srs/middlewares/errorHandler.js";

// server initialization
const app = express();
// Apply CORS to all routes
app.use(cors());

//middleware for json parsing
app.use(express.json());
//form data parsing
app.use(express.urlencoded({ extended: true }));
//main routes
app.use("/api", mainRouter);

//final middleware for handling errors

app.use(errorHandler);

async function startServer() {
  try {
    const connection = await db.getConnection();

    console.log("Database connected");

    connection.release();

    app.listen(3888, (err) => {
      if (err) {
        throw err;
      }

      console.log("Server is running on port http://localhost:3888");
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
  }
}

startServer();
