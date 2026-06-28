import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./components/sideBar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader.jsx";
import MessageList from "./components/MessageList/MessageList.jsx";
import ChatInput from "./components/ChatInput/ChatInput.jsx";

/** Base URL for all API calls — change to match your backend. */
const API_BASE = "http://localhost:3888/api/chat";

function App() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  /** The list of chat_conversation records shown in the sidebar. */
  const [chatHistory, setChatHistory] = useState([]);

  /** The id of the currently active chat_conversations row. */
  const [activeConversationId, setActiveConversationId] = useState(null);

  /** Messages (user + assistant) for the active conversation. */
  const [messages, setMessages] = useState([]);

  /** True while waiting for the AI to respond. */
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  /** Loads the sidebar list of conversations (newest first). */
  const fetchChatHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/conversations`);
      setChatHistory(data.data ?? []);
    } catch (err) {
      console.error("[fetchChatHistory]", err.message);
    }
  }, []);

  /** Loads all messages for a given conversationId. */
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/conversations/${conversationId}/messages`
      );
      setMessages(data.data ?? []);
    } catch (err) {
      console.error("[fetchMessages]", err.message);
    }
  }, []);

  // Load sidebar history on mount.
  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * Creates a new conversation on the backend, clears the chat window,
   * and selects the new conversation.
   */
  const handleNewChat = useCallback(async () => {
    try {
      const { data } = await axios.post(`${API_BASE}/conversations/new`);
      const newConversation = data.data;

      // Add to the top of the sidebar list.
      setChatHistory((prev) => [newConversation, ...prev]);

      // Switch to the new conversation with an empty message list.
      setActiveConversationId(newConversation.id);
      setMessages([]);
    } catch (err) {
      console.error("[handleNewChat]", err.message);
    }
  }, []);

  /**
   * Switches to an existing conversation and loads its messages.
   *
   * @param {number} conversationId
   */
  const handleSelectConversation = useCallback(
    async (conversationId) => {
      if (conversationId === activeConversationId) return;
      setActiveConversationId(conversationId);
      setMessages([]);
      await fetchMessages(conversationId);
    },
    [activeConversationId, fetchMessages]
  );

  /**
   * Sends the user's question to the backend and appends both the user
   * message and the AI response to the current messages list.
   *
   * @param {string} question
   */
  const handleSendMessage = useCallback(
    async (question) => {
      if (!question.trim()) return;

      // If there is no active conversation, create one automatically.
      let convId = activeConversationId;
      if (!convId) {
        try {
          const { data } = await axios.post(`${API_BASE}/conversations/new`);
          const newConversation = data.data;
          convId = newConversation.id;
          setActiveConversationId(convId);
          setChatHistory((prev) => [newConversation, ...prev]);
        } catch (err) {
          console.error("[handleSendMessage] could not create conversation:", err.message);
          return;
        }
      }

      // Optimistically append the user's message for instant feedback.
      const optimisticUserMsg = {
        id: `optimistic-${Date.now()}`,
        role: "user",
        content: question.trim(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);
      setIsLoading(true);

      try {
        const { data } = await axios.post(`${API_BASE}/conversations`, {
          question: question.trim(),
          conversationId: convId,
        });

        const { userConversation, assistantConversation } = data.data;

        // Replace the optimistic message with the real persisted one,
        // and append the assistant's reply.
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticUserMsg.id),
          userConversation,
          assistantConversation,
        ]);

        // Refresh the sidebar so updated_at sorts correctly.
        fetchChatHistory();
      } catch (err) {
        console.error("[handleSendMessage]", err.message);
        // Remove the optimistic message on failure.
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticUserMsg.id)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, fetchChatHistory]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="app">
      <Sidebar
        chatHistory={chatHistory}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />
      <main className="chat">
        <ChatHeader />
        <MessageList messages={messages} isLoading={isLoading} />
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default App;
