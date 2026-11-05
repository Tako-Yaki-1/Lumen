import { useState, useEffect } from "react";
import { runTool } from "./api.js";
import Quiz from "./components/Quiz.jsx";
import Flashcards from "./components/Flashcards.jsx";
import { readFile } from "./readFile.js";

const TOOLS = [
  { id: "summarize", icon: "✂️", label: "Summarize", hint: "Paste your notes or an article and get the key ideas fast." },
  { id: "reviewer", icon: "📚", label: "Reviewer", hint: "Turn your notes into a study reviewer: key terms, main points, tips and likely exam questions." },
  { id: "explain", icon: "💡", label: "Explain simply", hint: "Type a topic or paste a confusing passage and get a simple explanation." },
  { id: "quiz", icon: "🎯", label: "Quiz maker", hint: "Paste your study notes and Lumen will turn them into a practice quiz." },
  { id: "flashcards", icon: "🃏", label: "Flashcards", hint: "Turn your notes into flip cards you can shuffle and practice with." },
];

const EXAMPLE =
  "Photosynthesis is the process by which plants, algae and some bacteria convert light energy into chemical energy. It happens in the chloroplasts, where chlorophyll absorbs sunlight. The light reactions produce ATP and NADPH and release oxygen from water. The Calvin cycle then uses ATP and NADPH to turn carbon dioxide into glucose.";

// Tiny markdown renderer: headings, bullet lists, **bold**
function inline(s) {
  return s.split(/\*\*(.+?)\*\*/g).map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}

function Markdown({ text }) {
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) {
      out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
      list = [];
    }
  };
  text.split("\n").forEach((line) => {
    const t = line.trim();
    if (/^[-*•]\s+/.test(t)) return list.push(t.replace(/^[-*•]\s+/, ""));
    flush();
    if (!t) return;
    const h = t.match(/^#{1,4}\s+(.*)/);
    out.push(h ? <h4 key={out.length}>{inline(h[1])}</h4> : <p key={out.length}>{inline(t)}</p>);
  });
  flush();
  return <div className="output md">{out}</div>;
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem("lumen-history")) || [];
  } catch {
    return [];
  }
}

export default function App() {
  const [tool, setTool] = useState("summarize");
  const [text, setText] = useState("");
  const [length, setLength] = useState("medium");
  const [level, setLevel] = useState("highschool");
  const [count, setCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reading, setReading] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [theme, setTheme] = useState(() => localStorage.getItem("lumen-theme") || "dark");

  const current = TOOLS.find((t) => t.id === tool);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("lumen-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("lumen-history", JSON.stringify(history));
  }, [history]);

  function switchTool(id) {
    setTool(id);
    setResult(null);
    setError("");
  }

  async function run() {
    if (!text.trim()) return setError("Please enter some text first.");
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const raw = await runTool(tool, text, { length, level, count });
      let out;
      if (tool === "quiz" || tool === "flashcards") {
        try {
          out = JSON.parse(raw.replace(/```json|```/g, "").trim());
        } catch {
          throw new Error("Couldn't read the quiz. Please try again.");
        }
        if (!Array.isArray(out.questions || out.cards) || !(out.questions || out.cards).length) throw new Error("Couldn't read the quiz. Please try again.");
      } else {
        out = raw.trim();
      }
      setResult(out);
      const entry = { id: Date.now(), tool, text: text.slice(0, 3000), result: out };
      setHistory((h) => [entry, ...h].slice(0, 8));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openEntry(e) {
    setTool(e.tool);
    setText(e.text);
    setResult(e.result);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function upload(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    setReading(true);
    try {
      const t = await readFile(f);
      setText(t.trim().slice(0, 20000));
    } catch (err) {
      setError(err.message || "Couldn't read that file.");
    } finally {
      setReading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy. Select the text and copy it manually.");
    }
  }

  return (
    <>
      <header className="hero">
        <div className="glow" aria-hidden="true" />
        <nav className="nav">
          <span className="logo">
            Lumen<span className="dot">.</span>
          </span>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </nav>
        <span className="badge">AI study helper</span>
        <h1>
          Shed light on <em>hard topics.</em>
        </h1>
        <p className="tagline">Paste your notes and turn them into summaries, reviewers, simple explanations, or practice quizzes.</p>
      </header>

      <main className="app">
        <div className="tabs" role="tablist">
          {TOOLS.map((t) => (
            <button key={t.id} role="tab" className={"tab" + (t.id === tool ? " active" : "")} onClick={() => switchTool(t.id)}>
              <span className="tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <section className="panel">
          <p className="hint">{current.hint}</p>

          <textarea rows="8" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your text or type a topic here..." />

          <div className="meta">
            <span>{words} words</span>
            <span>
              <label className="link">Upload PDF / Word<input type="file" accept=".pdf,.docx" hidden onChange={upload} /></label>
              <button className="link" onClick={() => setText(EXAMPLE)}>Try an example</button>
              {text && <button className="link" onClick={() => setText("")}>Clear</button>}
            </span>
          </div>

          <div className="controls">
            {tool === "summarize" && (
              <label className="opt">
                Length
                <select value={length} onChange={(e) => setLength(e.target.value)}>
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Detailed</option>
                </select>
              </label>
            )}
            {tool === "explain" && (
              <label className="opt">
                Explain like I'm
                <select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="kid">8 years old</option>
                  <option value="highschool">in high school</option>
                  <option value="college">in college</option>
                </select>
              </label>
            )}
            {tool === "quiz" && (
              <label className="opt">
                Questions
                <select value={count} onChange={(e) => setCount(e.target.value)}>
                  {["3", "5", "8", "10"].map((n) => <option key={n}>{n}</option>)}
                </select>
              </label>
            )}
            <button className="run" onClick={run} disabled={loading}>
              {loading ? "Thinking..." : "Illuminate ✨"}
            </button>
          </div>

          <div className={"status" + (error ? " error" : "")} role="status" aria-live="polite">
            {loading ? "Lumen is thinking..." : reading ? "Reading your file..." : error}
          </div>

          {result && tool !== "quiz" && tool !== "flashcards" && (
            <>
              <Markdown text={result} />
              <button className="link copy" onClick={copy}>{copied ? "Copied ✓" : "Copy result"}</button>
            </>
          )}
          {result && tool === "quiz" && <Quiz key={JSON.stringify(result)} data={result} />}
          {result && tool === "flashcards" && <Flashcards key={JSON.stringify(result)} data={result} />}
        </section>

        {history.length > 0 && (
          <section className="history">
            <div className="history-head">
              <h2>Recent</h2>
              <button className="link" onClick={() => setHistory([])}>Clear history</button>
            </div>
            {history.map((e) => (
              <button key={e.id} className="history-item" onClick={() => openEntry(e)}>
                <span>{TOOLS.find((t) => t.id === e.tool)?.icon}</span>
                <span className="h-text">{e.text}</span>
              </button>
            ))}
          </section>
        )}
      </main>

      <footer>Made with Lumen · BSIT 3B</footer>
    </>
  );
}
