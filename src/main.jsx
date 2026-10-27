import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import { quoteCategories } from "./quoteData";

const STORAGE_KEY = "northstar-user-quotes";
const THEME_KEY = "northstar-theme";
const legacyWriting = quoteCategories["My writing"];
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `thought-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const readStorage = (key) => { try { return window.localStorage.getItem(key); } catch { return null; } };
function normalizeThoughts(raw) {
  if (!Array.isArray(raw)) return legacyWriting.map((item, index) => ({ ...item, id: `legacy-seed-${index}`, category: "My writing", personal: true }));
  const used = new Set();
  const saved = raw.filter((item) => item && typeof item === "object" && typeof item.title === "string" && typeof item.text === "string")
    .map((item) => {
      let id = typeof item.id === "string" && item.id ? item.id : makeId();
      if (used.has(id)) id = makeId();
      used.add(id);
      return { ...item, id, category: "My writing", note: typeof item.note === "string" ? item.note : "", personal: true,
        ...(typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt)) ? { createdAt: item.createdAt } : {}) };
    });
  if (!saved.some((item) => item.title === "Stupid Cupid")) {
    const cupid = legacyWriting[0];
    saved.unshift({ ...cupid, id: "legacy-stupid-cupid", category: "My writing", personal: false });
  }
  return saved;
}
function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = readStorage(THEME_KEY);
    return saved === "dark" || (saved !== "light" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  });
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    try { window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light"); } catch { /* Theme still works for this session. */ }
  }, [isDark]);
  return <header className="site-header"><a className="brand" href="/" aria-label="Day Dreamer home" onClick={() => setIsOpen(false)}><span className="brand-mark">D</span><span>Day Dreamer</span></a>
    <button className="menu-toggle" type="button" aria-expanded={isOpen} aria-controls="site-nav" aria-label="Toggle navigation" onClick={() => setIsOpen((open) => !open)}><span></span><span></span><span></span></button>
    <button className="theme-toggle" type="button" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={isDark} onClick={() => setIsDark((dark) => !dark)}><span aria-hidden="true">{isDark ? "☀" : "◐"}</span><span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span></button>
    <nav id="site-nav" className={`site-nav${isOpen ? " is-open" : ""}`} aria-label="Main navigation"><a href="/#write" onClick={() => setIsOpen(false)}>My writing</a><a className="nav-cta" href="/thoughts" onClick={() => setIsOpen(false)}>Explore thoughts <span aria-hidden="true">↗</span></a></nav>
  </header>;
}
function ThoughtForm({ onAdd, onUpdate, thought, onCancel }) {
  const [title, setTitle] = useState(thought?.title ?? "");
  const [text, setText] = useState(thought?.text ?? "");
  const [note, setNote] = useState(thought?.note ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setTitle(thought?.title ?? ""); setText(thought?.text ?? ""); setNote(thought?.note ?? ""); setMessage(""); setError(""); }, [thought]);
  const handleSubmit = (event) => {
    event.preventDefault(); if (saving) return;
    const cleanTitle = title.trim(); const cleanText = text.trim();
    if (!cleanTitle || !cleanText) { setError("Add a title and your thought before saving."); return; }
    setSaving(true); setError("");
    const result = thought ? onUpdate({ ...thought, title: cleanTitle, text: cleanText, note: note.trim(), updatedAt: new Date().toISOString() }) : onAdd({ id: makeId(), category: "My writing", title: cleanTitle, text: cleanText, note: note.trim(), createdAt: new Date().toISOString(), personal: true });
    setSaving(false);
    if (!result.ok) { setError("This browser could not save your thought. Check storage space or browser privacy settings, then try again."); return; }
    if (!thought) { setTitle(""); setText(""); setNote(""); setMessage("Your thought is now on the page."); } else onCancel?.();
  };
  return <form id={thought ? undefined : "write"} className="thought-form" onSubmit={handleSubmit} noValidate>
    <div className="thought-form-heading"><div><span className="panel-kicker">{thought ? "Make an adjustment" : "Write something"}</span><h2>{thought ? "Edit your thought." : "Leave a thought here."}</h2></div><span className="insight-avatar insight-avatar-green" aria-hidden="true">{thought ? "✎" : "+"}</span></div>
    <label htmlFor={thought ? `title-${thought.id}` : "thought-title"}>Title<input id={thought ? `title-${thought.id}` : "thought-title"} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a name" required maxLength={160} /></label>
    <label htmlFor={thought ? `text-${thought.id}` : "thought-text"}>Your thought<textarea id={thought ? `text-${thought.id}` : "thought-text"} value={text} onChange={(event) => setText(event.target.value)} placeholder="What is on your mind?" rows="4" required /></label>
    <label htmlFor={thought ? `note-${thought.id}` : "thought-note"}>Small note <span>(optional)</span><input id={thought ? `note-${thought.id}` : "thought-note"} value={note} onChange={(event) => setNote(event.target.value)} placeholder="A little context" /></label>
    {error && <small className="form-error" role="alert">{error}</small>}
    <div className="form-actions"><button className="load-more thought-submit" type="submit" disabled={saving}>{thought ? "Save changes" : "Save thought"} <span aria-hidden="true">↗</span></button>{thought && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}</div>
    {message && <small className="form-success" role="status">{message}</small>}<small className="form-note">Saved in this browser only. Your writing stays on this device.</small>
  </form>;
}
function QuoteCard({ quote, index, onUpdate, onDelete }) {
  const [isOpen, setIsOpen] = useState(false); const [editing, setEditing] = useState(false);
  const isPersonal = quote.personal === true;
  if (editing) return <ThoughtForm thought={quote} onUpdate={onUpdate} onCancel={() => setEditing(false)} />;
  return <article className={`quote-card${isPersonal ? " personal-thought-card" : ""}${index === 0 ? " quote-card-featured" : ""}${isOpen ? " is-open" : ""}`}>
    <button className="quote-card-trigger" type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}><span className="quote-mark" aria-hidden="true">“</span><span className="quote-title">{quote.title}</span><span className="quote-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span></button>
    {isOpen && <div className="quote-details"><blockquote>{quote.text}</blockquote>{quote.note && <cite>— {quote.note}</cite>}{isPersonal && <div className="card-actions"><button type="button" className="secondary-button" onClick={() => setEditing(true)}>Edit</button><button type="button" className="secondary-button danger-button" onClick={() => { if (window.confirm("Delete this thought? This cannot be undone.")) onDelete(quote.id); }}>Delete</button></div>}</div>}
  </article>;
}
function QuoteLibrary({ userQuotes, onAdd, onUpdate, onDelete }) {
  const [activeCategory, setActiveCategory] = useState("My writing"); const [visibleCount, setVisibleCount] = useState(10); const [search, setSearch] = useState("");
  const source = activeCategory === "My writing" ? userQuotes : (quoteCategories[activeCategory] ?? []);
  const filtered = useMemo(() => { const needle = search.trim().toLocaleLowerCase(); return needle ? source.filter((item) => `${item.title} ${item.text} ${item.note ?? ""}`.toLocaleLowerCase().includes(needle)) : source; }, [source, search]);
  const loaded = filtered.slice(0, visibleCount);
  const chooseCategory = (category) => { setActiveCategory(category); setVisibleCount(10); };
  return <section className="section thoughts-page"><div className="thoughts-page-heading"><a className="text-link" href="/">← Back to home</a><p className="eyebrow">A private shelf of words</p><h1>Thoughts worth<br/><em>returning to.</em></h1><p className="hero-text">Notes, observations, and ideas collected in one place. Your writing stays saved in this browser.</p></div>
    <div className="thoughts-content"><p className="library-label">Your writing</p><div className="quote-tabs" role="tablist" aria-label="Thought categories"><button className={`quote-tab${activeCategory === "My writing" ? " is-active" : ""}`} type="button" role="tab" aria-selected={activeCategory === "My writing"} onClick={() => chooseCategory("My writing")}>My writing<span>{userQuotes.length}</span></button></div>
      <label className="search-label" htmlFor="thought-search">Search titles, writing, or notes</label><div className="search-row"><input id="thought-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(10); }} placeholder="Find a thought…" />{(search || activeCategory !== "My writing") && <button type="button" className="secondary-button" onClick={() => { setSearch(""); chooseCategory("My writing"); }}>Clear filters</button>}</div>
      {activeCategory === "My writing" && <><div className="quote-list">{loaded.map((quote, index) => <QuoteCard key={quote.id} quote={quote} index={index} onUpdate={onUpdate} onDelete={onDelete} />)}</div>{filtered.length === 0 && <p className="empty-state">{userQuotes.length ? "No thoughts match your search." : "Your writing will find a home here. Start with one small thought."}</p>}{visibleCount < filtered.length && <button className="load-more" type="button" onClick={() => setVisibleCount((count) => Math.min(count + 10, filtered.length))}>Load more <span aria-hidden="true">↓</span><small>{loaded.length} of {filtered.length}</small></button>}<ThoughtForm onAdd={onAdd} /></>}
      <p className="library-label library-label-emotions">Emotions &amp; ideas</p><div className="quote-tabs" role="tablist" aria-label="Emotion and idea categories">{Object.keys(quoteCategories).filter((category) => category !== "My writing").map((category) => <button key={category} className={`quote-tab${activeCategory === category ? " is-active" : ""}`} type="button" role="tab" aria-selected={activeCategory === category} onClick={() => chooseCategory(category)}>{category}<span>{quoteCategories[category].length}</span></button>)}</div>
      {activeCategory !== "My writing" && <><p className="active-filter">Exploring: <strong>{activeCategory}</strong></p><div className="quote-list">{loaded.map((quote, index) => <QuoteCard key={`${activeCategory}-${index}`} quote={quote} index={index} />)}</div>{filtered.length === 0 && <p className="empty-state">No thoughts match your search in this category.</p>}{visibleCount < filtered.length && <button className="load-more" type="button" onClick={() => setVisibleCount((count) => Math.min(count + 10, filtered.length))}>Load more <span aria-hidden="true">↓</span><small>{loaded.length} of {filtered.length}</small></button>}</>}
    </div></section>;
}
function ActivityChart({ thoughts }) {
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0,0,0,0); date.setDate(date.getDate() - (6-index)); return date; });
  const counts = days.map((day) => thoughts.filter((item) => item.createdAt && new Date(item.createdAt).toDateString() === day.toDateString()).length);
  const max = Math.max(1, ...counts); const points = counts.map((count, i) => `${i * 100},${160 - count / max * 125}`).join(" "); const hasData = counts.some(Boolean);
  return <div className="activity-chart">{hasData ? <><svg viewBox="0 0 600 180" role="img" aria-label="Your saved thoughts over the last seven days"><polyline points={points} fill="none" stroke="var(--orange)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />{counts.map((count, i) => <circle key={i} cx={i*100} cy={160-count/max*125} r="5" fill="var(--orange)" />)}</svg><div className="chart-months">{days.map((day) => <span key={day.toISOString()}>{day.toLocaleDateString(undefined,{weekday:"short"})}</span>)}</div></> : <p className="empty-state">Writing activity will appear here once you save a thought with a date.</p>}</div>;
}
function HomePage({ userQuotes, onAdd }) {
  const today = new Date(); const todayCount = userQuotes.filter((item) => item.createdAt && new Date(item.createdAt).toDateString() === today.toDateString()).length;
  const words = userQuotes.reduce((sum, item) => sum + item.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const newest = [...userQuotes].sort((a,b) => (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0))[0];
  return <><main className="dashboard-shell"><section className="dashboard-topbar"><div className="dashboard-brand"><span className="brand-mark">D</span><strong>Day Dreamer</strong></div><nav className="dashboard-nav" aria-label="Dashboard navigation"><a className="is-active" href="/">Dashboard</a><a href="/thoughts">Thoughts</a><a href="#insights">Insights</a><a href="#write">Write</a></nav><div className="dashboard-actions"><span className="status-dot"></span><span>Just for you</span></div></section>
    <section className="dashboard-heading"><div><p className="eyebrow"><span className="eyebrow-dot"></span>A personal dashboard</p><h1>Thoughts, feelings<br/><em>&amp; everything between.</em></h1></div><div className="dashboard-date">A quiet place to check in<br/><strong>{today.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</strong></div></section>
    <section className="dashboard-kpis" aria-label="Thought metrics"><article className="metric-card"><span>Personal thoughts</span><strong>{userQuotes.length}</strong><small>Your words, kept close</small><div className="metric-line metric-line-orange"></div></article><article className="metric-card"><span>Idea shelves</span><strong>{Object.keys(quoteCategories).length - 1}</strong><small>Places to explore</small><div className="metric-line metric-line-blue"></div></article><article className="metric-card"><span>Words written</span><strong>{words.toLocaleString()}</strong><small>Across your saved thoughts</small><div className="metric-line metric-line-green"></div></article><article className="metric-card metric-card-dark"><span>Thoughts today</span><strong>{todayCount}</strong><small>Saved today</small><div className="mood-orbit"></div></article></section>
    <section className="dashboard-grid"><article className="dashboard-panel forecast-panel"><div className="panel-heading"><div><span className="panel-kicker">Your recent pages</span><h2>Writing rhythm</h2></div><span className="panel-pill">Last 7 days</span></div><ActivityChart thoughts={userQuotes} /></article><article className="dashboard-panel channel-panel"><div className="panel-heading"><div><span className="panel-kicker">A shelf to explore</span><h2>Ideas &amp; feelings</h2></div><span className="panel-pill panel-pill-green">{Object.keys(quoteCategories).length - 1} shelves</span></div><p className="explore-copy">Browse {Object.keys(quoteCategories).filter((x)=>x!=="My writing").join(", ")} and find a thought that meets you where you are.</p><a className="panel-link" href="/thoughts">Explore the shelves ↗</a></article></section>
    <section id="insights" className="dashboard-panel insights-panel"><div className="panel-heading"><div><span className="panel-kicker">Little things to revisit</span><h2>Words worth keeping</h2></div><a className="panel-link" href="/thoughts">Open your writing ↗</a></div><div className="insight-grid">{newest ? <a className="insight-card insight-card-featured" href="/thoughts"><div className="insight-top"><span className="insight-avatar">✦</span><strong>{newest.title}</strong><span className="insight-score">Mine</span></div><p>{newest.text}</p><span className="insight-action">Read my entry ↗</span></a> : <article className="insight-card insight-card-muted"><div className="insight-top"><span className="insight-avatar">✦</span><strong>Your first saved thought</strong></div><p>A small note is enough to begin. It will be waiting here when you return.</p><a className="insight-action" href="#write">Write a thought ↓</a></article>}<ThoughtForm onAdd={onAdd} /></div></section></main><Footer /></>;
}
function Footer() { return <footer className="site-footer"><div className="footer-brand"><span className="brand-mark">D</span><div><strong>Day Dreamer</strong><span>Words worth keeping.</span></div></div><p className="footer-message">Keep a little room for wonder.</p><div className="footer-links"><a href="/thoughts">Thoughts ↗</a><a href="#root">Back to top ↑</a></div><small className="footer-copyright">© 2026 Day Dreamer</small></footer>; }
function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [userQuotes, setUserQuotes] = useState(() => { const stored = readStorage(STORAGE_KEY); if (!stored) return normalizeThoughts(null); try { return normalizeThoughts(JSON.parse(stored)); } catch { return normalizeThoughts(null); } });
  const persist = (next) => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.filter((item) => item.personal))); setUserQuotes(next); return { ok: true }; } catch { return { ok: false }; } };
  const addThought = (thought) => persist([...userQuotes, thought]);
  const updateThought = (thought) => persist(userQuotes.map((item) => item.id === thought.id ? thought : item));
  const deleteThought = (id) => { const next = userQuotes.filter((item) => item.id !== id); try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.filter((item) => item.personal))); setUserQuotes(next); } catch { window.alert("This browser could not delete the thought from saved storage. Please try again."); } };
  useEffect(() => { const handlePopState = () => setPath(window.location.pathname); const handleClick = (event) => { const link = event.target.closest("a"); if (!link || link.origin !== window.location.origin || !["/", "/thoughts"].includes(link.pathname) || link.hash) return; event.preventDefault(); if (link.pathname !== window.location.pathname) { window.history.pushState({}, "", link.pathname); setPath(link.pathname); window.scrollTo(0,0); } }; window.addEventListener("popstate", handlePopState); document.addEventListener("click", handleClick); return () => { window.removeEventListener("popstate", handlePopState); document.removeEventListener("click", handleClick); }; }, []);
  return <><Header />{path === "/thoughts" ? <><main><QuoteLibrary userQuotes={userQuotes} onAdd={addThought} onUpdate={updateThought} onDelete={deleteThought} /></main><Footer /></> : <HomePage userQuotes={userQuotes} onAdd={addThought} />}</>;
}
document.title = "Day Dreamer — A Personal Space for Thoughts & Feelings";
createRoot(document.getElementById("root")).render(<App />);
