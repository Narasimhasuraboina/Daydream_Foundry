import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import { quoteCategories } from "./quoteData";

const STORAGE_KEY = "northstar-user-quotes";
const THEME_KEY = "northstar-theme";
const legacyWriting = quoteCategories["My writing"];

const MOOD_OPTIONS = [
  "Calm",
  "Grateful",
  "Hopeful",
  "Thoughtful",
  "Happy",
  "Sad",
  "Angry",
  "Anxious",
  "Lonely",
  "Loving",
  "Confused",
  "Motivated",
  "Nostalgic",
  "Silly & Good",
  "Good",
];

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `thought-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function normalizeThoughts(raw) {
  if (!Array.isArray(raw)) {
    return legacyWriting.map((item, index) => ({
      ...item,
      id: `legacy-seed-${index}`,
      category: "My writing",
      personal: true,
      mood: "Thoughtful",
      favorite: false,
      createdAt: new Date().toISOString(),
    }));
  }
  const used = new Set();
  const saved = raw
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        typeof item.text === "string"
    )
    .map((item) => {
      let id = typeof item.id === "string" && item.id ? item.id : makeId();
      if (used.has(id)) id = makeId();
      used.add(id);
      return {
        ...item,
        id,
        category: "My writing",
        note: typeof item.note === "string" ? item.note : "",
        mood: typeof item.mood === "string" ? item.mood : "Thoughtful",
        favorite: Boolean(item.favorite),
        personal: true,
        ...(typeof item.createdAt === "string" &&
        Number.isFinite(Date.parse(item.createdAt))
          ? { createdAt: item.createdAt }
          : { createdAt: new Date().toISOString() }),
      };
    });

  if (!saved.some((item) => item.title === "Stupid Cupid")) {
    const cupid = legacyWriting[0];
    saved.unshift({
      ...cupid,
      id: "legacy-stupid-cupid",
      category: "My writing",
      personal: false,
      mood: "Thoughtful",
      favorite: true,
      createdAt: new Date("2026-02-14").toISOString(),
    });
  }
  return saved;
}

/* Export to JSON */
function exportToJson(thoughts) {
  const personal = thoughts.filter((t) => t.personal);
  const data = JSON.stringify(personal, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daydreamer-thoughts-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Export to Markdown */
function exportToMarkdown(thoughts) {
  const personal = thoughts.filter((t) => t.personal);
  let md = `# Day Dreamer — Personal Journal\n*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
  personal.forEach((t) => {
    md += `## ${t.title}\n`;
    const meta = [
      t.createdAt ? formatDate(t.createdAt) : null,
      t.mood ? `**Mood:** ${t.mood}` : null,
      t.favorite ? `★ Favorite` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    if (meta) md += `*${meta}*\n\n`;
    md += `> ${t.text.replace(/\n/g, "\n> ")}\n\n`;
    if (t.note) md += `*Note: ${t.note}*\n\n`;
    md += `---\n\n`;
  });
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daydreamer-journal-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/* Real Data Backup & Export Component */
function BackupBar({ thoughts, onImport }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          onImport(parsed);
          window.alert(`Successfully imported ${parsed.length} reflections!`);
        } else {
          window.alert("Invalid format. Please select a valid JSON backup file.");
        }
      } catch {
        window.alert("Failed to read the backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="glass-backup-bar" aria-label="Backup and data management">
      <div className="backup-info">
        <span className="backup-icon" aria-hidden="true">💾</span>
        <div>
          <strong>Local Data &amp; Export</strong>
          <span>Your thoughts stay stored on this device. Back up anytime.</span>
        </div>
      </div>
      <div className="backup-buttons">
        <button
          type="button"
          className="btn-glass-pill"
          onClick={() => exportToJson(thoughts)}
          title="Save all your personal thoughts as a JSON backup"
        >
          JSON Backup ⤓
        </button>
        <button
          type="button"
          className="btn-glass-pill"
          onClick={() => exportToMarkdown(thoughts)}
          title="Export journal to readable Markdown (.md)"
        >
          Markdown (.md) ⤓
        </button>
        <button
          type="button"
          className="btn-glass-pill"
          onClick={() => fileInputRef.current?.click()}
          title="Restore thoughts from a JSON backup file"
        >
          Restore / Import ⤒
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

/* Optical Frosted Glass Header with Theme Toggle & Mobile Menu */
function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = readStorage(THEME_KEY);
    if (saved) return saved === "dark";
    return (
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true
    );
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      /* Theme persists in session */
    }
  }, [isDark]);

  return (
    <header className="glass-header">
      <a className="brand-wrap" href="/" aria-label="Day Dreamer home">
        <span className="brand-mark" aria-hidden="true">✦</span>
        <span>Day Dreamer</span>
      </a>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="glass-nav"
        aria-label="Toggle navigation"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav
        id="glass-nav"
        className={`nav-links${isOpen ? " is-open" : ""}`}
        aria-label="Main navigation"
      >
        <a href="/#write" onClick={() => setIsOpen(false)}>
          My writing
        </a>
        <a href="/#about" onClick={() => setIsOpen(false)}>
          About us
        </a>
        <a href="/thoughts" onClick={() => setIsOpen(false)}>
          Explore shelves ↗
        </a>
      </nav>

      <div className="header-actions-group">
        <button
          className="theme-toggle-glass"
          type="button"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setIsDark((d) => !d)}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span aria-hidden="true">{isDark ? "☀" : "🌙"}</span>
          <span className="theme-toggle-text">{isDark ? "Light" : "Dark"}</span>
        </button>

        <a className="btn-cyan-pill" href="/#write">
          Put a thought into words
        </a>
      </div>
    </header>
  );
}

