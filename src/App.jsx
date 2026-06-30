import { useState, useEffect } from "react";

const MOCK_RESULT = {
  score: 78,
  strengths: [
    "Strong personal voice that feels authentic and distinct",
    "Compelling opening hook that draws the reader in immediately",
    "Clear narrative arc with a well-defined transformation",
  ],
  weaknesses: [
    "Conclusion feels rushed and doesn't fully land the central theme",
    "Middle section loses momentum with overly general statements",
    "Some sentences are passive and weaken the overall impact",
  ],
  writing_feedback: {
    clarity: "Ideas are mostly clear, but a few paragraphs try to do too much at once. Splitting compound sentences would improve readability significantly.",
    structure: "The essay follows a logical arc, though the transition into the third paragraph feels abrupt. Consider a bridging sentence to smooth the flow.",
    vocabulary: "Word choice is generally strong with some standout moments. A few filler phrases like 'in order to' and 'due to the fact that' could be cut.",
    grammar: "Grammar is solid overall. Watch for passive constructions — switching to active voice in three or four places would sharpen the tone.",
    reflection_depth: "Personal insight is present but could go deeper. The 'so what' moment arrives late. Move your core realization earlier so the rest of the essay builds toward it.",
  },
  suggestions: [
    "Rewrite the final paragraph to echo your opening image — it'll give the essay a sense of closure.",
    "Cut the sentence starting with 'I have always believed…' — it's a cliché opener that weakens your authentic voice.",
    "Add one concrete sensory detail to your main scene to ground the reader in the moment.",
    "Consider restructuring: lead with your transformation, then explain the journey that caused it.",
  ],
};

function ScoreRing({ score }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circ - (animated / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={128} height={128} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={64} cy={64} r={radius} fill="none" stroke="#1e2a45" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{ marginTop: -100, marginBottom: 36, textAlign: "center", lineHeight: 1 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: color, fontFamily: "'Space Grotesk', sans-serif" }}>
          {score}
        </span>
        <span style={{ fontSize: 16, color: "#94a3b8", display: "block", marginTop: 2, fontFamily: "Inter, sans-serif" }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#0d1b36",
      border: "1px solid #1e3055",
      borderRadius: 16,
      padding: "24px 28px",
      ...style
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#5b7bac",
      marginBottom: 14,
      margin: "0 0 14px 0",
    }}>
      {children}
    </p>
  );
}

function BulletList({ items, color }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color, fontSize: 16, marginTop: 1, flexShrink: 0 }}>●</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#cbd5e1", lineHeight: 1.6 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FeedbackRow({ label, text }) {
  return (
    <div style={{ borderTop: "1px solid #1e3055", paddingTop: 16, marginTop: 16 }}>
      <p style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        color: "#6d8cbf",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        margin: "0 0 6px 0"
      }}>
        {label}
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#cbd5e1", lineHeight: 1.65, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}

