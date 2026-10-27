import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import { quoteCategories } from "./quoteData";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = window.localStorage.getItem("northstar-theme");
    return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    window.localStorage.setItem("northstar-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Northstar Studio home" onClick={closeMenu}>
        <span className="brand-mark">N</span>
        <span>Northstar</span>
      </a>
      <button className="menu-toggle" type="button" aria-expanded={isOpen} aria-controls="site-nav" onClick={() => setIsOpen((open) => !open)}>
        <span></span><span></span><span></span><span className="sr-only">Toggle navigation</span>
      </button>
      <button className="theme-toggle" type="button" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={isDark} onClick={() => setIsDark((dark) => !dark)}>
        <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
        <span className="theme-toggle-label">{isDark ? "Light" : "Dark"}</span>
      </button>
      <nav id="site-nav" className={`site-nav${isOpen ? " is-open" : ""}`} aria-label="Main navigation">
        <a href="#thoughts" onClick={closeMenu}>My writing</a>
        <a className="nav-cta" href="/thoughts" onClick={closeMenu}>Explore thoughts <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
  );
}

function QuoteCard({ quote, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <article className={`quote-card${index === 0 ? " quote-card-featured" : ""}${isOpen ? " is-open" : ""}`}>
      <button className="quote-card-trigger" type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
        <span className="quote-mark" aria-hidden="true">“</span>
        <span className="quote-title">{quote.title}</span>
        <span className="quote-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="quote-details">
          <blockquote>{quote.text}</blockquote>
          <cite>— {quote.note}</cite>
        </div>
      )}
    </article>
  );
}

