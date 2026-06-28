// Checks whether the conversations table has the conversation_id column
// and adds it if missing. Safe to run multiple times (idempotent).
import "dotenv/config";
import db from "./db/db.config.js";

async function runAlter() {
  const conn = await db.getConnection();
  try {
    // -------------------------------------------------------------------------
    // 1. Ensure chat_conversations exists.
    // -------------------------------------------------------------------------
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅  chat_conversations table OK.");

    // -------------------------------------------------------------------------
    // 2. Check if conversations.conversation_id column exists.
    // -------------------------------------------------------------------------
    const [cols] = await conn.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'conversations'
        AND COLUMN_NAME  = 'conversation_id'
    `);

    if (cols.length === 0) {
      console.log("⚠️   conversation_id column missing — adding it...");

      // Add the column (nullable first so existing rows don't fail).
      await conn.execute(`
        ALTER TABLE conversations
          ADD COLUMN conversation_id BIGINT UNSIGNED NULL AFTER id
      `);
      console.log("    Added conversation_id column.");

      // Add the index.
      await conn.execute(`
        ALTER TABLE conversations
          ADD INDEX idx_conv_id (conversation_id)
      `);
      console.log("    Added index on conversation_id.");

      // Add the foreign key constraint (only if chat_conversations exists).
      await conn.execute(`
        ALTER TABLE conversations
          ADD CONSTRAINT fk_conv_chat
          FOREIGN KEY (conversation_id)
          REFERENCES chat_conversations(id)
          ON DELETE CASCADE
      `);
      console.log("    Added foreign key constraint.");
    } else {
      console.log("✅  conversation_id column already present.");
    }

    console.log("\n✅  Database schema is up to date.");
    process.exit(0);
  } catch (err) {
    console.error("❌  Alter failed:", err.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

runAlter();
