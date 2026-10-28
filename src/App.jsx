
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Settings from "./Settings.jsx";
import { applyAppTheme, readThemePreference } from "./theme.js";
import "./App.css";

const STORAGE_KEY = "puya-ai-chats-v1";
const AUTH_KEY = "puya-ai-auth-v1";
const SETTINGS_KEY = "puya-ai-settings-v1";
const LANGUAGE_OPTIONS = [
  "Auto detect",
  "English",
  "Manipuri (Meiteilon, Roman script)",
  "Meitei Mayek",
  "Hindi",
];
const REASONING_OPTIONS = ["low", "medium", "high"];
const MODEL_OPTIONS = [
  { id: "openai/gpt-oss-120b", name: "Puya Ultra" },
  { id: "qwen/qwen3.8-27b", name: "Puya Pro" },
];

function loadSettings() {
  const defaults = {
    language: "Auto detect",
    model: "openai/gpt-oss-120b",
    reasoning: "medium",
  };

  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const savedModel =
      saved.model === "qwen/qwen3.8-27b" ? "openai/gpt-oss-120b" : saved.model;
    return {
      language: LANGUAGE_OPTIONS.includes(saved.language) ? saved.language : defaults.language,
      model: MODEL_OPTIONS.some((option) => option.id === savedModel) ? savedModel : defaults.model,
      reasoning: REASONING_OPTIONS.includes(saved.reasoning) ? saved.reasoning : defaults.reasoning,
    };
  } catch {
    return defaults;
  }
}

function loadAssistantPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem("puya-ai-settings-page-v1") || "{}");
    const personalities = ["Default", "Friendly", "Professional", "Curious"];
    const responseLengths = ["Concise", "Balanced", "Detailed"];

    return {
      personality: personalities.includes(saved.personality) ? saved.personality : "Default",
      responseLength: responseLengths.includes(saved.responseLength) ? saved.responseLength : "Balanced",
      customInstructions: typeof saved.customInstructions === "string"
        ? saved.customInstructions.slice(0, 2000)
        : "",
    };
  } catch {
    return { personality: "Default", responseLength: "Balanced", customInstructions: "" };
  }
}

function getSessionToken() {
  const sessionToken = sessionStorage.getItem(AUTH_KEY);
  if (sessionToken) return sessionToken;

  const legacyToken = localStorage.getItem(AUTH_KEY);
  if (!legacyToken) return "";

  try {
    sessionStorage.setItem(AUTH_KEY, legacyToken);
    localStorage.removeItem(AUTH_KEY);
    return legacyToken;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return "";
  }
}

function loadChats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(saved)) return [];

    return saved
      .filter(
        (chat) =>
          typeof chat.id === "string" &&
          typeof chat.title === "string" &&
          Array.isArray(chat.messages)
      )
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch {
    return [];
  }
}

function createChat() {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [],
    updatedAt: Date.now(),
  };
}

function formatChatTitle(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 48) || "New conversation";
}

function normalizeChat(chat) {
  if (!chat || typeof chat.id !== "string") return null;

  return {
    id: chat.id,
    title: typeof chat.title === "string" && chat.title.trim() ? chat.title : "New conversation",
    messages: Array.isArray(chat.messages) ? chat.messages : [],
    updatedAt: Number(chat.updatedAt) || Date.now(),
    archivedAt: Number(chat.archivedAt) || null,
  };
}

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem(AUTH_KEY) || "";

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || "The request failed.");
  }

  return data;
}

