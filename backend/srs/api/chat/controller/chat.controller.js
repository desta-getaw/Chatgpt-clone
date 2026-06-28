import {
  createNewConversation,
  getAllConversations,
  getConversationMessages,
  createConversationService,
} from "../service/chat.service.js";

// ---------------------------------------------------------------------------
// POST /api/chat/conversations/new
// Creates a brand-new chat_conversations record and returns its id.
// ---------------------------------------------------------------------------
export async function newConversationController(req, res, next) {
  try {
    const { title } = req.body || {}; // optional custom title
    const conversation = await createNewConversation(title || "New Chat");

    res.status(201).json({
      success: true,
      message: "New conversation created.",
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat/conversations
// Sends a message in an existing conversation and returns the AI reply.
// Body: { question: string, conversationId: number }
// ---------------------------------------------------------------------------
export async function createConversationController(req, res, next) {
  try {
    const { question, conversationId } = req.body || {};

    const result = await createConversationService({ question, conversationId });

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/chat/conversations
// Returns all chat_conversations (sidebar list), newest first.
// ---------------------------------------------------------------------------
export async function getConversationsController(req, res, next) {
  try {
    const conversations = await getAllConversations();

    res.status(200).json({
      success: true,
      message: "Conversations fetched successfully.",
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/chat/conversations/:id/messages
// Returns all messages for a specific conversation, oldest-first.
// ---------------------------------------------------------------------------
export async function getConversationMessagesController(req, res, next) {
  try {
    const conversationId = Number(req.params.id);

    if (!conversationId || Number.isNaN(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    const messages = await getConversationMessages(conversationId);

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}
