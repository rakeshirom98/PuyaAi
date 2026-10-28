import { useEffect, useMemo, useState } from "react";
import { applyAppTheme } from "./theme.js";
import "./Settings.css";

const STORAGE_KEY = "puya-ai-settings-page-v1";

function icon(children) {
  return function Icon({ size = 18, ...props }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
  };
}

const ArrowLeft = icon(<><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>);
const Bell = icon(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>);
const ChevronDown = icon(<path d="m6 9 6 6 6-6" />);
const CircleHelp = icon(<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>);
const CreditCard = icon(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>);
const Database = icon(<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" /><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" /></>);
const Eye = icon(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
const FileText = icon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>);
const Fingerprint = icon(<><path d="M12 11a2 2 0 0 0-2 2c0 2.4-.2 4.7-1 7" /><path d="M14 13c0 3-.2 5.1-.7 7" /><path d="M6.5 17A24 24 0 0 0 7 13a5 5 0 0 1 10 0c0 1.2-.1 2.7-.3 4" /><path d="M4 13a8 8 0 0 1 16 0c0 .4 0 .8-.1 1.2" /><path d="M12 3a10 10 0 0 0-10 10" /><path d="M12 7a6 6 0 0 1 6 6" /></>);
const Keyboard = icon(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M7 16h10" /></>);
const Link2 = icon(<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7" /></>);
const LockKeyhole = icon(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><circle cx="12" cy="16" r="1" /><path d="M12 17v2" /></>);
const Menu = icon(<><path d="M4 6h16M4 12h16M4 18h16" /></>);
const Palette = icon(<><path d="M12 22a10 10 0 1 1 10-10c0 2-1 3-3 3h-2a2 2 0 0 0-2 2c0 1.7-1.3 3-3 3Z" /><path d="M7.5 10h.01M10 6.5h.01M14 6.5h.01M16.5 10h.01" /></>);
const PawPrint = icon(<><circle cx="7" cy="8" r="2" /><circle cx="12" cy="5" r="2" /><circle cx="17" cy="8" r="2" /><path d="M7 15c0-2 2-4 5-4s5 2 5 4-2 4-5 4-5-2-5-4Z" /></>);
const Search = icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>);
const Settings2 = icon(<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" /></>);
const Shield = icon(<><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>);
const SlidersHorizontal = icon(<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" /></>);
const Sparkles = icon(<><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>);
const UserRound = icon(<><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>);
const UsersRound = icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>);
const Volume2 = icon(<><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>);
const X = icon(<><path d="m18 6-12 12M6 6l12 12" /></>);

const sections = [
  {
    title: "Personal",
    items: [
      { name: "General", icon: Settings2 },
      { name: "Appearance", icon: Palette },
      { name: "Notifications", icon: Bell },
      { name: "Profile", icon: UserRound },
      { name: "Security and login", icon: LockKeyhole },
      { name: "Account", icon: Fingerprint },
      { name: "Archived chats", icon: FileText },
      { name: "Parental controls", icon: UsersRound },
      { name: "Trusted contact", icon: Shield },
      { name: "Voice", icon: Volume2 },
      { name: "Storage", icon: Database },
      { name: "Personalization", icon: SlidersHorizontal },
      { name: "Pets", icon: PawPrint },
      { name: "Keyboard", icon: Keyboard },
      { name: "Usage", icon: Eye },
      { name: "Billing", icon: CreditCard },
      { name: "Data controls", icon: Shield },
    ],
  },
  { title: "Integrations", items: [{ name: "Integrations", icon: Link2 }] },
];

const initialPreferences = {
  theme: "Dark",
  accent: "White",
  compactMode: false,
  animations: true,
  emailNotifications: true,
  pushNotifications: false,
  productUpdates: true,
  speechRate: "Normal",
  voice: "Cove",
  customInstructions: "",
  personality: "Default",
  responseLength: "Balanced",
  displayName: "",
};

function readPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...initialPreferences,
      theme: ["System", "Light", "Dark"].includes(stored.theme) ? stored.theme : initialPreferences.theme,
      accent: ["White", "Blue", "Green", "Violet"].includes(stored.accent) ? stored.accent : initialPreferences.accent,
      compactMode: typeof stored.compactMode === "boolean" ? stored.compactMode : initialPreferences.compactMode,
      animations: typeof stored.animations === "boolean" ? stored.animations : initialPreferences.animations,
      emailNotifications: typeof stored.emailNotifications === "boolean" ? stored.emailNotifications : initialPreferences.emailNotifications,
      pushNotifications: typeof stored.pushNotifications === "boolean" ? stored.pushNotifications : initialPreferences.pushNotifications,
      productUpdates: typeof stored.productUpdates === "boolean" ? stored.productUpdates : initialPreferences.productUpdates,
      speechRate: ["Slow", "Normal", "Fast"].includes(stored.speechRate) ? stored.speechRate : initialPreferences.speechRate,
      voice: ["Cove", "Juniper", "Ember", "Vale"].includes(stored.voice) ? stored.voice : initialPreferences.voice,
      customInstructions: typeof stored.customInstructions === "string" ? stored.customInstructions.slice(0, 2000) : "",
      personality: ["Default", "Friendly", "Professional", "Curious"].includes(stored.personality) ? stored.personality : initialPreferences.personality,
      responseLength: ["Concise", "Balanced", "Detailed"].includes(stored.responseLength) ? stored.responseLength : initialPreferences.responseLength,
      displayName: typeof stored.displayName === "string" ? stored.displayName.slice(0, 60) : "",
    };
  } catch {
    return { ...initialPreferences };
  }
}

