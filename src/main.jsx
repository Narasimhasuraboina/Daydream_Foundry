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
  "Silly",
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
      mood: "",
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
        mood: typeof item.mood === "string" ? item.mood : "",
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
      favorite: false,
      createdAt: new Date("2026-02-14").toISOString(),
    });
  }
  return saved;
}

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
          window.alert(`Successfully imported ${parsed.length} thoughts!`);
        } else {
          window.alert("Invalid file format. Please upload a valid JSON backup.");
        }
      } catch {
        window.alert("Failed to parse JSON backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="backup-bar" aria-label="Backup and data management">
      <div className="backup-bar-title">
        <span aria-hidden="true">💾</span>
        <span>Backup &amp; Export</span>
      </div>
      <div className="backup-bar-actions">
        <button
          type="button"
          className="backup-btn"
          onClick={() => exportToJson(thoughts)}
          title="Save all your thoughts as a JSON backup file"
        >
          JSON Backup ⤓
        </button>
        <button
          type="button"
          className="backup-btn"
          onClick={() => exportToMarkdown(thoughts)}
          title="Export your journal to readable Markdown"
        >
          Markdown (.md) ⤓
        </button>
        <button
          type="button"
          className="backup-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Restore thoughts from a JSON backup"
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

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = readStorage(THEME_KEY);
    return (
      saved === "dark" ||
      (saved !== "light" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      /* Theme still works for this session. */
    }
  }, [isDark]);

  return (
    <header className="site-header">
      <a
        className="brand"
        href="/"
        aria-label="Day Dreamer home"
        onClick={() => setIsOpen(false)}
      >
        <span className="brand-mark">D</span>
        <span>Day Dreamer</span>
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="site-nav"
        aria-label="Toggle navigation"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <button
        className="theme-toggle"
        type="button"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        onClick={() => setIsDark((dark) => !dark)}
      >
        <span aria-hidden="true">{isDark ? "☀" : "◐"}</span>
        <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
      </button>
      <nav
        id="site-nav"
        className={`site-nav${isOpen ? " is-open" : ""}`}
        aria-label="Main navigation"
      >
        <a href="/#write" onClick={() => setIsOpen(false)}>
          My writing
        </a>
        <a
          className="nav-cta"
          href="/thoughts"
          onClick={() => setIsOpen(false)}
        >
          Explore thoughts <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}

function ThoughtForm({ onAdd, onUpdate, thought, onCancel }) {
  const [title, setTitle] = useState(thought?.title ?? "");
  const [text, setText] = useState(thought?.text ?? "");
  const [note, setNote] = useState(thought?.note ?? "");
  const [mood, setMood] = useState(thought?.mood ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(thought?.title ?? "");
    setText(thought?.text ?? "");
    setNote(thought?.note ?? "");
    setMood(thought?.mood ?? "");
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
      setError("Add a title and your thought before saving.");
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
      setError(
        "This browser could not save your thought. Check storage space or browser privacy settings, then try again."
      );
      return;
    }
    if (!thought) {
      setTitle("");
      setText("");
      setNote("");
      setMood("");
      setMessage("Your thought is now on the page.");
    } else {
      onCancel?.();
    }
  };

  return (
    <form
      id={thought ? undefined : "write"}
      className="thought-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="thought-form-heading">
        <div>
          <span className="panel-kicker">
            {thought ? "Make an adjustment" : "Write something"}
          </span>
          <h2>{thought ? "Edit your thought." : "Leave a thought here."}</h2>
        </div>
        <span
          className="insight-avatar insight-avatar-green"
          aria-hidden="true"
        >
          {thought ? "✎" : "+"}
        </span>
      </div>

      <label htmlFor={thought ? `title-${thought.id}` : "thought-title"}>
        Title
        <input
          id={thought ? `title-${thought.id}` : "thought-title"}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Give it a name"
          required
          maxLength={160}
        />
      </label>

      <label htmlFor={thought ? `text-${thought.id}` : "thought-text"}>
        Your thought
        <textarea
          id={thought ? `text-${thought.id}` : "thought-text"}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What is on your mind?"
          rows="4"
          required
        />
      </label>
      <div className="form-counter" aria-live="polite">
        <span>{words} {words === 1 ? "word" : "words"}</span>
        <span>{chars} characters</span>
      </div>

      <label htmlFor={thought ? `mood-${thought.id}` : "thought-mood"}>
        Mood or Shelf <span>(optional)</span>
        <select
          id={thought ? `mood-${thought.id}` : "thought-mood"}
          value={mood}
          onChange={(event) => setMood(event.target.value)}
        >
          <option value="">General (No specific mood)</option>
          {MOOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor={thought ? `note-${thought.id}` : "thought-note"}>
        Small note <span>(optional)</span>
        <input
          id={thought ? `note-${thought.id}` : "thought-note"}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="A little context"
        />
      </label>

      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}

      <div className="form-actions">
        <button
          className="load-more thought-submit"
          type="submit"
          disabled={saving}
        >
          {thought ? "Save changes" : "Save thought"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
        {thought && (
          <button
            className="secondary-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>

      {message && (
        <small className="form-success" role="status">
          {message}
        </small>
      )}
      <small className="form-note">
        Saved in this browser only. Your writing stays on this device.
      </small>
    </form>
  );
}

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
      className={`quote-card${isPersonal ? " personal-thought-card" : ""}${
        index === 0 ? " quote-card-featured" : ""
      }${isOpen ? " is-open" : ""}`}
    >
      <button
        className="quote-card-trigger"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="quote-mark" aria-hidden="true">
          “
        </span>
        <span className="quote-title">{quote.title}</span>
        <div className="quote-card-header-actions">
          {isPersonal && (
            <button
              type="button"
              className={`quote-favorite-btn${
                quote.favorite ? " is-favorite" : ""
              }`}
              aria-label={
                quote.favorite ? "Remove from favorites" : "Mark as favorite"
              }
              title={quote.favorite ? "Favorited" : "Add to favorites"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(quote.id);
              }}
            >
              {quote.favorite ? "★" : "☆"}
            </button>
          )}
          <span className="quote-toggle" aria-hidden="true">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="quote-details">
          <blockquote>{quote.text}</blockquote>

          <div className="quote-meta-row">
            <div className="quote-meta-tags">
              {quote.mood && (
                <span className="quote-mood-pill">✦ {quote.mood}</span>
              )}
              {quote.createdAt && (
                <span className="quote-date">
                  {formatDate(quote.createdAt)}
                </span>
              )}
            </div>
            {quote.note && <cite>— {quote.note}</cite>}
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleCopy}
              title="Copy quote to clipboard"
            >
              {copied ? "Copied! ✓" : "Copy"}
            </button>
            {isPersonal && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                {!confirmingDelete ? (
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete
                  </button>
                ) : (
                  <div className="delete-confirm-box" role="alert">
                    <span>Delete permanently?</span>
                    <button
                      type="button"
                      className="secondary-button danger-button"
                      onClick={() => onDelete(quote.id)}
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
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
    // For emotion shelves: include user's thoughts tagged with this category + shelf quotes
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
    <section className="section thoughts-page">
      <div className="thoughts-page-heading">
        <a className="text-link" href="/">
          ← Back to home
        </a>
        <p className="eyebrow">A private shelf of words</p>
        <h1>
          Thoughts worth
          <br />
          <em>returning to.</em>
        </h1>
        <p className="hero-text">
          Notes, observations, and ideas collected in one place. Your writing
          stays saved in this browser.
        </p>
      </div>

      <div className="thoughts-content">
        <p className="library-label">Your writing</p>
        <div
          className="quote-tabs"
          role="tablist"
          aria-label="Thought categories"
        >
          <button
            className={`quote-tab${
              activeCategory === "My writing" ? " is-active" : ""
            }`}
            type="button"
            role="tab"
            aria-selected={activeCategory === "My writing"}
            onClick={() => chooseCategory("My writing")}
          >
            My writing<span>{userQuotes.length}</span>
          </button>
        </div>

        {activeCategory === "My writing" && (
          <div className="sub-filter-pills" aria-label="Filter writing">
            <button
              type="button"
              className={`sub-filter-pill${
                !filterFavorites && selectedMood === "all" ? " is-active" : ""
              }`}
              onClick={() => {
                setFilterFavorites(false);
                setSelectedMood("all");
              }}
            >
              All ({userQuotes.length})
            </button>
            <button
              type="button"
              className={`sub-filter-pill${filterFavorites ? " is-active" : ""}`}
              onClick={() => {
                setFilterFavorites((fav) => !fav);
                setSelectedMood("all");
              }}
            >
              ★ Favorites ({favCount})
            </button>
            {MOOD_OPTIONS.some((m) =>
              userQuotes.some((item) => item.mood === m)
            ) && (
              <select
                className="sub-filter-pill"
                value={selectedMood}
                onChange={(e) => {
                  setSelectedMood(e.target.value);
                  setFilterFavorites(false);
                }}
                style={{ padding: "4px 8px" }}
              >
                <option value="all">All Moods</option>
                {MOOD_OPTIONS.filter((m) =>
                  userQuotes.some((item) => item.mood === m)
                ).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <label className="search-label" htmlFor="thought-search">
          Search titles, writing, or notes
        </label>
        <div className="search-row">
          <input
            id="thought-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(10);
            }}
            placeholder="Find a thought…"
          />
          {(search ||
            activeCategory !== "My writing" ||
            filterFavorites ||
            selectedMood !== "all") && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSearch("");
                chooseCategory("My writing");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {activeCategory === "My writing" && (
          <>
            <div className="quote-list">
              {loaded.map((quote, index) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  index={index}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="empty-state">
                {userQuotes.length
                  ? "No thoughts match your search or filter."
                  : "Your writing will find a home here. Start with one small thought."}
              </p>
            )}
            {visibleCount < filtered.length && (
              <button
                className="load-more"
                type="button"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(count + 10, filtered.length)
                  )
                }
              >
                Load more <span aria-hidden="true">↓</span>
                <small>
                  {loaded.length} of {filtered.length}
                </small>
              </button>
            )}

            <BackupBar thoughts={userQuotes} onImport={onImport} />
            <ThoughtForm onAdd={onAdd} />
          </>
        )}

        <p className="library-label library-label-emotions">Emotions &amp; ideas</p>
        <div
          className="quote-tabs"
          role="tablist"
          aria-label="Emotion and idea categories"
        >
          {Object.keys(quoteCategories)
            .filter((category) => category !== "My writing")
            .map((category) => (
              <button
                key={category}
                className={`quote-tab${
                  activeCategory === category ? " is-active" : ""
                }`}
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => chooseCategory(category)}
              >
                {category}
                <span>{quoteCategories[category].length}</span>
              </button>
            ))}
        </div>

        {activeCategory !== "My writing" && (
          <>
            <p className="active-filter">
              Exploring: <strong>{activeCategory}</strong>
            </p>
            <div className="quote-list">
              {loaded.map((quote, index) => (
                <QuoteCard
                  key={quote.id ?? `${activeCategory}-${index}`}
                  quote={quote}
                  index={index}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="empty-state">
                No thoughts match your search in this category.
              </p>
            )}
            {visibleCount < filtered.length && (
              <button
                className="load-more"
                type="button"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(count + 10, filtered.length)
                  )
                }
              >
                Load more <span aria-hidden="true">↓</span>
                <small>
                  {loaded.length} of {filtered.length}
                </small>
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

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
    <div className="activity-chart">
      {hasData ? (
        <>
          <svg
            viewBox="0 0 600 180"
            role="img"
            aria-label="Your saved thoughts over the last seven days"
          >
            <polyline
              points={points}
              fill="none"
              stroke="var(--orange)"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {counts.map((count, i) => (
              <circle
                key={i}
                cx={i * 100}
                cy={160 - (count / max) * 125}
                r="5"
                fill="var(--orange)"
              />
            ))}
          </svg>
          <div className="chart-months">
            {days.map((day) => (
              <span key={day.toISOString()}>
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="empty-state">
          Writing activity will appear here once you save a thought with a
          date.
        </p>
      )}
    </div>
  );
}

function HomePage({
  userQuotes,
  onAdd,
  onUpdate,
  onDelete,
  onToggleFavorite,
  onImport,
}) {
  const today = new Date();
  const todayCount = userQuotes.filter(
    (item) =>
      item.createdAt &&
      new Date(item.createdAt).toDateString() === today.toDateString()
  ).length;
  const words = userQuotes.reduce(
    (sum, item) => sum + item.text.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const favCount = userQuotes.filter(
    (item) => item.personal && item.favorite
  ).length;

  const orderedThoughts = [...userQuotes].sort(
    (a, b) =>
      (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0)
  );

  return (
    <>
      <main className="dashboard-shell">
        <section className="dashboard-heading">
          <div className="dashboard-welcome">
            <p className="eyebrow">
              <span className="eyebrow-dot"></span>Your little corner of the
              world
            </p>
            <h1>
              A place for
              <br />
              <em>the in-between.</em>
            </h1>
            <p className="dashboard-intro">
              A soft landing for passing thoughts, big feelings, and all the
              little things you want to remember.
            </p>
            <a className="hero-write-link" href="#write">
              Put a thought into words <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="dream-illustration" aria-hidden="true">
            <div className="dream-sun"></div>
            <div className="dream-orbit dream-orbit-one"></div>
            <div className="dream-orbit dream-orbit-two"></div>
            <span className="dream-star dream-star-one">✳</span>
            <span className="dream-star dream-star-two">✦</span>
            <div className="dream-note">
              a thought
              <br />
              in bloom
            </div>
          </div>
          <div className="dashboard-date">
            <span>Today, at your own pace</span>
            <strong>
              {today.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </strong>
          </div>
        </section>

        <section className="dashboard-kpis" aria-label="Thought metrics">
          <article className="metric-card">
            <span>Personal thoughts</span>
            <strong>{userQuotes.length}</strong>
            <small>Your words, kept close</small>
            <div className="metric-line metric-line-orange"></div>
          </article>
          <article className="metric-card">
            <span>Idea shelves</span>
            <strong>{Object.keys(quoteCategories).length - 1}</strong>
            <small>Places to explore</small>
            <div className="metric-line metric-line-blue"></div>
          </article>
          <article className="metric-card">
            <span>Words written</span>
            <strong>{words.toLocaleString()}</strong>
            <small>Across your saved thoughts</small>
            <div className="metric-line metric-line-green"></div>
          </article>
          <article className="metric-card metric-card-dark">
            <span>Starred favorites</span>
            <strong>{favCount}</strong>
            <small>{todayCount} thoughts saved today</small>
            <div className="mood-orbit"></div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-panel forecast-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">Your recent pages</span>
                <h2>Writing rhythm</h2>
              </div>
              <span className="panel-pill">Last 7 days</span>
            </div>
            <ActivityChart thoughts={userQuotes} />
          </article>
          <article className="dashboard-panel channel-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">A shelf to explore</span>
                <h2>Ideas &amp; feelings</h2>
              </div>
              <span className="panel-pill panel-pill-green">
                {Object.keys(quoteCategories).length - 1} shelves
              </span>
            </div>
            <p className="explore-copy">
              Browse{" "}
              {Object.keys(quoteCategories)
                .filter((x) => x !== "My writing")
                .slice(0, 5)
                .join(", ")}
              , and find a thought that meets you where you are.
            </p>
            <a className="panel-link" href="/thoughts">
              Explore the shelves ↗
            </a>
          </article>
        </section>

        <section id="insights" className="dashboard-panel insights-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">Your personal collection</span>
              <h2>Words worth keeping</h2>
            </div>
            <a className="panel-link" href="/thoughts">
              Open writing library ↗
            </a>
          </div>
          <BackupBar thoughts={userQuotes} onImport={onImport} />
          <div className="dashboard-writing-layout">
            <div
              className="dashboard-writing-list"
              aria-label="All saved personal writings"
            >
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
                <p className="empty-state">
                  Your writing will appear here as you save it.
                </p>
              )}
            </div>
            <ThoughtForm onAdd={onAdd} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="brand-mark">D</span>
        <div>
          <strong>Day Dreamer</strong>
          <span>Words worth keeping.</span>
        </div>
      </div>
      <p className="footer-message">Keep a little room for wonder.</p>
      <div className="footer-links">
        <a href="/thoughts">Thoughts ↗</a>
        <a href="#root">Back to top ↑</a>
      </div>
      <small className="footer-copyright">© 2026 Day Dreamer</small>
    </footer>
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
      window.alert(
        "This browser could not delete the thought from saved storage. Please try again."
      );
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
        mood: typeof item.mood === "string" ? item.mood : "",
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

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return undefined;
    let activeSurface = null;
    const clearSurface = () => {
      activeSurface?.classList.remove("cursor-follow-zoom");
      activeSurface = null;
    };
    const handlePointerMove = (event) => {
      const surface =
        event.target instanceof Element
          ? event.target.closest(
              ".quote-card, .metric-card, .insight-card, .dashboard-panel, .thought-form"
            )
          : null;
      if (!surface) {
        clearSurface();
        return;
      }
      if (activeSurface !== surface) {
        clearSurface();
        activeSurface = surface;
      }
      const bounds = surface.getBoundingClientRect();
      surface.style.setProperty(
        "--zoom-origin-x",
        `${Math.max(
          0,
          Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)
        )}%`
      );
      surface.style.setProperty(
        "--zoom-origin-y",
        `${Math.max(
          0,
          Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)
        )}%`
      );
      surface.classList.add("cursor-follow-zoom");
    };
    const handlePointerOut = (event) => {
      if (!event.relatedTarget) clearSurface();
    };
    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("pointerout", handlePointerOut);
    return () => {
      clearSurface();
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  return (
    <>
      <Header />
      {path === "/thoughts" ? (
        <>
          <main>
            <QuoteLibrary
              userQuotes={userQuotes}
              onAdd={addThought}
              onUpdate={updateThought}
              onDelete={deleteThought}
              onToggleFavorite={toggleFavorite}
              onImport={importThoughts}
            />
          </main>
          <Footer />
        </>
      ) : (
        <HomePage
          userQuotes={userQuotes}
          onAdd={addThought}
          onUpdate={updateThought}
          onDelete={deleteThought}
          onToggleFavorite={toggleFavorite}
          onImport={importThoughts}
        />
      )}
    </>
  );
}

document.title = "Day Dreamer — A Personal Space for Thoughts & Feelings";
createRoot(document.getElementById("root")).render(<App />);
