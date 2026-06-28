import express from "express";
import chatRouter from "./chat/chat.routes.js";

const mainRouter = express.Router();
// /api/chat routes

mainRouter.use("/chat", chatRouter);
// /api/admin routes
// mainRouter.use("/admin", adminRouter);

export default mainRouter;