function SettingRow({ title, description, children, className = "" }) {
  return (
    <div className={`setting-row ${className}`}>
      <div className="setting-row-copy">
        <div className="setting-row-title">{title}</div>
        {description && <p>{description}</p>}
      </div>
      <div className="setting-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function Select({ value, options, onChange, label }) {
  return (
    <label className="settings-select-wrap">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}

function Notice({ children, tone = "neutral" }) {
  return <div className={`settings-notice ${tone}`} role="status">{children}</div>;
}

export default function Settings({
  user,
  preferences,
  onPreferencesChange,
  chats = [],
  error = "",
  onBack,
  onLogout,
  onArchiveChat,
  onRestoreChat,
  onDeleteChat,
}) {
  const [activePage, setActivePage] = useState("General");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pagePreferences, setPagePreferences] = useState(readPreferences);
  const [notice, setNotice] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(pagePreferences.displayName);

  const matchedSections = useMemo(() => sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase())),
    }))
    .filter((section) => section.items.length), [search]);

  function updatePreference(key, value) {
    const next = { ...pagePreferences, [key]: value };
    setPagePreferences(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setNotice("");
    } catch {
      setNotice("Your preference could not be saved in this browser.");
    }
  }

  function updateChatPreference(key, value) {
    onPreferencesChange((current) => ({ ...current, [key]: value }));
  }

  function choosePage(name) {
    setActivePage(name);
    setDrawerOpen(false);
    setNotice("");
  }

  function unavailable(feature) {
    setNotice(`${feature} needs account-service support that is not configured in this app yet.`);
  }

  function confirmAndRun(message, callback) {
    if (window.confirm(message)) callback();
  }

  const activeChats = chats.filter((chat) => !chat.archivedAt);
  const archivedChats = chats.filter((chat) => chat.archivedAt);
  const storageUsed = chats.reduce((total, chat) => (
    total + new Blob([JSON.stringify(chat.messages || [])]).size
  ), 0);
  const storageLabel = storageUsed >= 1024 * 1024
    ? `${(storageUsed / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(storageUsed / 1024))} KB`;
  const displayName = pagePreferences.displayName || user?.username || "Your profile";
  const accentColors = { White: "#e5e5e5", Blue: "#8caef5", Green: "#8ec5a0", Violet: "#b29beb" };

  useEffect(() => applyAppTheme(pagePreferences.theme), [pagePreferences.theme]);

  function renderPage() {
    switch (activePage) {
      case "General":
        return <>
          <SettingRow title="Language" description="Choose the language Puya Ai uses for its interface and responses.">
            <Select value={preferences.language} options={["Auto detect", "English", "Manipuri (Meiteilon, Roman script)", "Meitei Mayek", "Hindi"]} onChange={(value) => updateChatPreference("language", value)} label="Language" />
          </SettingRow>
          <SettingRow title="Default model" description="Choose which model starts new conversations.">
            <Select value={preferences.model} options={[{ value: "openai/gpt-oss-120b", label: "Puya Ultra" }, { value: "qwen/qwen3.8-27b", label: "Puya Pro" }]} onChange={(value) => updateChatPreference("model", value)} label="Default model" />
          </SettingRow>
          <SettingRow title="Response style" description="Set how much detail you prefer in answers.">
            <Select value={preferences.reasoning} options={["low", "medium", "high"]} onChange={(value) => updateChatPreference("reasoning", value)} label="Response style" />
          </SettingRow>
        </>;
      case "Appearance":
        return <>
          <SettingRow title="Theme" description="Choose how Puya Ai looks on this device.">
            <Select value={pagePreferences.theme} options={["System", "Light", "Dark"]} onChange={(value) => updatePreference("theme", value)} label="Theme" />
          </SettingRow>
          <SettingRow title="Accent color" description="Choose a subtle highlight color for selected controls.">
            <div className="accent-options" role="group" aria-label="Accent color">
              {["White", "Blue", "Green", "Violet"].map((color) => (
                <button key={color} type="button" className={`accent-dot accent-${color.toLowerCase()} ${pagePreferences.accent === color ? "selected" : ""}`} onClick={() => updatePreference("accent", color)} aria-label={`${color} accent`} aria-pressed={pagePreferences.accent === color} />
              ))}
            </div>
          </SettingRow>
          <SettingRow title="Compact mode" description="Reduce spacing between messages and controls.">
            <Toggle checked={pagePreferences.compactMode} onChange={(value) => updatePreference("compactMode", value)} label="Compact mode" />
          </SettingRow>
          <SettingRow title="Motion" description="Use subtle transitions throughout the interface.">
            <Toggle checked={pagePreferences.animations} onChange={(value) => updatePreference("animations", value)} label="Interface animations" />
          </SettingRow>
        </>;
      case "Notifications":
        return <>
          <SettingRow title="Email notifications" description="Save your email-notification preference on this device. Delivery is not configured."><Toggle checked={pagePreferences.emailNotifications} onChange={(value) => updatePreference("emailNotifications", value)} label="Email notifications" /></SettingRow>
          <SettingRow title="Push notifications" description="Save a preference for this device. Browser push delivery is not configured."><Toggle checked={pagePreferences.pushNotifications} onChange={(value) => updatePreference("pushNotifications", value)} label="Push notifications" /></SettingRow>
          <SettingRow title="Product updates" description="Save your product-update preference on this device."><Toggle checked={pagePreferences.productUpdates} onChange={(value) => updatePreference("productUpdates", value)} label="Product updates" /></SettingRow>
        </>;
      case "Profile":
        return <>
          <div className="settings-profile">
            <div className="settings-avatar">{displayName.trim().charAt(0).toUpperCase()}</div>
            <div><strong>{displayName}</strong><span>{user?.email || "Signed in to Puya Ai"}</span></div>
            {!editingProfile && <button className="subtle-button" type="button" onClick={() => { setProfileDraft(pagePreferences.displayName || user?.username || ""); setEditingProfile(true); }}>Edit</button>}
          </div>
          {editingProfile && <form className="profile-edit-form" onSubmit={(event) => { event.preventDefault(); updatePreference("displayName", profileDraft.trim()); setEditingProfile(false); }}>
            <label htmlFor="display-name">Display name</label>
            <input id="display-name" value={profileDraft} onChange={(event) => setProfileDraft(event.target.value)} maxLength={60} />
            <div className="form-actions"><button type="button" className="subtle-button" onClick={() => setEditingProfile(false)}>Cancel</button><button type="submit" className="solid-button">Save</button></div>
            <small>This display name is saved on this device only.</small>
          </form>}
          <SettingRow title="Username" description="Your account username."><span className="static-value">{user?.username || "Not set"}</span></SettingRow>
          <SettingRow title="Email" description="Used for account access and important notices."><span className="static-value">{user?.email || "Not available"}</span></SettingRow>
        </>;
      case "Security and login":
        return <>
          <Notice>Security controls are not connected to an account-management service yet.</Notice>
          {["Change password", "Two-factor authentication", "Active sessions"].map((item) => <SettingRow key={item} title={item} description={item === "Active sessions" ? "Review devices currently signed in to your account." : "Manage this setting through your account provider."}><button type="button" className="subtle-button" onClick={() => unavailable(item)}>Manage</button></SettingRow>)}
        </>;
      case "Account":
        return <>
          <SettingRow title="Account" description="Your Puya Ai account information."><span className="static-value">{user?.email || "Signed in"}</span></SettingRow>
          <SettingRow title="Plan" description="Plan and subscription information."><span className="static-value">Free</span></SettingRow>
          <Notice>Account changes and subscription management are not available in this app yet.</Notice>
          <button type="button" className="danger-outline" onClick={() => confirmAndRun("Log out of Puya Ai on this device?", onLogout)}>Log out</button>
        </>;
      case "Archived chats":
        return <>
          <p className="page-intro">Keep conversations out of your history without deleting them.</p>
          {archivedChats.length > 0 ? archivedChats.map((chat) => <div className="archive-row" key={chat.id}><div><strong>{chat.title}</strong><span>{chat.messages?.length || 0} messages</span></div><button type="button" className="subtle-button" onClick={() => onRestoreChat(chat.id)}>Restore</button><button type="button" className="text-danger" onClick={() => confirmAndRun(`Permanently delete “${chat.title}”? This cannot be undone.`, () => onDeleteChat(chat.id))}>Delete</button></div>) : <div className="empty-state"><FileText size={22} /><strong>No archived chats</strong><span>Archive a conversation below to find it here.</span></div>}
          {activeChats.length > 0 && <div className="archive-available"><h3>Recent conversations</h3>{activeChats.map((chat) => <div className="archive-row" key={chat.id}><div><strong>{chat.title}</strong><span>{chat.messages?.length || 0} messages</span></div><button type="button" className="subtle-button" onClick={() => onArchiveChat(chat.id)}>Archive</button></div>)}</div>}
        </>;
      case "Parental controls":
        return <><Notice>Parental controls are not supported by this application yet.</Notice><SettingRow title="Supervision" description="Set up supervision and age-appropriate experiences."><button type="button" className="subtle-button" onClick={() => unavailable("Parental controls")}>Learn more</button></SettingRow></>;
      case "Trusted contact":
        return <><p className="page-intro">A trusted contact can help you with important account matters.</p><div className="empty-state"><UsersRound size={22} /><strong>No trusted contact added</strong><span>Trusted-contact management is not connected yet.</span></div></>;
      case "Voice":
        return <>
          <SettingRow title="Voice" description="Save your preferred voice. Voice output is not available yet."><Select value={pagePreferences.voice} options={["Cove", "Juniper", "Ember", "Vale"]} onChange={(value) => updatePreference("voice", value)} label="Voice" /></SettingRow>
          <SettingRow title="Speech rate" description="Save your preferred speech rate for future voice features."><Select value={pagePreferences.speechRate} options={["Slow", "Normal", "Fast"]} onChange={(value) => updatePreference("speechRate", value)} label="Speech rate" /></SettingRow>
          <SettingRow title="Voice conversations" description="Voice conversation features are not available yet."><button type="button" className="subtle-button" onClick={() => unavailable("Voice conversations")}>Learn more</button></SettingRow>
        </>;
      case "Storage":
        return <>
          <div className="storage-card"><div><strong>{storageLabel}</strong><span>Estimated conversation storage in this account</span></div><Database size={20} /></div>
          <div className="storage-track"><span style={{ width: `${Math.min(100, Math.max(2, storageUsed / (10 * 1024 * 1024) * 100))}%` }} /></div>
          <p className="storage-caption">Storage limits are not configured. Your usage is estimated from saved conversations.</p>
          <button type="button" className="danger-outline" onClick={() => confirmAndRun("Delete all conversations? This cannot be undone.", () => onDeleteChat("all"))}>Delete all conversations</button>
        </>;
      case "Personalization":
        return <>
          <SettingRow title="Memory" description="Cross-conversation memory is not implemented in this app."><span className="static-value">Unavailable</span></SettingRow>
          <SettingRow title="Personality" description="Apply a conversational style to Puya Ai responses."><Select value={pagePreferences.personality} options={["Default", "Friendly", "Professional", "Curious"]} onChange={(value) => updatePreference("personality", value)} label="Personality" /></SettingRow>
          <SettingRow title="Response length" description="Set your preferred response length."><Select value={pagePreferences.responseLength} options={["Concise", "Balanced", "Detailed"]} onChange={(value) => updatePreference("responseLength", value)} label="Response length" /></SettingRow>
          <label className="instruction-field">Custom instructions<textarea value={pagePreferences.customInstructions} onChange={(event) => updatePreference("customInstructions", event.target.value)} placeholder="Share preferences for how Puya Ai should respond." maxLength={2000} rows={5} /><small>{pagePreferences.customInstructions.length}/2000 characters · Saved on this device</small></label>
        </>;
      case "Pets":
        return <div className="empty-state"><PawPrint size={22} /><strong>Pet customization isn't available</strong><span>There are no pet-related settings in this version of Puya Ai.</span></div>;
      case "Keyboard":
        return <>
          <p className="page-intro">Shortcuts available in the chat interface. Custom shortcuts are not supported.</p>
          <div className="shortcut-list">{[["Send message", "Enter"], ["New line", "Shift + Enter"], ["Close settings", "Esc"]].map(([label, key]) => <div className="shortcut-row" key={label}><span>{label}</span><kbd>{key}</kbd></div>)}</div>
        </>;
      case "Usage":
        return <><div className="usage-card"><Sparkles size={18} /><div><strong>Free plan</strong><span>Chat usage is managed by your AI provider.</span></div></div><SettingRow title="Conversations" description="Saved conversations in your account."><span className="static-value">{chats.length}</span></SettingRow><Notice>Detailed usage statistics and plan limits are not available from the current service.</Notice></>;
      case "Billing":
        return <><Notice>Billing is not configured for this application. No payment information is stored here.</Notice><SettingRow title="Current plan" description="Your current Puya Ai plan."><span className="static-value">Free</span></SettingRow><SettingRow title="Payment method" description="No payment method is connected."><button type="button" className="subtle-button" onClick={() => unavailable("Payment method management")}>Manage</button></SettingRow><SettingRow title="Billing history" description="Billing records will appear here when billing is available."><span className="static-value">No history</span></SettingRow></>;
      case "Data controls":
        return <>
          <SettingRow title="Chat history" description="Your conversations are saved so you can return to them later."><span className="static-value">On</span></SettingRow>
          <SettingRow title="Export data" description="Download a copy of your saved conversations."><button type="button" className="subtle-button" onClick={() => { const blob = new Blob([JSON.stringify(chats, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "puya-ai-conversations.json"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice("Your conversation export has been downloaded."); }}>Export</button></SettingRow>
          <SettingRow title="Delete all chats" description="Permanently delete every conversation from your account."><button type="button" className="danger-outline" onClick={() => confirmAndRun("Permanently delete all conversations? This cannot be undone.", () => onDeleteChat("all"))}>Delete all</button></SettingRow>
          <Notice>Data deletion applies to conversations. Account deletion is not available in this app.</Notice>
        </>;
      case "Integrations":
        return <><div className="empty-state"><Link2 size={22} /><strong>No connected apps</strong><span>Third-party app connections are not configured for Puya Ai yet.</span></div><SettingRow title="Available integrations" description="Connectors will appear here when supported."><button type="button" className="subtle-button" onClick={() => unavailable("Integrations")}>Learn more</button></SettingRow></>;
      default:
        return null;
    }
  }

  return (
    <main
      className="settings-app"
      data-theme={pagePreferences.theme.toLowerCase()}
      data-motion={pagePreferences.animations ? "on" : "off"}
      data-compact={pagePreferences.compactMode ? "on" : "off"}
      style={{ "--settings-accent": accentColors[pagePreferences.accent] || accentColors.White }}
    >
      {drawerOpen && <button className="settings-mobile-backdrop" onClick={() => setDrawerOpen(false)} aria-label="Close settings navigation" />}
      <aside className={`settings-sidebar ${drawerOpen ? "drawer-open" : ""}`}>
        <button type="button" className="settings-back" onClick={onBack}><ArrowLeft size={17} /> <span>Back to Puya Ai</span></button>
        <label className="settings-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search settings" aria-label="Search settings" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}</label>
        <nav className="settings-nav" aria-label="Settings categories">
          {matchedSections.length ? matchedSections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.items.map(({ name, icon: Icon }) => <button key={name} type="button" className={`settings-nav-item ${activePage === name ? "active" : ""}`} onClick={() => choosePage(name)} aria-current={activePage === name ? "page" : undefined}><Icon size={17} strokeWidth={1.7} /><span>{name}</span></button>)}</section>) : <p className="settings-no-results">No matching settings</p>}
        </nav>
        <div className="settings-sidebar-footer"><CircleHelp size={15} /><span>Puya Ai settings</span></div>
      </aside>
      <section className="settings-content">
        <header className="settings-mobile-header"><button type="button" className="settings-icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open settings navigation"><Menu size={19} /></button><span>Settings</span><button type="button" className="settings-icon-button" onClick={onBack} aria-label="Back to Puya Ai"><ArrowLeft size={18} /></button></header>
        <div className="settings-content-inner">
          <div className="settings-page-heading"><div className="settings-page-kicker">SETTINGS</div><h1>{activePage}</h1><p>Manage your {activePage.toLowerCase()} preferences.</p></div>
          {notice && <Notice tone="warning">{notice}</Notice>}
          {error && <Notice tone="warning">{error}</Notice>}
          <div className="settings-page-body">{renderPage()}</div>
          <footer className="settings-footer">Your preferences are saved on this device.</footer>
        </div>
      </section>
    </main>
  );
}