/* Translucent Glass Thought Form with Live Counters & Mood Selector */
function ThoughtForm({ onAdd, onUpdate, thought, onCancel }) {
  const [title, setTitle] = useState(thought?.title ?? "");
  const [text, setText] = useState(thought?.text ?? "");
  const [note, setNote] = useState(thought?.note ?? "");
  const [mood, setMood] = useState(thought?.mood ?? "Thoughtful");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(thought?.title ?? "");
    setText(thought?.text ?? "");
    setNote(thought?.note ?? "");
    setMood(thought?.mood ?? "Thoughtful");
    setMessage("");
    setError("");
  }, [thought]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (saving) return;
    const cleanTitle = title.trim();
    const cleanText = text.trim();
    if (!cleanTitle || !cleanText) {
      setError("Please add a title and your thought before saving.");
      return;
    }
    setSaving(true);
    setError("");
    const result = thought
      ? onUpdate({
          ...thought,
          title: cleanTitle,
          text: cleanText,
          note: note.trim(),
          mood,
          updatedAt: new Date().toISOString(),
        })
      : onAdd({
          id: makeId(),
          category: "My writing",
          title: cleanTitle,
          text: cleanText,
          note: note.trim(),
          mood,
          favorite: false,
          createdAt: new Date().toISOString(),
          personal: true,
        });
    setSaving(false);
    if (!result.ok) {
      setError("Unable to save to browser storage. Check storage or privacy settings.");
      return;
    }
    if (!thought) {
      setTitle("");
      setText("");
      setNote("");
      setMessage("Your thought has been saved to your local sanctuary.");
    } else {
      onCancel?.();
    }
  };

  return (
    <form
      id={thought ? undefined : "write"}
      className="glass-write-panel"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="thought-form-header">
        <div>
          <span className="kicker-tag">
            {thought ? "EDIT REFLECTION" : "LEAVE A THOUGHT"}
          </span>
          <h3 style={{ margin: "4px 0 0" }}>
            {thought ? "Edit your thought." : "Leave a thought here."}
          </h3>
        </div>
        <span className="form-avatar-symbol" aria-hidden="true">
          {thought ? "✎" : "+"}
        </span>
      </div>

      <div className="form-field-group">
        <label htmlFor={thought ? `title-${thought.id}` : "thought-title"}>
          Title
        </label>
        <input
          id={thought ? `title-${thought.id}` : "thought-title"}
          className="glass-input-el"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give it a name"
          required
          maxLength={160}
        />
      </div>

      <div className="form-field-group">
        <label htmlFor={thought ? `text-${thought.id}` : "thought-text"}>
          Your reflection
        </label>
        <textarea
          id={thought ? `text-${thought.id}` : "thought-text"}
          className="glass-input-el"
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What is on your mind?"
          required
        />
        <div className="form-counter-bar">
          <span>{words} {words === 1 ? "word" : "words"}</span>
          <span>{chars} characters</span>
        </div>
      </div>

      <div className="form-field-group">
        <label htmlFor={thought ? `mood-${thought.id}` : "thought-mood"}>
          Mood or Shelf <span>(Optional)</span>
        </label>
        <select
          id={thought ? `mood-${thought.id}` : "thought-mood"}
          className="glass-input-el"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        >
          {MOOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field-group">
        <label htmlFor={thought ? `note-${thought.id}` : "thought-note"}>
          Small note <span>(Optional context)</span>
        </label>
        <input
          id={thought ? `note-${thought.id}` : "thought-note"}
          className="glass-input-el"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A little context for later"
        />
      </div>

      {error && <small className="alert-error-glass">{error}</small>}
      {message && <small className="alert-success-glass">{message}</small>}

      <div className="form-actions-row">
        <button className="btn-cyan-pill" type="submit" disabled={saving}>
          {thought ? "Save changes" : "Save thought"} ↗
        </button>
        {thought && (
          <button className="btn-glass-pill" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <small className="storage-privacy-notice">
        🔒 Saved in this browser only. 100% private to your device.
      </small>
    </form>
  );
}

/* Optical Glass Quote Card */
function QuoteCard({ quote, index, onUpdate, onDelete, onToggleFavorite }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isPersonal = quote.personal === true;

  const handleCopy = () => {
    const fullText = `"${quote.title}"\n\n"${quote.text}"${
      quote.note ? `\n— ${quote.note}` : ""
    }`;
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (editing) {
    return (
      <ThoughtForm
        thought={quote}
        onUpdate={onUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <article
      className={`glass-quote-card${isOpen ? " is-open" : ""}${
        index === 0 ? " is-featured-card" : ""
      }`}
    >
      <button
        className="card-header-trigger"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="card-quote-mark" aria-hidden="true">
          “
        </span>
        <span className="card-title-text">{quote.title}</span>
        <div className="card-controls-right">
          {isPersonal && (
            <button
              type="button"
              className={`quote-fav-star${quote.favorite ? " is-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(quote.id);
              }}
              title={quote.favorite ? "Favorited" : "Add to favorites"}
              aria-label={quote.favorite ? "Remove favorite" : "Mark favorite"}
            >
              {quote.favorite ? "★" : "☆"}
            </button>
          )}
          <span className="card-expand-icon" aria-hidden="true">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="card-details-drawer">
          <blockquote>{quote.text}</blockquote>
          <div className="card-meta-bar">
            <div className="card-tags-group">
              {quote.mood && <span className="pill-mood-badge">✦ {quote.mood}</span>}
              {quote.createdAt && (
                <span className="card-date-label">
                  {formatDate(quote.createdAt)}
                </span>
              )}
            </div>
            {quote.note && <cite className="card-note-cite">— {quote.note}</cite>}
          </div>

          <div className="card-actions-bar">
            <button
              type="button"
              className="btn-glass-pill btn-sm"
              onClick={handleCopy}
              title="Copy thought to clipboard"
            >
              {copied ? "Copied! ✓" : "Copy"}
            </button>
            {isPersonal && (
              <>
                <button
                  type="button"
                  className="btn-glass-pill btn-sm"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                {!confirmingDelete ? (
                  <button
                    type="button"
                    className="btn-glass-pill btn-sm btn-danger"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete
                  </button>
                ) : (
                  <div className="delete-confirm-popover" role="alert">
                    <span>Delete permanently?</span>
                    <button
                      type="button"
                      className="btn-glass-pill btn-sm btn-danger-solid"
                      onClick={() => onDelete(quote.id)}
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      className="btn-glass-pill btn-sm"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

/* Genuine 7-Day Activity SVG Line Chart (Real thoughts data) */
function ActivityChart({ thoughts }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  const counts = days.map(
    (day) =>
      thoughts.filter(
        (item) =>
          item.createdAt &&
          new Date(item.createdAt).toDateString() === day.toDateString()
      ).length
  );
  const max = Math.max(1, ...counts);
  const points = counts
    .map((count, i) => `${i * 100},${160 - (count / max) * 125}`)
    .join(" ");

  const hasData = counts.some(Boolean);

  return (
    <div className="activity-svg-wrap">
      {hasData ? (
        <>
          <svg viewBox="0 0 600 180" role="img" aria-label="Writing cadence over last 7 days">
            <defs>
              <linearGradient id="cyanCadenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polyline
              points={points}
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {counts.map((count, i) => (
              <circle
                key={i}
                cx={i * 100}
                cy={160 - (count / max) * 125}
                r="5"
                fill="var(--cyan)"
              />
            ))}
          </svg>
          <div className="months-labels">
            {days.map((day) => (
              <span key={day.toISOString()}>
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="chart-empty-state">
          <span className="empty-chart-icon">📈</span>
          <p>Writing activity will appear here as you record thoughts across the week.</p>
        </div>
      )}
    </div>
  );
}

/* Genuine Personal Sanctuary Overview Widget (100% Real Data) */
function GenuineSanctuaryWidget({ userQuotes }) {
  const words = userQuotes.reduce(
    (sum, item) => sum + item.text.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const today = new Date();
  const todayCount = userQuotes.filter(
    (item) =>
      item.createdAt &&
      new Date(item.createdAt).toDateString() === today.toDateString()
  ).length;
  const favCount = userQuotes.filter((item) => item.personal && item.favorite).length;

  return (
    <div className="floating-glass-dashboard">
      <div className="dashboard-widget-header">
        <div className="widget-title-group">
          <span className="widget-brand-mark">✦</span>
          <strong>Sanctuary Cadence</strong>
        </div>
        <span className="live-date-badge">
          {today.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="widget-body-grid">
        {/* Real Writing Rhythm Wave Chart */}
        <div className="chart-card-mini">
          <div className="chart-card-header">
            <span className="card-kicker">7-Day Reflection Rhythm</span>
            <span className="badge-growth">{todayCount} today</span>
          </div>
          <ActivityChart thoughts={userQuotes} />
        </div>

        {/* Real Status Rings (Actual metrics) */}
        <div className="chart-card-mini">
          <div className="chart-card-header">
            <span className="card-kicker">Sanctuary Status</span>
          </div>
          <div className="rings-group">
            <div className="status-ring">
              <div className="ring-circle">{userQuotes.length}</div>
              <span className="ring-label">Thoughts</span>
              <span className="ring-sub">Saved</span>
            </div>
            <div className="status-ring">
              <div className="ring-circle">{favCount}</div>
              <span className="ring-label">Starred</span>
              <span className="ring-sub">Favorites</span>
            </div>
            <div className="status-ring">
              <div className="ring-circle">100%</div>
              <span className="ring-label">Private</span>
              <span className="ring-sub">Isolated</span>
            </div>
          </div>
        </div>
      </div>

      <div className="widget-metrics-row">
        <div className="widget-metric-cell">
          <span>Words Preserved</span>
          <strong>{words.toLocaleString()}</strong>
        </div>
        <div className="widget-metric-cell">
          <span>Curated Shelves</span>
          <strong>{Object.keys(quoteCategories).length - 1} Shelves</strong>
        </div>
        <div className="widget-metric-cell">
          <span>Storage Model</span>
          <strong>Local-First</strong>
        </div>
      </div>
    </div>
  );
}

/* Authentic About Us Section (Foundry Architecture & Philosophy) */
function AboutSection() {
  return (
    <section id="about" className="about-glass-card">
      <div className="card-heading-row">
        <div>
          <span className="kicker-tag">FOUNDRY ARCHITECTURE &amp; PHILOSOPHY</span>
          <h2 style={{ fontSize: "1.85rem", marginTop: "4px" }}>
            Where human introspection meets optical glass design.
          </h2>
        </div>
        <span className="status-badge-cyan">LOCAL SANCTUARY</span>
      </div>

      <p className="about-intro-lead">
        Day Dreamer was created as an antidote to noisy, infinite algorithmic feeds. We believe having
        an intentional, distraction-free space to crystallize passing thoughts, track emotional cadences,
        and preserve reflection is essential for clarity and peace of mind.
      </p>

      <div className="telemetry-manifesto-row">
        <div className="manifesto-stat">
          <strong>100%</strong>
          <span>Client-Side Isolation</span>
          <small>Stored only in your browser storage</small>
        </div>
        <div className="manifesto-stat">
          <strong>0 ms</strong>
          <span>Cloud Storage Latency</span>
          <small>Zero remote databases or tracking</small>
        </div>
        <div className="manifesto-stat">
          <strong>15+</strong>
          <span>Curated Idea Shelves</span>
          <small>Structured emotional resonance</small>
        </div>
        <div className="manifesto-stat">
          <strong>2</strong>
          <span>Portable Export Formats</span>
          <small>One-click JSON &amp; Markdown exports</small>
        </div>
      </div>
    </section>
  );
}

/* Home Page */
function HomePage({
  userQuotes,
  onAdd,
  onUpdate,
  onDelete,
  onToggleFavorite,
  onImport,
}) {
  const words = userQuotes.reduce(
    (sum, item) => sum + item.text.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const favCount = userQuotes.filter((item) => item.personal && item.favorite).length;
  const today = new Date();
  const todayCount = userQuotes.filter(
    (item) =>
      item.createdAt &&
      new Date(item.createdAt).toDateString() === today.toDateString()
  ).length;

  const orderedThoughts = [...userQuotes].sort(
    (a, b) =>
      (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0)
  );

  return (
    <div className="glass-viewport">
      <Header />

      {/* Authentic Hero Section */}
      <section className="hero-grid">
        <div className="hero-statement">
          <p className="eyebrow-pill">
            <span className="eyebrow-dot"></span>
            YOUR LITTLE CORNER OF THE WORLD
          </p>
          <h1>
            A place for
            <br />
            <em>the in-between.</em>
          </h1>
          <p className="hero-description">
            A soft landing for passing thoughts, big feelings, and all the little things you
            want to remember. Preserved privately on your device.
          </p>

          <div className="hero-actions">
            <a className="btn-cyan-pill" href="#write">
              Put a thought into words ↘
            </a>
            <a className="btn-glass-pill" href="/thoughts">
              Explore shelves ↗
            </a>
          </div>
        </div>

        <div className="hero-showcase">
          <GenuineSanctuaryWidget userQuotes={userQuotes} />
        </div>
      </section>

      {/* Real Thought Metrics (KPI Cards) */}
      <section className="dashboard-kpis-glass" aria-label="Personal thought metrics">
        <article className="metric-card-glass">
          <span className="metric-label">Personal thoughts</span>
          <strong className="metric-number">{userQuotes.length}</strong>
          <small className="metric-caption">Your words, kept close</small>
          <div className="metric-accent-line line-cyan"></div>
        </article>

        <article className="metric-card-glass">
          <span className="metric-label">Idea shelves</span>
          <strong className="metric-number">{Object.keys(quoteCategories).length - 1}</strong>
          <small className="metric-caption">Curated perspectives to explore</small>
          <div className="metric-accent-line line-blue"></div>
        </article>

        <article className="metric-card-glass">
          <span className="metric-label">Words written</span>
          <strong className="metric-number">{words.toLocaleString()}</strong>
          <small className="metric-caption">Across your personal thoughts</small>
          <div className="metric-accent-line line-mint"></div>
        </article>

        <article className="metric-card-glass metric-card-highlight">
          <span className="metric-label">Starred favorites</span>
          <strong className="metric-number">{favCount}</strong>
          <small className="metric-caption">{todayCount} reflections recorded today</small>
          <div className="metric-accent-line line-amber"></div>
        </article>
      </section>

      {/* Middle Panels: Writing Cadence + Curated Shelf Explorer */}
      <div className="panels-grid-glass">
        <article className="glass-content-card">
          <div className="card-heading-row">
            <div>
              <span className="kicker-tag">YOUR RECENT PAGES</span>
              <h2 style={{ fontSize: "1.45rem", marginTop: "4px" }}>Writing Rhythm</h2>
            </div>
            <span className="status-badge-cyan">Last 7 Days</span>
          </div>
          <ActivityChart thoughts={userQuotes} />
        </article>

        <article className="glass-content-card">
          <div className="card-heading-row">
            <div>
              <span className="kicker-tag">A SHELF TO EXPLORE</span>
              <h2 style={{ fontSize: "1.45rem", marginTop: "4px" }}>Ideas &amp; Feelings</h2>
            </div>
            <span className="status-badge-cyan">{Object.keys(quoteCategories).length - 1} Shelves</span>
          </div>
          <p className="explore-shelf-copy">
            Browse {Object.keys(quoteCategories).filter((x) => x !== "My writing").slice(0, 5).join(", ")},
            and discover thoughts and words that meet you wherever you are.
          </p>
          <a className="btn-cyan-pill" href="/thoughts">
            Explore All Shelves ↗
          </a>
        </article>
      </div>

      {/* About Us Section */}
      <AboutSection />

      {/* Personal Writings Collection + ThoughtForm */}
      <section id="insights" className="glass-content-card" style={{ marginBottom: "30px" }}>
        <div className="card-heading-row">
          <div>
            <span className="kicker-tag">YOUR PERSONAL COLLECTION</span>
            <h2 style={{ fontSize: "1.65rem", marginTop: "4px" }}>Words worth keeping</h2>
          </div>
          <a className="btn-glass-pill" href="/thoughts">
            Open writing library ↗
          </a>
        </div>

        {/* Real Data Backup & Export Controls */}
        <BackupBar thoughts={userQuotes} onImport={onImport} />

        <div className="journal-layout-glass">
          <div className="thoughts-feed-column">
            {orderedThoughts.length ? (
              orderedThoughts.map((thought, index) => (
                <QuoteCard
                  key={thought.id}
                  quote={thought}
                  index={index}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                />
              ))
            ) : (
              <p className="empty-collection-state">
                Your writing will appear here as you save thoughts.
              </p>
            )}
          </div>

          <ThoughtForm onAdd={onAdd} />
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-footer-bar">
        <div className="footer-brand-group">
          <span className="brand-mark" style={{ width: "28px", height: "28px", fontSize: "0.95rem" }}>✦</span>
          <div>
            <strong>Day Dreamer</strong>
            <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Words worth keeping.
            </span>
          </div>
        </div>
        <p className="footer-quote-tag">Keep a little room for wonder.</p>
        <div className="footer-nav-glass">
          <a href="/thoughts">Thoughts ↗</a>
          <a href="#about">About us ↗</a>
          <a href="#root">Back to top ↑</a>
        </div>
        <small className="footer-copy-notice">© 2026 Day Dreamer · Client-Side Sanctuary</small>
      </footer>
    </div>
  );
}

/* Quote Library Page (/thoughts) */
function QuoteLibrary({
  userQuotes,
  onAdd,
  onUpdate,
  onDelete,
  onToggleFavorite,
  onImport,
}) {
  const [activeCategory, setActiveCategory] = useState("My writing");
  const [visibleCount, setVisibleCount] = useState(10);
  const [search, setSearch] = useState("");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedMood, setSelectedMood] = useState("all");

  const personalQuotes = userQuotes.filter((item) => item.personal);
  const favCount = personalQuotes.filter((item) => item.favorite).length;

  const source = useMemo(() => {
    if (activeCategory === "My writing") {
      let list = userQuotes;
      if (filterFavorites) {
        list = list.filter((item) => item.favorite);
      }
      if (selectedMood !== "all") {
        list = list.filter((item) => item.mood === selectedMood);
      }
      return list;
    }
    const personalTagged = userQuotes.filter(
      (item) => item.personal && item.mood === activeCategory
    );
    const shelfQuotes = quoteCategories[activeCategory] ?? [];
    return [...personalTagged, ...shelfQuotes];
  }, [activeCategory, userQuotes, filterFavorites, selectedMood]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return needle
      ? source.filter((item) =>
          `${item.title} ${item.text} ${item.note ?? ""} ${item.mood ?? ""}`
            .toLocaleLowerCase()
            .includes(needle)
        )
      : source;
  }, [source, search]);

  const loaded = filtered.slice(0, visibleCount);

  const chooseCategory = (category) => {
    setActiveCategory(category);
    setVisibleCount(10);
    setFilterFavorites(false);
    setSelectedMood("all");
  };

  return (
    <div className="glass-viewport">
      <Header />

      <section className="library-glass-page">
        <div className="library-intro-col">
          <a className="btn-glass-pill" style={{ display: "inline-flex", marginBottom: "20px" }} href="/">
            ← Back to home
          </a>
          <span className="kicker-tag" style={{ display: "block", marginBottom: "8px" }}>
            A PRIVATE SHELF OF WORDS
          </span>
          <h1 style={{ fontSize: "2.8rem", marginBottom: "16px", lineHeight: "1.08" }}>
            Thoughts worth
            <br />
            <em>returning to.</em>
          </h1>
          <p style={{ color: "var(--text-med)", lineHeight: "1.7", fontSize: "0.98rem" }}>
            Notes, observations, and ideas collected in one quiet optical glass sanctuary.
            Your writing stays saved in this browser.
          </p>

          <BackupBar thoughts={userQuotes} onImport={onImport} />
        </div>

        <div className="library-content-col">
          <p className="library-section-label">Your personal writing</p>
          <div className="tabs-row-glass">
            <button
              className={`tab-pill-glass${activeCategory === "My writing" ? " is-active" : ""}`}
              onClick={() => chooseCategory("My writing")}
            >
              My writing ({userQuotes.length})
            </button>
          </div>

          {activeCategory === "My writing" && (
            <div className="sub-filter-row">
              <button
                type="button"
                className={`sub-pill-glass${!filterFavorites && selectedMood === "all" ? " is-active" : ""}`}
                onClick={() => {
                  setFilterFavorites(false);
                  setSelectedMood("all");
                }}
              >
                All ({userQuotes.length})
              </button>
              <button
                type="button"
                className={`sub-pill-glass${filterFavorites ? " is-active" : ""}`}
                onClick={() => {
                  setFilterFavorites((fav) => !fav);
                  setSelectedMood("all");
                }}
              >
                ★ Favorites ({favCount})
              </button>
              <select
                className="sub-select-glass"
                value={selectedMood}
                onChange={(e) => {
                  setSelectedMood(e.target.value);
                  setFilterFavorites(false);
                }}
              >
                <option value="all">All Moods</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="search-glass-row">
            <input
              className="glass-input-el"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(10);
              }}
              placeholder="Find a thought, mood, or note…"
            />
            {(search || activeCategory !== "My writing" || filterFavorites || selectedMood !== "all") && (
              <button
                type="button"
                className="btn-glass-pill btn-sm"
                onClick={() => {
                  setSearch("");
                  chooseCategory("My writing");
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          <p className="library-section-label" style={{ marginTop: "24px" }}>
            Curated emotions &amp; ideas
          </p>
          <div className="tabs-row-glass">
            {Object.keys(quoteCategories)
              .filter((c) => c !== "My writing")
              .map((c) => (
                <button
                  key={c}
                  className={`tab-pill-glass${activeCategory === c ? " is-active" : ""}`}
                  onClick={() => chooseCategory(c)}
                >
                  {c} ({quoteCategories[c].length})
                </button>
              ))}
          </div>

          {activeCategory !== "My writing" && (
            <p className="exploring-tag">
              Exploring shelf: <strong>{activeCategory}</strong>
            </p>
          )}

          <div className="library-cards-grid">
            {loaded.map((quote, idx) => (
              <QuoteCard
                key={quote.id ?? `${activeCategory}-${idx}`}
                quote={quote}
                index={idx}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="empty-collection-state">
              No thoughts match your search or filter.
            </p>
          )}

          {visibleCount < filtered.length && (
            <button
              className="btn-glass-pill"
              style={{ margin: "24px auto 0", display: "flex" }}
              onClick={() => setVisibleCount((c) => Math.min(c + 10, filtered.length))}
            >
              Load more ({loaded.length} of {filtered.length}) ↓
            </button>
          )}

          {activeCategory === "My writing" && (
            <div style={{ marginTop: "36px" }}>
              <ThoughtForm onAdd={onAdd} />
            </div>
          )}
        </div>
      </section>

      <footer className="glass-footer-bar">
        <div className="footer-brand-group">
          <span className="brand-mark" style={{ width: "28px", height: "28px", fontSize: "0.95rem" }}>✦</span>
          <strong>Day Dreamer</strong>
        </div>
        <p className="footer-quote-tag">Keep a little room for wonder.</p>
        <div className="footer-nav-glass">
          <a href="/">Home</a>
          <a href="/#about">About us</a>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [userQuotes, setUserQuotes] = useState(() => {
    const stored = readStorage(STORAGE_KEY);
    if (!stored) return normalizeThoughts(null);
    try {
      return normalizeThoughts(JSON.parse(stored));
    } catch {
      return normalizeThoughts(null);
    }
  });

  const persist = (next) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next.filter((item) => item.personal))
      );
      setUserQuotes(next);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  };

  const addThought = (thought) => persist([...userQuotes, thought]);

  const updateThought = (thought) =>
    persist(userQuotes.map((item) => (item.id === thought.id ? thought : item)));

  const deleteThought = (id) => {
    const next = userQuotes.filter((item) => item.id !== id);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next.filter((item) => item.personal))
      );
      setUserQuotes(next);
    } catch {
      window.alert("Storage failed on this device.");
    }
  };

  const toggleFavorite = (id) => {
    const next = userQuotes.map((item) =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );
    persist(next);
  };

  const importThoughts = (importedList) => {
    const valid = importedList.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        typeof item.text === "string"
    );
    const existingIds = new Set(userQuotes.map((q) => q.id));
    const merged = [...userQuotes];
    valid.forEach((item) => {
      let id = item.id || makeId();
      while (existingIds.has(id)) {
        id = makeId();
      }
      existingIds.add(id);
      merged.push({
        ...item,
        id,
        category: "My writing",
        note: typeof item.note === "string" ? item.note : "",
        mood: typeof item.mood === "string" ? item.mood : "Thoughtful",
        favorite: Boolean(item.favorite),
        personal: true,
        createdAt:
          typeof item.createdAt === "string" &&
          Number.isFinite(Date.parse(item.createdAt))
            ? item.createdAt
            : new Date().toISOString(),
      });
    });
    persist(merged);
  };

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    const handleClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = event.target.closest("a");
      if (
        !link ||
        link.target === "_blank" ||
        link.origin !== window.location.origin
      ) {
        return;
      }
      if (["/", "/thoughts"].includes(link.pathname)) {
        if (link.pathname !== window.location.pathname) {
          event.preventDefault();
          window.history.pushState({}, "", link.pathname + (link.hash || ""));
          setPath(link.pathname);
          if (link.hash) {
            setTimeout(() => {
              const el = document.querySelector(link.hash);
              el?.scrollIntoView({ behavior: "smooth" });
            }, 60);
          } else {
            window.scrollTo(0, 0);
          }
        } else if (link.hash) {
          event.preventDefault();
          window.history.pushState({}, "", link.pathname + link.hash);
          const el = document.querySelector(link.hash);
          el?.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return path === "/thoughts" ? (
    <QuoteLibrary
      userQuotes={userQuotes}
      onAdd={addThought}
      onUpdate={updateThought}
      onDelete={deleteThought}
      onToggleFavorite={toggleFavorite}
      onImport={importThoughts}
    />
  ) : (
    <HomePage
      userQuotes={userQuotes}
      onAdd={addThought}
      onUpdate={updateThought}
      onDelete={deleteThought}
      onToggleFavorite={toggleFavorite}
      onImport={importThoughts}
    />
  );
}

document.title = "Day Dreamer — Words Worth Keeping";
createRoot(document.getElementById("root")).render(<App />);
