import { useState, useRef, useEffect } from "react";
import { Plus, ArrowUp, Mic } from "lucide-react";
import styles from "./ChatInput.module.css";

/**
 * ChatInput — the bottom message-composition bar.
 *
 * Props:
 *  - onSend(question: string) — called when the user submits a non-empty message.
 *  - isLoading: boolean       — disables the input while the AI is responding.
 */
function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  // Keep focus in the input after the AI replies.
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  /** Handles both button-click and Enter key submission. */
  const handleSubmit = (e) => {
    e.preventDefault(); // prevent full-page reload
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setInput(""); // clear the field immediately
  };

  /** Allow Shift+Enter for newlines; plain Enter submits. */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const hasInput = input.trim().length > 0;

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Attachment / plus icon */}
        <div className={styles.icon} aria-hidden="true">
          <Plus size={20} />
        </div>

        {/* Message textarea */}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={isLoading ? "Waiting for response…" : "Ask anything"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Message input"
          autoComplete="off"
        />

        {/* Submit / mic button */}
        <button
          type="submit"
          className={`${styles.submitBtn} ${hasInput && !isLoading ? styles.active : ""}`}
          disabled={isLoading || !hasInput}
          aria-label={hasInput ? "Send message" : "Voice input"}
        >
          {hasInput ? <ArrowUp size={18} /> : <Mic size={18} />}
        </button>
      </form>
    </div>
  );
}

export default ChatInput;