function QuoteLibrary() {
  const [activeCategory, setActiveCategory] = useState("My writing");
  const [visibleCount, setVisibleCount] = useState(10);
  const visibleQuotes = quoteCategories[activeCategory];
  const loadedQuotes = visibleQuotes.slice(0, visibleCount);

  return (
    <section className="section thoughts-page">
      <div className="thoughts-page-heading">
        <a className="text-link" href="/">← Back to home</a>
        <p className="eyebrow">A private shelf of words</p>
        <h1>Thoughts worth<br /><em>returning to.</em></h1>
        <p className="hero-text">These are notes, observations, and ideas collected in one place. Add your own writing to <code>src/quoteData.js</code> whenever you are ready.</p>
      </div>
      <div className="thoughts-content">
        <p className="library-label">Your writing</p>
        <div className="quote-tabs" role="tablist" aria-label="Thought categories">
          <button className={`quote-tab${activeCategory === "My writing" ? " is-active" : ""}`} type="button" role="tab" aria-selected={activeCategory === "My writing"} onClick={() => { setActiveCategory("My writing"); setVisibleCount(10); }}>My writing<span>{quoteCategories["My writing"].length}</span></button>
        </div>
        {activeCategory === "My writing" && <><div className="quote-list">{loadedQuotes.map((quote, index) => <QuoteCard key={`${quote.category}-${index}`} quote={quote} index={index} />)}</div>{visibleCount < visibleQuotes.length && <button className="load-more" type="button" onClick={() => setVisibleCount((count) => Math.min(count + 10, visibleQuotes.length))}>Load more <span aria-hidden="true">↓</span><small>{visibleCount} of {visibleQuotes.length}</small></button>}</>}
        <p className="library-label library-label-emotions">Emotions &amp; ideas</p>
        <div className="quote-tabs" role="tablist" aria-label="Emotion and idea categories">
          {Object.keys(quoteCategories).filter((category) => category !== "My writing").map((category) => <button key={category} className={`quote-tab${activeCategory === category ? " is-active" : ""}`} type="button" role="tab" aria-selected={activeCategory === category} onClick={() => { setActiveCategory(category); setVisibleCount(10); }}>{category}<span>{quoteCategories[category].length}</span></button>)}
        </div>
        {activeCategory !== "My writing" && <><div className="quote-list">{loadedQuotes.map((quote, index) => <QuoteCard key={`${quote.category}-${index}`} quote={quote} index={index} />)}</div>{visibleCount < visibleQuotes.length && <button className="load-more" type="button" onClick={() => setVisibleCount((count) => Math.min(count + 10, visibleQuotes.length))}>Load more <span aria-hidden="true">↓</span><small>{visibleCount} of {visibleQuotes.length}</small></button>}</>}
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <main className="dashboard-shell">
        <section className="dashboard-topbar">
          <div className="dashboard-brand"><span className="brand-mark">N</span><strong>Northstar</strong></div>
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            <a className="is-active" href="/">Dashboard</a>
            <a href="/thoughts">Thoughts</a>
            <a href="#insights">Insights</a>
            <a href="#people">People</a>
          </nav>
          <div className="dashboard-actions"><span className="status-dot"></span><span>Live view</span><button className="dashboard-avatar" type="button" aria-label="Profile">N</button></div>
        </section>
        <section className="dashboard-heading">
          <div><p className="eyebrow"><span className="eyebrow-dot"></span> Personal intelligence</p><h1>Thoughts, feelings<br /><em>&amp; everything between.</em></h1></div>
          <div className="dashboard-date">Updated just now<br /><strong>Tuesday, 27 October 2026</strong></div>
        </section>
        <section className="dashboard-kpis" aria-label="Thought metrics">
          <article className="metric-card"><span>All thoughts</span><strong>1,501</strong><small className="metric-up">↑ 12.4%</small><div className="metric-line metric-line-orange"></div></article>
          <article className="metric-card"><span>Emotions explored</span><strong>15</strong><small className="metric-up">↑ 3 new</small><div className="metric-line metric-line-blue"></div></article>
          <article className="metric-card"><span>Personal writing</span><strong>{quoteCategories["My writing"].length}</strong><small>Keep adding yours</small><div className="metric-line metric-line-green"></div></article>
          <article className="metric-card metric-card-dark"><span>Current mood</span><strong>Curious</strong><small>Open to possibility</small><div className="mood-orbit"></div></article>
        </section>
        <section className="dashboard-grid">
          <article className="dashboard-panel forecast-panel">
            <div className="panel-heading"><div><span className="panel-kicker">Activity overview</span><h2>Feeling the flow</h2></div><span className="panel-pill">Last 30 days</span></div>
            <div className="chart-area"><div className="chart-y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart"><div className="chart-grid-lines"></div><svg viewBox="0 0 600 190" role="img" aria-label="Thought activity rising over the last 30 days"><path className="chart-fill" d="M0 160 C70 155 85 130 140 140 S210 120 260 125 S335 90 390 100 S470 60 530 72 S570 35 600 28 L600 190 L0 190 Z"></path><path className="chart-line" d="M0 160 C70 155 85 130 140 140 S210 120 260 125 S335 90 390 100 S470 60 530 72 S570 35 600 28"></path></svg><div className="chart-months"><span>Sep 28</span><span>Oct 05</span><span>Oct 12</span><span>Oct 19</span><span>Oct 27</span></div></div></div>
          </article>
          <article className="dashboard-panel channel-panel">
            <div className="panel-heading"><div><span className="panel-kicker">Emotional mix</span><h2>Where thoughts land</h2></div><span className="panel-pill panel-pill-green">Balanced</span></div>
            <div className="donut-layout"><div className="donut-chart"><div className="donut-hole">15<small>moods</small></div></div><ul className="legend"><li><i className="legend-orange"></i>Hopeful <strong>32%</strong></li><li><i className="legend-blue"></i>Thoughtful <strong>27%</strong></li><li><i className="legend-ink"></i>Happy <strong>21%</strong></li><li><i className="legend-sand"></i>Everything else <strong>20%</strong></li></ul></div>
          </article>
        </section>
        <section id="insights" className="dashboard-panel insights-panel">
          <div className="panel-heading"><div><span className="panel-kicker">Recent entries</span><h2>Worth a closer look</h2></div><a className="panel-link" href="/thoughts">View all thoughts ↗</a></div>
          <div id="people" className="insight-grid">{quoteCategories["My writing"].map((quote) => <a className="insight-card insight-card-featured" href="/thoughts" key={quote.title}><div className="insight-top"><span className="insight-avatar">SC</span><strong>{quote.title}</strong><span className="insight-score">Personal</span></div><p>{quote.text}</p><span className="insight-action">Read entry ↗</span></a>)}<a className="insight-card" href="/thoughts"><div className="insight-top"><span className="insight-avatar insight-avatar-blue">EM</span><strong>Emotional library</strong><span className="insight-score">1,500+</span></div><p>Browse the shelves of feelings, ideas, memories, and small reminders.</p><span className="insight-action">Explore thoughts ↗</span></a><a className="insight-card insight-card-muted" href="/thoughts"><div className="insight-top"><span className="insight-avatar insight-avatar-green">+</span><strong>Make room for more</strong></div><p>Your next honest sentence could be the one that changes the shape of this whole dashboard.</p><span className="insight-action">Add your writing ↗</span></a></div>
        </section>
      </main>
      <footer className="site-footer dashboard-footer"><div className="footer-brand"><span className="brand-mark">N</span><div><strong>Northstar</strong><span>Words worth keeping.</span></div></div><p className="footer-message">Keep a little room for wonder.</p><div className="footer-links"><a href="/thoughts">Thoughts ↗</a><a href="#root">Back to top ↑</a></div><small className="footer-copyright">© 2026 Northstar</small></footer>
    </>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <>
      <Header />
      {path === "/thoughts" ? <><main><QuoteLibrary /></main><footer className="site-footer"><div className="footer-brand"><span className="brand-mark">N</span><div><strong>Northstar</strong><span>Words worth keeping.</span></div></div><p className="footer-message">Keep a little room for wonder.</p><div className="footer-links"><a href="/">Home ↑</a></div><small className="footer-copyright">© 2026 Northstar</small></footer></> : <HomePage />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
