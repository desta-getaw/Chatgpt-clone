import express from "express";
import {
  newConversationController,
  createConversationController,
  getConversationsController,
  getConversationMessagesController,
} from "./controller/chat.controller.js";

const chatRouter = express.Router();

/**
 * POST /api/chat/conversations/new
 * Creates a new conversation record and returns its id.
 * Must be declared BEFORE the generic /:id routes to avoid ambiguity.
 */
chatRouter.post("/conversations/new", newConversationController);

/**
 * POST /api/chat/conversations
 * Sends a message inside an existing conversation.
 * Body: { question: string, conversationId: number }
 */
chatRouter.post("/conversations", createConversationController);

/**
 * GET /api/chat/conversations
 * Returns the list of all conversations for the sidebar.
 */
chatRouter.get("/conversations", getConversationsController);

/**
 * GET /api/chat/conversations/:id/messages
 * Returns all messages belonging to a specific conversation.
 */
chatRouter.get("/conversations/:id/messages", getConversationMessagesController);

export default chatRouter;
