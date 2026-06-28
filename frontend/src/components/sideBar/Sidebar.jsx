import styles from "./Sidebar.module.css";
import {
  Search,
  Image as ImageIcon,
  LayoutGrid,
  Microscope,
  Code2,
  FolderKanban,
  PanelLeftClose,
  Plus,
  MessageSquare,
} from "lucide-react";

/**
 * Sidebar — left-hand navigation panel.
 *
 * Props:
 *  - chatHistory: Array<{ id, title, updated_at }> — list of past conversations.
 *  - activeConversationId: number | null            — currently selected conversation.
 *  - onNewChat: () => void                          — called when "New chat" is clicked.
 *  - onSelectConversation: (id: number) => void     — called when a history item is clicked.
 */
function Sidebar({
  chatHistory = [],
  activeConversationId,
  onNewChat,
  onSelectConversation,
}) {
  return (
    <aside className={styles.sidebar}>
      {/* ------------------------------------------------------------------ */}
      {/* Header — New Chat + collapse button                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.header}>
        <button
          className={styles.newChatBtn}
          aria-label="New chat"
          onClick={onNewChat}
        >
          <Plus size={18} />
          <span>New chat</span>
        </button>
        <button className={styles.iconBtn} aria-label="Collapse sidebar">
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Quick-access nav links                                              */}
      {/* ------------------------------------------------------------------ */}
      <nav className={styles.nav}>
        <a href="#" className={styles.item}>
          <Search size={14} />
          <span>Search chats</span>
        </a>
        <a href="#" className={styles.item}>
          <ImageIcon size={14} />
          <span>Images</span>
        </a>
        <a href="#" className={styles.item}>
          <LayoutGrid size={14} />
          <span>Apps</span>
        </a>
        <a href="#" className={styles.item}>
          <Microscope size={14} />
          <span>Deep research</span>
        </a>
        <a href="#" className={styles.item}>
          <Code2 size={14} />
          <span>Codex</span>
        </a>
        <a href="#" className={styles.item}>
          <FolderKanban size={14} />
          <span>Projects</span>
        </a>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Chat history list                                                   */}
      {/* ------------------------------------------------------------------ */}
      {chatHistory.length > 0 && (
        <section className={styles.historySection}>
          <p className={styles.historyLabel}>Recent</p>
          <ul className={styles.historyList}>
            {chatHistory.map((conv) => (
              <li key={conv.id}>
                <button
                  className={`${styles.historyItem} ${
                    conv.id === activeConversationId ? styles.activeItem : ""
                  }`}
                  onClick={() => onSelectConversation(conv.id)}
                  title={conv.title}
                >
                  <MessageSquare size={13} className={styles.historyIcon} />
                  <span className={styles.historyTitle}>{conv.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

export default Sidebar;
