import { useState } from "react";
import axios from "axios";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from "recharts";
import { CAT_ICON, TREND_COLOR, ABC_COLOR } from "../components/Shared.jsx";

const API    = import.meta.env.VITE_API_URL || "http://localhost:8000";
const COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#6366f1","#0f172a"];

// ── Markdown → React renderer (no external library needed) ────────────────
function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <div key={i} style={{ fontSize: 15, fontWeight: 800, color: "var(--text)",
          marginBottom: 8, marginTop: elements.length > 0 ? 14 : 0 }}>
          {inlineFormat(line.replace(/^# /, ""))}
        </div>
      );
      i++; continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <div key={i} style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)",
          marginBottom: 6, marginTop: elements.length > 0 ? 12 : 0 }}>
          {inlineFormat(line.replace(/^## /, ""))}
        </div>
      );
      i++; continue;
    }

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <div key={i} style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)",
          marginBottom: 5, marginTop: 10 }}>
          {inlineFormat(line.replace(/^### /, ""))}
        </div>
      );
      i++; continue;
    }

    // Table — collect all table rows
    if (line.startsWith("|")) {
      const tableRows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableRows.push(lines[i]);
        i++;
      }
      // filter out separator rows like |---|---|
      const dataRows = tableRows.filter(r => !r.match(/^\|[\s\-|]+\|$/));
      if (dataRows.length > 0) {
        const header = dataRows[0].split("|").filter(c => c.trim() !== "");
        const body   = dataRows.slice(1);
        elements.push(
          <div key={`table-${i}`} style={{ overflowX: "auto", margin: "10px 0" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
              <thead>
                <tr>
                  {header.map((h, hi) => (
                    <th key={hi} style={{ background: "var(--bg2)", color: "var(--text3)",
                      padding: "7px 12px", textAlign: "left", border: "1px solid var(--border)",
                      fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => {
                  const cells = row.split("|").filter(c => c.trim() !== "");
                  return (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--white)" : "var(--surface2)" }}>
                      {cells.map((cell, ci) => (
                        <td key={ci} style={{ padding: "8px 12px", border: "1px solid var(--border)",
                          color: "var(--text2)", whiteSpace: "nowrap" }}>
                          {inlineFormat(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet points
    if (line.match(/^[\-\*] /)) {
      const bullets = [];
      while (i < lines.length && lines[i].match(/^[\-\*] /)) {
        bullets.push(lines[i].replace(/^[\-\*] /, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0 6px 0", paddingLeft: 0, listStyle: "none" }}>
          {bullets.map((b, bi) => (
            <li key={bi} style={{ display: "flex", gap: 8, marginBottom: 5,
              alignItems: "flex-start", fontSize: 13, color: "var(--text2)" }}>
              <span style={{ color: "var(--primary)", fontWeight: 800, marginTop: 1, flexShrink: 0 }}>•</span>
              <span style={{ lineHeight: 1.6 }}>{inlineFormat(b)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        const num  = lines[i].match(/^(\d+)\. /)[1];
        const text = lines[i].replace(/^\d+\. /, "");
        items.push({ num, text });
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: 10, marginBottom: 6,
              alignItems: "flex-start", fontSize: 13 }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, background: "var(--primary-lt)",
                color: "var(--primary)", fontSize: 10, fontWeight: 800, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                fontFamily: "var(--mono)" }}>
                {item.num}
              </span>
              <span style={{ color: "var(--text2)", lineHeight: 1.6 }}>{inlineFormat(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<div key={i} style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />);
      i++; continue;
    }

    // Empty line → spacing
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} style={{ margin: "3px 0", fontSize: 13, color: "var(--text2)", lineHeight: 1.75 }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return elements;
}

// Handle inline **bold**, *italic*, `code`
function inlineFormat(text) {
  const parts = [];
  // split on **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith("**")) {
      parts.push(<strong key={match.index} style={{ fontWeight: 700, color: "var(--text)" }}>{match[2]}</strong>);
    } else if (match[0].startsWith("*")) {
      parts.push(<em key={match.index} style={{ fontStyle: "italic" }}>{match[3]}</em>);
    } else if (match[0].startsWith("`")) {
      parts.push(
        <code key={match.index} style={{ background: "var(--bg2)", color: "var(--primary)",
          padding: "1px 5px", borderRadius: 4, fontSize: "0.9em",
          fontFamily: "var(--mono)", border: "1px solid var(--border)" }}>
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

const QUICK_QUESTIONS = [
  "Which parts should I order this week?",
  "What is my biggest stockout risk?",
  "How much capital is locked in dead stock?",
  "Which parts are growing fastest?",
  "Which parts should I run a discount on?",
  "What will my revenue be next 30 days?",
];

// ── Reusable card wrapper ─────────────────────────────────────────────────
function InsightCard({ title, sub, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 16 }}>
          {sub}
        </div>
      )}
      {!sub && <div style={{ marginBottom: 16 }} />}
      {children}
    </div>
  );
}

// ── AI Chat Box ───────────────────────────────────────────────────────────
function AIChatBox() {
  const [question,        setQuestion]        = useState("");
  const [chatHistory,     setChatHistory]     = useState([]);
  const [loadingChat,     setLoadingChat]     = useState(false);
  const [analysis,        setAnalysis]        = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError,   setAnalysisError]   = useState("");
  const [chatError,       setChatError]       = useState("");

  // ── Generate full AI analysis ──
  const getAnalysis = async () => {
    setLoadingAnalysis(true);
    setAnalysisError("");
    setAnalysis("");
    try {
      const { data } = await axios.get(`${API}/api/ai-analysis`);
      setAnalysis(data.analysis);
    } catch (e) {
      setAnalysisError(
        e.response?.data?.detail ||
        "Could not connect to AI. Make sure ANTHROPIC_API_KEY is set and backend is running."
      );
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // ── Ask a question ──
  const askQuestion = async (q) => {
    const text = (q || question).trim();
    if (!text) return;
    setQuestion("");
    setChatError("");
    setChatHistory(prev => [...prev, { role: "user", text }]);
    setLoadingChat(true);
    try {
      const { data } = await axios.post(`${API}/api/ask`, { question: text });
      setChatHistory(prev => [...prev, { role: "claude", text: data.answer }]);
    } catch (e) {
      setChatError(
        e.response?.data?.detail ||
        "Could not get answer. Make sure ANTHROPIC_API_KEY is set and backend is running."
      );
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Auto Analysis section ── */}
      <div className="card" style={{
        background: "linear-gradient(135deg,#f8faff,#eff6ff)",
        border: "1px solid #bfdbfe",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--primary)" }}>
              ✨ Auto-Analyse My Inventory
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 3 }}>
              claude reads your live data and writes a custom expert analysis
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(analysis || analysisError) && (
              <button className="btn btn-outline"
                onClick={() => { setAnalysis(""); setAnalysisError(""); }}
                style={{ fontSize: 12 }}>
                ✕ Clear
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={getAnalysis}
              disabled={loadingAnalysis}
              style={{ minWidth: 230 }}
            >
              {loadingAnalysis
                ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 13, height: 13,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      display: "inline-block",
                      animation: "ai-spin 0.7s linear infinite" }} />
                    Claude is analysing...
                  </span>
                : "🤖 Generate AI Analysis of My Inventory"
              }
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loadingAnalysis && (
          <div style={{ background: "var(--white)", borderRadius: 12,
            border: "1px solid #bfdbfe", padding: 20 }}>
            {[100, 90, 95, 70, 85, 60].map((w, i) => (
              <div key={i} className="skeleton" style={{
                height: 13, marginBottom: 10, borderRadius: 6, width: `${w}%`,
              }} />
            ))}
          </div>
        )}

        {/* Analysis result */}
        {analysis && !loadingAnalysis && (
          <div style={{ background: "var(--white)", borderRadius: 12,
            border: "1px solid #bfdbfe", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                  Claude's Analysis
                </div>
                <div style={{ fontSize: 10, color: "var(--text4)", fontFamily: "var(--mono)" }}>
                  claude-sonnet-4-6 · based on your live inventory data
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13 }}>
              {renderMarkdown(analysis)}
            </div>
          </div>
        )}

        {/* Error */}
        {analysisError && !loadingAnalysis && (
          <div style={{ background: "var(--red-lt)", border: "1px solid var(--red-md)",
            borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--red)" }}>
            ⚠ {analysisError}
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              Check: ANTHROPIC_API_KEY env var is set · pip install anthropic · uvicorn running on port 8000
            </div>
          </div>
        )}
      </div>

      {/* ── Q&A Chat section ── */}
      <div className="card" style={{ border: "1px solid var(--border2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>
              💬 Ask Claude About Your Inventory
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 3 }}>
              plain english questions · claude reads live data to answer
            </div>
          </div>
          {chatHistory.length > 0 && (
            <button className="btn btn-outline"
              onClick={() => { setChatHistory([]); setChatError(""); }}
              style={{ fontSize: 12 }}>
              ✕ Clear Chat
            </button>
          )}
        </div>

        {/* Quick chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i}
              onClick={() => askQuestion(q)}
              disabled={loadingChat}
              style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20,
                background: "var(--surface2)", border: "1px solid var(--border)",
                cursor: loadingChat ? "not-allowed" : "pointer",
                color: "var(--text2)", fontFamily: "var(--font)",
                transition: "all 0.15s", fontWeight: 500,
                opacity: loadingChat ? 0.5 : 1 }}
              onMouseOver={e => { if (!loadingChat) e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat messages */}
        {chatHistory.length > 0 && (
          <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 12,
            maxHeight: 420, overflowY: "auto", padding: "2px 0" }}>
            {chatHistory.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: 10, alignItems: "flex-end",
              }}>
                {msg.role === "claude" && (
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: msg.role === "user" ? "60%" : "82%",
                  padding: msg.role === "user" ? "10px 15px" : "14px 18px",
                  borderRadius: msg.role === "user"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                  background: msg.role === "user"
                    ? "var(--primary)"
                    : "var(--white)",
                  color: msg.role === "user" ? "#fff" : "var(--text2)",
                  border: msg.role === "claude" ? "1px solid var(--border)" : "none",
                  boxShadow: "var(--shadow-sm)",
                }}>
                  {msg.role === "user"
                    ? <span style={{ fontSize: 13, lineHeight: 1.7 }}>{msg.text}</span>
                    : <div style={{ fontSize: 13 }}>{renderMarkdown(msg.text)}</div>
                  }
                </div>
                {msg.role === "user" && (
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                    👤
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loadingChat && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                  🤖
                </div>
                <div style={{ padding: "13px 18px", borderRadius: "16px 16px 16px 4px",
                  background: "var(--surface2)", border: "1px solid var(--border)",
                  display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 0.18, 0.36].map((delay, i) => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "var(--primary)",
                      animation: `ai-bounce 1.1s ${delay}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat error */}
        {chatError && (
          <div style={{ marginBottom: 12, background: "var(--red-lt)",
            border: "1px solid var(--red-md)", borderRadius: 8,
            padding: "10px 14px", fontSize: 12, color: "var(--red)" }}>
            ⚠ {chatError}
          </div>
        )}

        {/* Input row */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loadingChat && askQuestion()}
            placeholder='e.g. "Which parts need ordering?" or "What is my biggest risk?"'
            disabled={loadingChat}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: "1.5px solid var(--border)", fontSize: 13,
              fontFamily: "var(--font)", outline: "none",
              background: "var(--white)", color: "var(--text)",
              transition: "border-color 0.15s",
              opacity: loadingChat ? 0.7 : 1,
            }}
            onFocus={e => e.target.style.borderColor = "var(--primary)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <button
            className="btn btn-primary"
            onClick={() => askQuestion()}
            disabled={loadingChat || !question.trim()}
            style={{
              minWidth: 90,
              opacity: (!question.trim() || loadingChat) ? 0.55 : 1,
              cursor: (!question.trim() || loadingChat) ? "not-allowed" : "pointer",
            }}
          >
            {loadingChat ? "..." : "Send →"}
          </button>
        </div>

        {/* Cost note */}
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--text4)",
          fontFamily: "var(--mono)", textAlign: "right" }}>
          ~Rs.0.001 per question · claude-haiku-4-5 · avg response time 1–2s
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes ai-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ai-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.35; }
          40%           { transform: translateY(-7px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main Insights page ────────────────────────────────────────────────────
export default function Insights({ products, summary }) {
  if (!products) return null;

  const topRevenue = [...products]
    .sort((a, b) => b.avg_daily_revenue - a.avg_daily_revenue)
    .slice(0, 5)
    .map(p => ({
      name:  p.product_name.split(" ").slice(0, 3).join(" "),
      rev:   Math.round(p.avg_daily_revenue),
      color: ABC_COLOR[p.abc_class],
    }));

  const catPie = Object.entries(summary.category_revenue)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, rev], i) => ({
      name: cat, value: Math.round(rev), fill: COLORS[i % COLORS.length],
    }));

  const trendUp   = products.filter(p => p.forecast?.trend === "up").length;
  const trendDown = products.filter(p => p.forecast?.trend === "down").length;
  const trendFlat = products.filter(p => p.forecast?.trend === "stable").length;

  const momSorted = [...products]
    .filter(p => p.forecast)
    .sort((a, b) => b.forecast.mom_change - a.forecast.mom_change);

  const catCoverage = {};
  products.forEach(p => {
    if (!catCoverage[p.category]) catCoverage[p.category] = { total: 0, count: 0 };
    catCoverage[p.category].total += Math.min(p.reorder.days_remaining, 60);
    catCoverage[p.category].count += 1;
  });
  const radarData = Object.entries(catCoverage).map(([cat, v]) => ({
    subject: cat, A: Math.round(v.total / v.count), fullMark: 60,
  }));

  const abcValue = { A: 0, B: 0, C: 0 };
  products.forEach(p => { abcValue[p.abc_class] += p.reorder.current_stock * p.unit_cost; });
  const totalVal = Object.values(abcValue).reduce((s, v) => s + v, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── KPI pills ── */}
      <div className="card fade-up" style={{
        background: "linear-gradient(135deg,#f8faff,#eff6ff)",
        border: "1px solid #dbeafe",
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--primary)", marginBottom: 16 }}>
          📊 Inventory Intelligence Overview
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
          {[
            { label: "Trending Up",   value: trendUp,   color: "var(--green)",  bg: "var(--green-lt)" },
            { label: "Trending Down", value: trendDown, color: "var(--red)",    bg: "var(--red-lt)" },
            { label: "Stable",        value: trendFlat, color: "var(--text3)",  bg: "var(--bg2)" },
            { label: "Class A Parts", value: products.filter(p => p.abc_class === "A").length, color: "var(--primary)", bg: "var(--primary-lt)" },
            { label: "Inv. Value",    value: `Rs.${(summary.total_inventory_value / 100000).toFixed(1)}L`, color: "var(--purple)", bg: "var(--purple-lt)" },
            { label: "Health Score",  value: `${summary.inventory_health_score}%`, color: "var(--teal)", bg: "var(--teal-lt)" },
          ].map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)",
                marginTop: 3, lineHeight: 1.3 }}>
                {k.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: Revenue chart + Pie ── */}
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <InsightCard title="Top 5 Parts by Daily Revenue"
          sub="highest revenue contribution to your business" className="fade-up-1">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topRevenue} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={120}
                tick={{ fontSize: 10, fill: "#64748b", fontFamily: "IBM Plex Mono,monospace" }}
                axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e5ef",
                  background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={v => [`Rs.${v.toLocaleString()}/day`, ""]} />
              <Bar dataKey="rev" radius={[0, 5, 5, 0]}>
                {topRevenue.map((r, i) => <Cell key={i} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {topRevenue.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                <span style={{ fontSize: 10, color: "var(--text3)" }}>{r.name}</span>
              </div>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Revenue Share by Category"
          sub="which part categories drive your margins" className="fade-up-2">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                dataKey="value" paddingAngle={2}>
                {catPie.map((c, i) => <Cell key={i} fill={c.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8,
                  border: "1px solid #e2e5ef", background: "#fff" }}
                formatter={v => [`Rs.${v.toLocaleString()}/day`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {catPie.slice(0, 6).map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.fill }} />
                <span style={{ fontSize: 10, color: "var(--text3)" }}>{c.name}</span>
              </div>
            ))}
          </div>
        </InsightCard>
      </div>

      {/* ── Row 3: Radar + MoM table ── */}
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <InsightCard title="Stock Coverage by Category"
          sub="avg days of supply remaining per category (60 = healthy)" className="fade-up-3">
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="#e2e5ef" />
              <PolarAngleAxis dataKey="subject"
                tick={{ fontSize: 10, fill: "#64748b", fontFamily: "IBM Plex Mono,monospace" }} />
              <Radar name="Days" dataKey="A" stroke="#2563eb" fill="#2563eb"
                fillOpacity={0.1} strokeWidth={2} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8,
                  border: "1px solid #e2e5ef", background: "#fff" }}
                formatter={v => [`${v} days avg`, ""]} />
            </RadarChart>
          </ResponsiveContainer>
        </InsightCard>

        <InsightCard title="Month-over-Month Demand Change"
          sub="how demand shifted vs last month for each part" className="fade-up-4">
          <div style={{ overflowY: "auto", maxHeight: 230 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>Category</th>
                  <th>MoM</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {momSorted.map(p => {
                  const mom   = p.forecast.mom_change;
                  const color = mom > 0 ? "var(--green)" : mom < 0 ? "var(--red)" : "var(--text3)";
                  return (
                    <tr key={p.product_id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{p.product_name}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>
                          {CAT_ICON[p.category] || "📦"} {p.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color, fontFamily: "var(--mono)", fontSize: 12 }}>
                          {mom > 0 ? "+" : ""}{mom}%
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 14, color: TREND_COLOR[p.forecast.trend] }}>
                          {p.forecast.trend === "up" ? "↑" : p.forecast.trend === "down" ? "↓" : "→"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </InsightCard>
      </div>

      {/* ── Row 4: ABC value + Risk matrix ── */}
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        <InsightCard title="Inventory Value by ABC Class"
          sub="capital allocation across product tiers" className="fade-up-5">
          {["A", "B", "C"].map(cls => {
            const pct = totalVal > 0 ? Math.round((abcValue[cls] / totalVal) * 100) : 0;
            return (
              <div key={cls} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6,
                      background: ABC_COLOR[cls] + "15", border: `1px solid ${ABC_COLOR[cls]}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 900, color: ABC_COLOR[cls],
                      fontFamily: "var(--mono)" }}>
                      {cls}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>
                      Class {cls} Parts
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: ABC_COLOR[cls] }}>
                      Rs.{(abcValue[cls] / 1000).toFixed(0)}K
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text3)", marginLeft: 4,
                      fontFamily: "var(--mono)" }}>({pct}%)</span>
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill"
                    style={{ width: `${pct}%`, background: ABC_COLOR[cls] }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg2)",
            borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 4 }}>
              TOTAL INVENTORY VALUE
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>
              Rs.{(totalVal / 100000).toFixed(2)}L
            </div>
          </div>
        </InsightCard>

        <InsightCard title="Stockout Risk Matrix"
          sub="parts ranked by revenue impact × days remaining" className="fade-up-5">
          <div style={{ overflowY: "auto", maxHeight: 300 }}>
            {[...products]
              .sort((a, b) =>
                (b.avg_daily_revenue / (b.reorder.days_remaining + 1)) -
                (a.avg_daily_revenue / (a.reorder.days_remaining + 1))
              )
              .slice(0, 10)
              .map((p, i) => {
                const risk = p.reorder.days_remaining < 7 ? "HIGH"
                  : p.reorder.days_remaining < 15 ? "MEDIUM" : "LOW";
                const rc  = risk === "HIGH" ? "var(--red)"    : risk === "MEDIUM" ? "var(--amber)"    : "var(--green)";
                const rbg = risk === "HIGH" ? "var(--red-lt)" : risk === "MEDIUM" ? "var(--amber-lt)" : "var(--green-lt)";
                return (
                  <div key={p.product_id} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "10px 0",
                    borderBottom: i < 9 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5,
                        background: "var(--bg2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800, color: "var(--text3)",
                        fontFamily: "var(--mono)" }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                          {p.product_name}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                          {p.reorder.days_remaining}d left · Rs.{Math.round(p.avg_daily_revenue).toLocaleString()}/day
                        </div>
                      </div>
                    </div>
                    <span className="badge"
                      style={{ background: rbg, color: rc, border: `1px solid ${rc}30` }}>
                      {risk}
                    </span>
                  </div>
                );
              })}
          </div>
        </InsightCard>
      </div>

      {/* ── Row 5: Static rule-based recommendations ── */}
      <div className="card fade-up" style={{
        background: "linear-gradient(135deg,#f8faff,#f0f4ff)",
        border: "1px solid #dbeafe",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "var(--primary)" }}>
            📋 Rule-Based Recommendations
          </div>
          <span style={{ fontSize: 10, color: "var(--text4)", fontFamily: "var(--mono)",
            background: "var(--bg2)", border: "1px solid var(--border)",
            padding: "2px 8px", borderRadius: 4 }}>
            logic-driven · not AI
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            {
              icon: "📦", title: "Procurement Priority",
              color: "var(--red)", bg: "var(--red-lt)", border: "var(--red-md)",
              points: [
                `Immediately restock: ${products.filter(p => p.reorder.status === "critical").map(p => p.product_name.split(" ").slice(0, 2).join(" ")).join(", ") || "no critical parts"}.`,
                `Budget Rs.${summary.total_order_value.toLocaleString()} for urgent procurement across ${summary.critical_reorder_count + summary.low_stock_count} parts.`,
                "Prioritise Class A parts first — they drive 80% of revenue.",
              ],
            },
            {
              icon: "💰", title: "Capital Optimisation",
              color: "var(--purple)", bg: "var(--purple-lt)", border: "var(--purple-md)",
              points: [
                `Offer fleet/garage bulk discounts on dead stock to recover Rs.${summary.dead_stock_value.toLocaleString()}.`,
                `${summary.slow_stock_count} slow-moving parts need a promotional push before they stagnate.`,
                "Reduce reorder quantities for Class C parts to minimise capital lock-in.",
              ],
            },
            {
              icon: "📈", title: "Demand Planning",
              color: "var(--green)", bg: "var(--green-lt)", border: "var(--green-md)",
              points: [
                `${summary.trending_up_count} parts show upward demand — increase safety stock.`,
                "Prepare extra stock for December (year-end service rush) and summer months.",
                "Engine parts are your highest revenue category — ensure zero stockout risk.",
              ],
            },
            {
              icon: "🎯", title: "Supplier Strategy",
              color: "var(--teal)", bg: "var(--teal-lt)", border: "#a5f3fc",
              points: [
                "Negotiate quantity discounts with brake and engine part suppliers.",
                "Set up auto-reorder triggers for Class A parts at 15-day stock level.",
                "Consider multi-supplier agreements for Headlight Bulbs and Wiper Blades.",
              ],
            },
          ].map((item, i) => (
            <div key={i} style={{ background: item.bg, border: `1px solid ${item.border}`,
              borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, color: item.color, fontWeight: 800, marginBottom: 10 }}>
                {item.icon} {item.title}
              </div>
              {item.points.map((pt, j) => (
                <div key={j} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: item.color,
                    marginTop: 5, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{pt}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 6: REAL AI section ── */}
      <div style={{ borderRadius: 16, overflow: "hidden",
        border: "2px solid var(--primary)", boxShadow: "0 4px 20px rgba(37,99,235,0.12)" }}>

        {/* Header bar */}
        <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
          padding: "14px 22px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>
              Real AI — Powered by Claude API
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "var(--mono)" }}>
              reads your live inventory data · dynamic answers · not hardcoded
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6,
              padding: "3px 10px", fontSize: 10, color: "#fff",
              fontFamily: "var(--mono)", fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}>
              ANTHROPIC API
            </span>
            <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6,
              padding: "3px 10px", fontSize: 10, color: "#fff",
              fontFamily: "var(--mono)", fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}>
              ~Rs.0.001 / call
            </span>
          </div>
        </div>

        {/* Setup instructions banner */}
        <div style={{ background: "#fefce8", borderBottom: "1px solid #fde68a",
          padding: "10px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontSize: 12, color: "#92400e", fontFamily: "var(--mono)" }}>
            Setup required:&nbsp;
            <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>
              pip install anthropic
            </code>
            &nbsp;·&nbsp;
            <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>
              set ANTHROPIC_API_KEY=sk-ant-...
            </code>
            &nbsp;·&nbsp; add
            <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, margin: "0 4px" }}>
              ai_insights.py
            </code>
            and 2 routes to
            <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>
              main.py
            </code>
          </span>
        </div>

        <div style={{ padding: 20, background: "var(--white)" }}>
          <AIChatBox />
        </div>
      </div>

    </div>
  );
}