import { useEffect, useRef } from "react";
import styles from "./MessageList.module.css";
import ChatMessage from "../ChatMessage/ChatMessage.jsx";

/**
 * MessageList — scrollable conversation viewport.
 *
 * Props:
 *  - messages: Array<{ id, role, content }> — messages to render.
 *  - isLoading: boolean                     — show animated loading dots while awaiting AI.
 */
function MessageList({ messages = [], isLoading }) {
  const bottomRef = useRef(null);

  // Automatically scroll to the latest message whenever messages or
  // the loading state changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className={styles.messages}>
      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <div className={styles.empty}>What are you working on?</div>
      )}

      {/* Render each message */}
      {messages.map((msg) => (
        <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
      ))}

      {/* Loading indicator — animated dots while the AI is thinking */}
      {isLoading && (
        <div className={styles.loadingContainer} aria-label="AI is responding">
          <div className={styles.loadingAvatar} aria-hidden="true" />
          <div className={styles.loadingDots}>
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
          </div>
        </div>
      )}

      {/* Invisible anchor — scrolled into view to keep the bottom visible */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