export default function App() {
  const [chats, setChats] = useState(loadChats);
  const [activeId, setActiveId] = useState(() => loadChats().find((chat) => !chat.archivedAt)?.id ?? null);
  const [prompt, setPrompt] = useState("");
  const [settings, setSettings] = useState(loadSettings);
  const { language, model, reasoning } = settings;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [sessionToken, setSessionToken] = useState(getSessionToken);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const googleAuthProcessed = useRef(false);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeId) ?? null,
    [activeId, chats]
  );

  useEffect(() => {
    document.title = "Puya Ai";
  }, []);

  useEffect(() => {
    if (googleAuthProcessed.current) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("google_auth_code");
    const authErrorCode = url.searchParams.get("google_auth_error");
    if (!code && !authErrorCode) return;

    googleAuthProcessed.current = true;
    url.searchParams.delete("google_auth_code");
    url.searchParams.delete("google_auth_error");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );

    if (authErrorCode) {
      setAuthError("Google sign-in could not be completed. Please try again.");
      return;
    }

    apiRequest("/api/auth/google/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
      .then((result) => {
        sessionStorage.setItem(AUTH_KEY, result.token);
        setCurrentUser(result.user || null);
        setAuthError("");
        setSessionToken(result.token);
      })
      .catch((err) => {
        setAuthError(err.message || "Google sign-in failed. Please try again.");
      });
  }, []);

  useEffect(() => {
    let stopWatchingTheme = applyAppTheme(readThemePreference());

    function handleStorageChange(event) {
      if (event.key !== "puya-ai-settings-page-v1") return;
      stopWatchingTheme();
      stopWatchingTheme = applyAppTheme(readThemePreference());
    }

    window.addEventListener("storage", handleStorageChange);
    return () => {
      stopWatchingTheme();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!sessionToken) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      } catch {
        setError("Unable to save chats in this browser.");
      }
      setCurrentUser(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const me = await apiRequest("/api/auth/me");
        setCurrentUser(me.user || null);

        const data = await apiRequest("/api/chats");
        const normalized = (data.chats || []).map(normalizeChat).filter(Boolean);
        setChats(normalized.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        const firstActiveChat = normalized.find((chat) => !chat.archivedAt);
        setActiveId(firstActiveChat?.id ?? null);
      } catch (err) {
        setError(err.message || "Session expired. Please sign in again.");
        handleLogout();
      }
    };

    loadProfile();
  }, [sessionToken]);

  useEffect(() => {
    if (sessionToken) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {
      setError("Unable to save chat history in this browser.");
    }
  }, [chats, sessionToken]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      setError("Unable to save your settings in this browser.");
    }
  }, [settings]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setSettingsOpen(false);
        setEditingTitleId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function updateChat(id, updater) {
    setChats((current) =>
      sortChats(current.map((chat) => (chat.id === id ? updater(chat) : chat)))
    );
  }

  function sortChats(list) {
    return [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function persistLocalChats(nextChats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextChats));
    } catch {
      setError("Unable to save chat history in this browser.");
    }
  }

  async function persistChat(chat) {
    if (!sessionToken || !chat) return;

    try {
      await apiRequest(`/api/chats/${chat.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: chat.title,
          messages: chat.messages,
          updatedAt: chat.updatedAt,
          archivedAt: chat.archivedAt || null,
        }),
      });
    } catch {
      setError("Saved locally only. Reconnect to sync your chat history.");
    }
  }

  function handleLogout() {
    setSessionToken("");
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
    setAuthError("");
    const localChats = loadChats();
    setActiveId(localChats.find((chat) => !chat.archivedAt)?.id ?? null);
    setChats(localChats);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    const payload =
      authMode === "login"
        ? {
            email: authForm.email,
            password: authForm.password,
          }
        : {
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
          };

    if (!payload.email || !payload.password || (authMode === "signup" && !payload.username)) {
      setAuthError("Please complete the form before continuing.");
      return;
    }

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const result = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      sessionStorage.setItem(AUTH_KEY, result.token);
      setSessionToken(result.token);
      setCurrentUser(result.user || null);
      setAuthError("");
      setAuthForm({ username: "", email: "", password: "" });

      const backendChats = await apiRequest("/api/chats");
      const normalized = (backendChats.chats || []).map(normalizeChat).filter(Boolean);
      setChats(normalized.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      setActiveId(normalized.find((chat) => !chat.archivedAt)?.id ?? null);
    } catch (err) {
      setAuthError(err.message || "Authentication failed.");
    }
  }

  async function newChat() {
    if (loading) return;

    if (sessionToken) {
      try {
        const result = await apiRequest("/api/chats", {
          method: "POST",
          body: JSON.stringify({ title: "New conversation" }),
        });
        const chat = normalizeChat(result.chat);
        if (!chat) return;
        setChats((current) => sortChats([chat, ...current]));
        setActiveId(chat.id);
        setPrompt("");
        setError("");
        setSidebarOpen(false);
        return;
      } catch (err) {
        setError(err.message || "Unable to create a new chat.");
        return;
      }
    }

    const chat = createChat();
    setChats((current) => sortChats([chat, ...current]));
    setActiveId(chat.id);
    setPrompt("");
    setError("");
    setSidebarOpen(false);
    persistLocalChats([chat, ...loadChats()]);
  }

  async function deleteChat(id) {
    if (loading && id === activeId) return;

    if (sessionToken) {
      try {
        await apiRequest(`/api/chats/${id}`, { method: "DELETE" });
        const remaining = chats.filter((chat) => chat.id !== id);
        setChats(remaining);
        if (id === activeId) setActiveId(remaining.find((chat) => !chat.archivedAt)?.id ?? null);
        setError("");
        return;
      } catch (err) {
        setError(err.message || "Unable to delete this chat.");
        return;
      }
    }

    const remaining = chats.filter((chat) => chat.id !== id);
    setChats(remaining);
    if (id === activeId) setActiveId(remaining.find((chat) => !chat.archivedAt)?.id ?? null);
    persistLocalChats(remaining);
    setError("");
  }

  async function deleteAllChats() {
    if (!sessionToken) {
      setChats([]);
      setActiveId(null);
      persistLocalChats([]);
      return;
    }

    const deletedIds = [];
    for (const chat of chats) {
      try {
        await apiRequest(`/api/chats/${chat.id}`, { method: "DELETE" });
        deletedIds.push(chat.id);
      } catch (err) {
        const remaining = chats.filter((item) => !deletedIds.includes(item.id));
        setChats(remaining);
        if (deletedIds.includes(activeId)) {
          setActiveId(remaining.find((item) => !item.archivedAt)?.id ?? null);
        }
        setError(err.message || "Unable to delete all conversations.");
        return;
      }
    }

    setChats([]);
    setActiveId(null);
    setError("");
  }

  async function setChatArchived(id, archived) {
    const chat = chats.find((item) => item.id === id);
    if (!chat) return;

    const updated = { ...chat, archivedAt: archived ? Date.now() : null, updatedAt: Date.now() };
    updateChat(id, (current) => ({ ...current, archivedAt: updated.archivedAt, updatedAt: updated.updatedAt }));

    if (sessionToken) {
      try {
        await apiRequest(`/api/chats/${id}`, {
          method: "PUT",
          body: JSON.stringify(updated),
        });
      } catch (err) {
        updateChat(id, (current) => ({ ...current, archivedAt: chat.archivedAt || null }));
        setError(err.message || "Unable to update this conversation.");
        return;
      }
    }

    if (archived && activeId === id) {
      setActiveId(chats.find((item) => item.id !== id && !item.archivedAt)?.id ?? null);
    }
    setError("");
  }

  function renameChat(id, nextTitle) {
    const safeTitle = nextTitle.trim() || "New conversation";

    updateChat(id, (current) => ({
      ...current,
      title: safeTitle,
      updatedAt: Date.now(),
    }));

    if (sessionToken) {
      const updated = chats.find((chat) => chat.id === id);
      if (updated) {
        persistChat({ ...updated, title: safeTitle, updatedAt: Date.now() });
      }
    }
  }

  async function sendMessage(event, customMessages = null, customPrompt = null) {
    event?.preventDefault();

    const resolvedPrompt = (customPrompt ?? prompt).trim();
    if (!resolvedPrompt || loading) return;

    const chat = activeChat ?? createChat();

    if (!activeChat) {
      setChats((current) => sortChats([chat, ...current]));
      setActiveId(chat.id);
    }

    const history = customMessages ?? [
      ...chat.messages,
      { role: "user", content: resolvedPrompt, citations: [] },
    ];

    const assistantPlaceholder = {
      role: "assistant",
      content: "",
      citations: [],
    };

    updateChat(chat.id, (current) => ({
      ...current,
      title: current.messages.length === 0 ? formatChatTitle(resolvedPrompt) : current.title,
      messages: [...history, assistantPlaceholder],
      updatedAt: Date.now(),
    }));

    if (sessionToken) {
      try {
        await apiRequest(`/api/chats/${chat.id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: chat.title || formatChatTitle(resolvedPrompt),
            messages: [...history, assistantPlaceholder],
            updatedAt: Date.now(),
          }),
        });
      } catch {
        setError("Unable to sync the draft right now.");
      }
    }

    setPrompt("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          language,
          model,
          reasoning,
          personalization: loadAssistantPreferences(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "The request failed.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("The chat stream is not available in this browser.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantReply = "";
      let citations = [];

      function applyAssistantUpdate(nextReply, nextCitations = []) {
        updateChat(chat.id, (current) => {
          const messages = [...current.messages];
          const lastIndex = messages.length - 1;
          const lastMessage = messages[lastIndex];

          if (lastMessage?.role === "assistant") {
            messages[lastIndex] = {
              ...lastMessage,
              content: nextReply,
              citations: nextCitations,
            };
          }

          return {
            ...current,
            messages,
            updatedAt: Date.now(),
          };
        });
      }

      function processSseBlock(block) {
        const lines = block.split("\n");
        let eventName = "";
        let payload = "";

        for (const line of lines) {
          if (!line) continue;
          if (line.startsWith("event:")) {
            eventName = line.replace("event:", "").trim();
            continue;
          }
          if (line.startsWith("data:")) {
            payload = line.replace("data:", "").trim();
          }
        }

        if (!payload) return;

        const data = JSON.parse(payload);

        if (eventName === "chunk") {
          assistantReply += data.text || "";
          applyAssistantUpdate(assistantReply, citations);
          return;
        }

        if (eventName === "done") {
          assistantReply = data.reply || assistantReply;
          citations = Array.isArray(data.citations) ? data.citations : [];
          applyAssistantUpdate(assistantReply, citations);
          return;
        }

        if (eventName === "error") {
          throw new Error(data.error || "The AI service could not complete your request.");
        }
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;
          processSseBlock(part);
        }
      }

      if (buffer.trim()) {
        processSseBlock(buffer);
      }

      const finalChat = normalizeChat(
        chats.find((item) => item.id === chat.id) ||
          {
            id: chat.id,
            title: chat.title || formatChatTitle(resolvedPrompt),
            messages: [...history, { role: "assistant", content: assistantReply, citations }],
            updatedAt: Date.now(),
          }
      );

      if (finalChat) {
        persistChat(finalChat);
      }
    } catch (err) {
      setError(err.message || "Cannot connect to Puya Ai. Check your connection.");
      updateChat(chat.id, (current) => {
        const messages = [...current.messages];
        const lastIndex = messages.length - 1;
        const lastMessage = messages[lastIndex];

        if (lastMessage?.role === "assistant") {
          messages[lastIndex] = {
            ...lastMessage,
            content: lastMessage.content || "I couldn't complete that response. Please try again.",
          };
        }

        return {
          ...current,
          messages,
          updatedAt: Date.now(),
        };
      });
    } finally {
      setLoading(false);
    }
  }

  async function regenerateLastResponse() {
    if (!activeChat || loading) return;

    const messages = [...activeChat.messages];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.role === "assistant") {
      messages.pop();
    }

    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (!lastUser) return;

    const baseMessages = messages.slice(0, messages.length - 1);
    const userPrompt = lastUser.content || "Please continue.";

    setPrompt(userPrompt);
    await sendMessage(null, baseMessages.length ? [...baseMessages, lastUser] : [lastUser], userPrompt);
  }

  function renderMessage(message, index) {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";

    return (
      <article className={`message ${message.role}`} key={`${activeChat?.id ?? "chat"}-${index}`}>
        {isUser ? (
          <div className="message-avatar">Y</div>
        ) : (
          <img className="message-avatar assistant-avatar" src="/puya-logo.png" alt="Puya Ai" />
        )}

        <div className="message-body">
          <div className="message-author">{isUser ? "You" : "Puya Ai"}</div>

          <div className="message-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {isAssistant && !loading && (
            <div className="message-actions">
              <button type="button" className="inline-action" onClick={regenerateLastResponse}>
                Regenerate
              </button>
            </div>
          )}

          {message.citations?.length > 0 && (
            <div className="sources">
              <div className="sources-title">Sources · {message.citations.length}</div>

              {message.citations.map((source) => (
                <a
                  key={source.url}
                  className="source-link glass"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{source.title}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }

  if (!sessionToken) {
    return (
      <main className="auth-screen">
        <div className="auth-panel glass">
          <div className="brand auth-brand">
            <img className="brand-mark" src="/puya-logo.png" alt="" />
            <span>
              Puya <span className="brand-light">Ai</span>
            </span>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              className={authMode === "signup" ? "active" : ""}
              onClick={() => setAuthMode("signup")}
            >
              Sign up
            </button>
          </div>

          <button
            type="button"
            className="google-signin-button"
            onClick={() => window.location.assign("/api/auth/google")}
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.64 5.93c4.46-4.12 7.14-10.2 7.14-17.58Z" />
              <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.28-3.13.78-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.87l-7.64-5.93c-2.12 1.42-4.84 2.27-8.26 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or continue with email</span></div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === "signup" && (
              <label>
                <span>Username</span>
                <input
                  value={authForm.username}
                  onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Your name"
                />
              </label>
            )}

            <label>
              <span>Email</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Minimum 6 characters"
              />
            </label>

            {authError && <div className="error-message">{authError}</div>}

            <button className="primary-button" type="submit">
              {authMode === "login" ? "Continue" : "Create account"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (settingsOpen) {
    return (
      <Settings
        user={currentUser}
        preferences={settings}
        onPreferencesChange={setSettings}
        chats={chats}
        onBack={() => setSettingsOpen(false)}
        onLogout={handleLogout}
        onArchiveChat={(id) => setChatArchived(id, true)}
        onRestoreChat={(id) => setChatArchived(id, false)}
        onDeleteChat={(id) => id === "all" ? deleteAllChats() : deleteChat(id)}
      />
    );
  }

  return (
    <main className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar glass ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <img className="brand-mark" src="/puya-logo.png" alt="" />
          <span>
            Puya <span className="brand-light">Ai</span>
          </span>
        </div>

        <button className="new-chat glass-button" onClick={newChat}>
          <span>＋</span> New chat
        </button>

        <div className="history-heading">YOUR HISTORY</div>

        <div className="history-list">
          {chats.filter((chat) => !chat.archivedAt).map((chat) => (
            <div
              className={`history-row ${chat.id === activeId ? "selected" : ""}`}
              key={chat.id}
            >
              {editingTitleId === chat.id ? (
                <div className="history-edit">
                  <input
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onBlur={() => {
                      renameChat(chat.id, titleDraft);
                      setEditingTitleId(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        renameChat(chat.id, titleDraft);
                        setEditingTitleId(null);
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  className="history-item"
                  onClick={() => {
                    if (loading) return;
                    setActiveId(chat.id);
                    setError("");
                    setSidebarOpen(false);
                  }}
                >
                  <span className="history-icon">◷</span>
                  <span>{chat.title}</span>
                </button>
              )}

              <div className="history-actions">
                <button
                  className="edit-chat"
                  aria-label={`Rename ${chat.title}`}
                  onClick={() => {
                    setEditingTitleId(chat.id);
                    setTitleDraft(chat.title);
                  }}
                >
                  ✎
                </button>
                <button
                  className="delete-chat"
                  aria-label={`Delete ${chat.title}`}
                  disabled={loading && chat.id === activeId}
                  onClick={() => deleteChat(chat.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {chats.every((chat) => chat.archivedAt) && <p className="muted small">Your conversations will appear here.</p>}
        </div>

        <div className="sidebar-bottom">
          <button
            className="settings-button"
            onClick={() => setSettingsOpen(true)}
            type="button"
            aria-haspopup="dialog"
          >
            <span aria-hidden="true">⚙</span>
            Settings
          </button>
          <button
            className="sidebar-logout-button"
            onClick={handleLogout}
            type="button"
          >
            <span aria-hidden="true">↪</span>
            Log out
          </button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar glass">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>

          <div className="top-title">
            <img className="top-title-logo" src="/puya-logo.png" alt="" />
            <div className="top-title-copy">
              <span className="top-title-main">Puya Ai</span>
              <span className="top-subtitle">Your multilingual AI companion</span>
            </div>
          </div>

          <button className="icon-button" onClick={newChat} title="New chat" aria-label="New chat">
            ＋
          </button>
        </header>

        <div className="conversation" aria-live="polite">
          {!activeChat?.messages.length ? (
            <section className="welcome">
              <img className="welcome-orb" src="/puya-logo.png" alt="Puya Ai logo" />
              <p className="eyebrow">MEET YOUR NEW AI COMPANION</p>

              <h1>
                Intelligence, <span>without borders.</span>
              </h1>

              <p className="welcome-copy">
                Explore ideas, discover knowledge, and chat in Manipuri or your preferred language.
              </p>

              <div className="suggestions">
                {[
                  "Explain AI in simple words",
                  "Help me learn JavaScript",
                  "Tell me about Manipur",
                  "Help me write in Manipuri",
                ].map((item) => (
                  <button className="suggestion glass" key={item} onClick={() => setPrompt(item)}>
                    <span>{item}</span>
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="messages">
              {activeChat.messages.map(renderMessage)}

              {loading && (
                <div className="thinking">
                  <span className="pulse" />
                  Searching the web and preparing a response…
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>

        <footer className="composer-area">
          <form className="composer glass" onSubmit={sendMessage}>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message Puya Ai"
              rows={1}
              maxLength={12000}
              disabled={loading}
              aria-label="Message Puya Ai"
            />

            <div className="composer-tools">
              <div className="composer-options">
                <label className="composer-option">
                  <span className="composer-option-label">Model</span>
                  <select
                    value={model}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, model: event.target.value }))
                    }
                    disabled={loading}
                    aria-label="AI model"
                  >
                    {MODEL_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="composer-option">
                  <span className="composer-option-label">Response</span>
                  <select
                    value={reasoning}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, reasoning: event.target.value }))
                    }
                    disabled={loading}
                    aria-label="Response style"
                  >
                    <option value="low">Fast</option>
                    <option value="medium">Balanced</option>
                    <option value="high">Detailed</option>
                  </select>
                </label>
              </div>

              <button
                className="send-button"
                type="submit"
                disabled={loading || !prompt.trim()}
                aria-label="Send message"
              >
                {loading ? "…" : "↑"}
              </button>
            </div>
          </form>

          <p className="disclaimer">
            <span>Puya Ai can make mistakes. Verify important information.</span>
            <span className="composer-shortcut-hint">Enter to send · Shift + Enter for a new line</span>
          </p>
        </footer>
      </section>
    </main>
  );
}