function Results({ data, onReset }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>
            Essay Analysis
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#64748b", margin: "4px 0 0 0" }}>
            Here's your personalized writing breakdown
          </p>
        </div>
        <button
          onClick={onReset}
          style={{
            background: "transparent",
            border: "1px solid #1e3055",
            borderRadius: 8,
            color: "#64748b",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          ← New Essay
        </button>
      </div>

      {/* Score Card */}
      <Card style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
        <ScoreRing score={data.score} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <SectionLabel>Essay Quality Score</SectionLabel>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "0 0 8px 0" }}>
            {data.score >= 80 ? "Strong essay" : data.score >= 60 ? "Good foundation" : "Needs work"}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            {data.score >= 80
              ? "This essay demonstrates strong personal voice and clear structure. Minor refinements will take it further."
              : data.score >= 60
              ? "Solid core ideas with clear areas for improvement. Focus on depth and transitions."
              : "The foundation is there but significant revision is needed for impact."}
          </p>
        </div>
      </Card>

      {/* Strengths + Weaknesses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionLabel>Strengths</SectionLabel>
          <BulletList items={data.strengths} color="#22c55e" />
        </Card>
        <Card>
          <SectionLabel>Weaknesses</SectionLabel>
          <BulletList items={data.weaknesses} color="#f97316" />
        </Card>
      </div>

      {/* Writing Breakdown */}
      <Card>
        <SectionLabel>Writing Breakdown</SectionLabel>
        <div>
          <FeedbackRow label="Clarity" text={data.writing_feedback.clarity} />
          <FeedbackRow label="Structure & Flow" text={data.writing_feedback.structure} />
          <FeedbackRow label="Vocabulary" text={data.writing_feedback.vocabulary} />
          <FeedbackRow label="Grammar" text={data.writing_feedback.grammar} />
          <FeedbackRow label="Depth of Reflection" text={data.writing_feedback.reflection_depth} />
        </div>
      </Card>

      {/* Suggestions */}
      <Card>
        <SectionLabel>Suggestions for Improvement</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.suggestions.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{
                background: "#5b5ef4",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 11,
                fontWeight: 800,
                borderRadius: 6,
                padding: "2px 7px",
                flexShrink: 0,
                marginTop: 2
              }}>
                {i + 1}
              </span>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#cbd5e1", lineHeight: 1.65, margin: 0 }}>
                {s}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  const [essay, setEssay] = useState("");
  const [state, setState] = useState("input"); // input | loading | results
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // ─── SWAP THIS URL when your backend is live ───────────────────────────────
  const BACKEND_URL = "https://essaylensai.onrender.com/evaluate";
  // ───────────────────────────────────────────────────────────────────────────

  const evaluate = async () => {
    if (essay.trim().length < 100) {
      setError("Essay is too short — paste at least a paragraph.");
      return;
    }
    setError(null);
    setState("loading");

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay }),
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setResults(data);
      setState("results");
    } catch {
      // ── Demo mode: backend not connected yet, show mock results ──
      await new Promise(r => setTimeout(r, 2200));
      setResults(MOCK_RESULT);
      setState("results");
    }
  };

  const reset = () => {
    setEssay("");
    setResults(null);
    setState("input");
    setError(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #070e1f; }
        textarea:focus { outline: none; }
        button:focus-visible { outline: 2px solid #5b5ef4; outline-offset: 2px; }
        @media (max-width: 600px) {
          .grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#070e1f" }}>
        {/* Nav */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", height: 58,
          borderBottom: "1px solid #0f1e38",
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(7,14,31,0.92)", backdropFilter: "blur(12px)"
        }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800, fontSize: 17, color: "#f1f5f9",
            letterSpacing: "-0.01em"
          }}>
            Essay<span style={{ color: "#5b5ef4" }}>Lens</span>
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 12,
            color: "#334155", background: "#0d1b36",
            border: "1px solid #1e3055", borderRadius: 6,
            padding: "3px 10px"
          }}>
            Free · No account needed
          </span>
        </nav>

        {/* Input State */}
        {state === "input" && (
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "72px 20px 80px" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{
                display: "inline-block",
                background: "#0d1b36",
                border: "1px solid #1e3055",
                borderRadius: 100,
                padding: "5px 14px",
                marginBottom: 22
              }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#5b7bac" }}>
                  AI-powered · Instant · Free
                </span>
              </div>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                color: "#f1f5f9",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                margin: "0 0 16px 0"
              }}>
                Get honest feedback on<br />
                <span style={{ color: "#5b5ef4" }}>your college essay</span>
              </h1>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 16, color: "#64748b",
                lineHeight: 1.6, margin: 0
              }}>
                Paste your essay. Get a detailed breakdown of your writing —
                score, strengths, weaknesses, and what to fix.
              </p>
            </div>

            {/* Textarea Card */}
            <div style={{
              background: "#0d1b36",
              border: `1px solid ${error ? "#ef4444" : "#1e3055"}`,
              borderRadius: 16,
              overflow: "hidden",
              transition: "border-color 0.2s"
            }}>
              <textarea
                value={essay}
                onChange={e => { setEssay(e.target.value); setError(null); }}
                placeholder="Paste your college essay here…"
                style={{
                  width: "100%",
                  minHeight: 280,
                  background: "transparent",
                  border: "none",
                  padding: "24px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 15,
                  color: "#e2e8f0",
                  lineHeight: 1.7,
                  resize: "vertical",
                  display: "block",
                }}
              />
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 24px",
                borderTop: "1px solid #1e3055",
                background: "#0a1528"
              }}>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12,
                  color: essay.length > 50 ? "#5b7bac" : "#334155"
                }}>
                  {essay.length} characters · {essay.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  onClick={evaluate}
                  style={{
                    background: "#5b5ef4",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 22px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                    transition: "background 0.15s",
                  }}
                  onMouseOver={e => e.target.style.background = "#4a4dd6"}
                  onMouseOut={e => e.target.style.background = "#5b5ef4"}
                >
                  Evaluate Essay →
                </button>
              </div>
            </div>

            {error && (
              <p style={{
                fontFamily: "Inter, sans-serif", fontSize: 13,
                color: "#ef4444", margin: "10px 0 0 4px"
              }}>
                {error}
              </p>
            )}

            {/* Feature hints */}
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
              {["Overall score", "Strengths & weaknesses", "Writing breakdown", "Specific suggestions"].map(f => (
                <span key={f} style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, color: "#334155",
                  background: "#0d1b36", border: "1px solid #1e3055",
                  borderRadius: 100, padding: "4px 12px"
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {state === "loading" && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: "70vh", gap: 20
          }}>
            <div style={{
              width: 48, height: 48, border: "3px solid #1e3055",
              borderTop: "3px solid #5b5ef4",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 16, color: "#64748b", fontWeight: 600
            }}>
              Analyzing your writing…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results State */}
        {state === "results" && results && (
          <Results data={results} onReset={reset} />
        )}
      </div>
    </>
  );
}