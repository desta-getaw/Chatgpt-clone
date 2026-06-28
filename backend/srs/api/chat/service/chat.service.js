import db from "../../../../db/db.config.js";
import { GoogleGenAI } from "@google/genai";

// Use the correct model name; fall back to a known-good default.
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();

/** Singleton Gemini client initialised once at startup. */
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------------------------------------------------------------------------
// Chat-conversation (header) helpers
// ---------------------------------------------------------------------------

/**
 * Creates a new row in `chat_conversations` with an auto-generated title.
 * Returns the full conversation record { id, title, createdAt }.
 */
export async function createNewConversation(title = "New Chat") {
  const [result] = await db.execute(
    "INSERT INTO chat_conversations (title) VALUES (?)",
    [title]
  );

  const [rows] = await db.execute(
    "SELECT id, title, created_at FROM chat_conversations WHERE id = ?",
    [result.insertId]
  );

  return rows[0];
}

/**
 * Returns all chat_conversations ordered newest-first, for the sidebar.
 */
export async function getAllConversations() {
  const [rows] = await db.execute(
    `SELECT id, title, created_at, updated_at
       FROM chat_conversations
      ORDER BY updated_at DESC`
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------------

/**
 * Fetches all messages for a given conversation, oldest-first.
 *
 * @param {number} conversationId
 */
export async function getConversationMessages(conversationId) {
  const [rows] = await db.execute(
    `SELECT id, role, content, token_count, created_at
       FROM conversations
      WHERE conversation_id = ?
      ORDER BY id ASC`,
    [conversationId]
  );
  return rows;
}

/**
 * Returns the most recent `limit` messages for a conversation.
 * Used as context history when calling the AI.
 *
 * @param {number} conversationId
 * @param {number} limit
 */
async function getRecentMessages(conversationId, limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 10, 50));

  const [rows] = await db.execute(
    `SELECT id, role, content
       FROM conversations
      WHERE conversation_id = ?
      ORDER BY id DESC
      LIMIT ${safeLimit}`,
    [conversationId]
  );

  // Reverse so the array is chronological (oldest → newest).
  return rows.reverse();
}

/**
 * Fetches a single message row by its primary key.
 *
 * @param {number} messageId
 */
async function getMessageById(messageId) {
  const [rows] = await db.execute(
    `SELECT id, role, content, token_count, created_at
       FROM conversations
      WHERE id = ?
      LIMIT 1`,
    [messageId]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    role: row.role,
    content: row.content,
    tokenCount: Number(row.token_count || 0),
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// AI integration
// ---------------------------------------------------------------------------

/**
 * Calls the Gemini API with a conversation history and the new question.
 * Returns { text, totalTokens }.
 *
 * @param {{ historyRows: Array, question: string }} params
 */
async function generateAssistantAnswer({ historyRows, question }) {
  // Map DB rows to the format Gemini expects for multi-turn history.
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    config: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
    history: formattedHistory,
  });

  const result = await chat.sendMessage({ message: question });

  console.log(
    `[Gemini] model=${GEMINI_MODEL} tokens=${result.usageMetadata?.totalTokenCount}`
  );

  return {
    text: result.text,
    totalTokens: result.usageMetadata?.totalTokenCount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Main service — send a message inside an existing conversation
// ---------------------------------------------------------------------------

/**
 * Sends `question` inside `conversationId`, persists both the user message
 * and the AI reply, and returns both records.
 *
 * @param {{ question: string, conversationId: number }} params
 * @returns {{ userConversation: object, assistantConversation: object }}
 */
export async function createConversationService({ question, conversationId }) {
  // 1. Validate inputs.
  if (!question || !question.trim()) {
    const err = new Error("Question is required.");
    err.status = 400;
    throw err;
  }

  if (!conversationId) {
    const err = new Error("conversationId is required.");
    err.status = 400;
    throw err;
  }

  // 2. Verify the conversation exists.
  const [convRows] = await db.execute(
    "SELECT id FROM chat_conversations WHERE id = ? LIMIT 1",
    [conversationId]
  );
  if (!convRows[0]) {
    const err = new Error(`Conversation ${conversationId} not found.`);
    err.status = 404;
    throw err;
  }

  // 3. Fetch recent history for AI context (up to 10 prior messages).
  const historyRows = await getRecentMessages(conversationId, 10);

  // 4. Persist the user's message.
  const [userInsert] = await db.execute(
    "INSERT INTO conversations (conversation_id, role, content) VALUES (?, ?, ?)",
    [conversationId, "user", question.trim()]
  );

  // 5. Call the AI.
  const { text, totalTokens } = await generateAssistantAnswer({
    historyRows,
    question: question.trim(),
  });

  // 6. Persist the assistant's reply.
  const [assistantInsert] = await db.execute(
    "INSERT INTO conversations (conversation_id, role, content, token_count) VALUES (?, ?, ?, ?)",
    [conversationId, "assistant", text, totalTokens]
  );

  // 7. Touch the parent conversation's updated_at so it sorts to the top.
  await db.execute(
    "UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [conversationId]
  );

  // 8. Return the full persisted records.
  const userConversation = await getMessageById(userInsert.insertId);
  const assistantConversation = await getMessageById(assistantInsert.insertId);

  return { userConversation, assistantConversation };
}
