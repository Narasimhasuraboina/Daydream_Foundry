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
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot"></span> A place for thoughts</p>
            <h1>Keep the words that make you <em>feel something.</em></h1>
            <p className="hero-text">A quiet collection of personal writing, emotions, memories, and ideas worth returning to.</p>
            <div className="hero-actions"><a className="button button-primary" href="/thoughts">Explore thoughts <span aria-hidden="true">↗</span></a><a className="text-link" href="#thoughts">My writing <span aria-hidden="true">↓</span></a></div>
          </div>
          <div className="hero-art" aria-label="Abstract orange and blue geometric artwork" role="img"><div className="art-circle"></div><div className="art-block art-block-one"></div><div className="art-block art-block-two"></div><div className="art-line"></div><span className="art-label">Ideas<br />in motion</span></div>
        </section>

        <section id="thoughts" className="section thoughts">
          <div className="section-heading"><p className="eyebrow">01 / Words to keep</p><h2>Good talks.<br /><em>Better thoughts.</em></h2></div>
          <div className="thoughts-content"><p className="thoughts-intro">Your writing lives here first. Click a card to open the full collection.</p><div className="personal-card-list">{quoteCategories["My writing"].map((quote) => <a className="quote-card quote-card-featured quote-card-link" href="/thoughts" key={quote.title}><span className="quote-mark" aria-hidden="true">“</span><span className="quote-title">{quote.title}</span><span className="quote-toggle" aria-hidden="true">↗</span></a>)}</div></div>
        </section>

      </main>
      <footer className="site-footer"><span>© 2026</span><div className="footer-links"><a href="/thoughts">Thoughts</a><a href="#">Back to top ↑</a></div></footer>
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
      {path === "/thoughts" ? <><main><QuoteLibrary /></main><footer className="site-footer"><span>© 2026 Northstar Studio</span><div className="footer-links"><a href="/">Back to home ↑</a></div></footer></> : <HomePage />}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
