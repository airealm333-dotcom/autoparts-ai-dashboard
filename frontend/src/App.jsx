import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Overview    from "./pages/Overview.jsx";
import Reorders    from "./pages/Reorders.jsx";
import DeadStock   from "./pages/DeadStock.jsx";
import Forecasts   from "./pages/Forecasts.jsx";
import Insights    from "./pages/Insights.jsx";
import UploadPanel from "./components/UploadPanel.jsx";

const API  = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TABS = [
  { id:"Overview",       label:"Overview",        icon:"🏠" },
  { id:"Reorder Alerts", label:"Reorder Alerts",  icon:"🔔" },
  { id:"Dead Stock",     label:"Dead Stock",       icon:"📦" },
  { id:"Forecasts",      label:"Forecasts",        icon:"📈" },
  { id:"Insights",       label:"AI Insights",      icon:"🤖" },
];

function Skeleton() {
  return (
    <div style={{padding:"28px 20px",maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:28}}>
        {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:100}}/>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:200}}/>)}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent, accentClass, icon, extra, delay="" }) {
  return (
    <div className={`card ${accentClass} fade-up${delay}`}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{width:38,height:38,borderRadius:10,
          background:accent+"15",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:18}}>
          {icon}
        </div>
        {extra}
      </div>
      <div style={{fontSize:28,fontWeight:800,color:"var(--text)",lineHeight:1,
        fontFamily:"var(--font)",letterSpacing:"-0.02em",marginBottom:4}}>
        {value}
      </div>
      <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",
        letterSpacing:"0.06em",fontFamily:"var(--mono)"}}>
        {label}
      </div>
      {sub && <div style={{fontSize:11,color:accent,marginTop:4,fontWeight:600}}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [tab,        setTab]        = useState("Overview");
  const [showUpload, setShowUpload] = useState(false);
  const [waitSecs,   setWaitSecs]   = useState(0);
  const [waking,     setWaking]     = useState(false);
  const [showAlert,  setShowAlert]  = useState(true);

  const fetchDemo = useCallback(async () => {
    setLoading(true); setError(null); setWaitSecs(0); setWaking(false);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setWaitSecs(count);
      if (count === 4) setWaking(true);
    }, 1000);
    try {
      const { data } = await axios.get(`${API}/api/demo`, { timeout: 60000 });
      setReport(data);
    } catch {
      setError("Cannot connect to backend.");
    } finally {
      clearInterval(timer);
      setLoading(false); setWaking(false); setWaitSecs(0);
    }
  }, []);

  useEffect(() => { fetchDemo(); }, [fetchDemo]);

  const { summary, products } = report || {};
  const healthColor = summary
    ? summary.inventory_health_score >= 70 ? "#16a34a"
    : summary.inventory_health_score >= 40 ? "#d97706" : "#dc2626"
    : "#64748b";

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>

      {/* ── Header ── */}
      <header style={{background:"var(--white)",borderBottom:"1px solid var(--border)",
        position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(15,23,42,0.06)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",
          display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,
              background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
              🔧
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"var(--text)",letterSpacing:"-0.02em"}}>
                AutoParts <span style={{color:"var(--primary)"}}>AI</span>
              </div>
              <div style={{fontSize:9,color:"var(--text4)",letterSpacing:"0.14em",
                fontFamily:"var(--mono)",textTransform:"uppercase"}}>
                Spare Parts Intelligence
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div className="hide-mobile" style={{display:"flex",alignItems:"center",gap:8,
              background:"var(--green-lt)",border:"1px solid var(--green-md)",
              borderRadius:8,padding:"5px 12px"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"var(--green)",
                animation:"pulse-live 2s infinite"}}/>
              <span style={{color:"var(--green)",fontSize:11,fontWeight:600,fontFamily:"var(--mono)"}}>
                {summary ? summary.generated_at : "Connecting..."}
              </span>
            </div>
            <button className="btn btn-outline" onClick={()=>setShowUpload(!showUpload)} style={{fontSize:12}}>
              📂 Upload Data
            </button>
            <button className="btn btn-primary" onClick={fetchDemo} style={{fontSize:12}}>
              ↺ Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ── Alert Banner ── */}
      {summary?.critical_reorder_count > 0 && showAlert && (
        <div style={{background:"var(--red-lt)",borderBottom:"1px solid var(--red-md)",
          padding:"10px 20px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>⚠️</span>
          <span style={{fontSize:13,color:"var(--red)",fontWeight:700}}>
            {summary.critical_reorder_count} spare part{summary.critical_reorder_count>1?"s":""} will
            stockout within 7 days — immediate procurement required
          </span>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button onClick={()=>setTab("Reorder Alerts")}
              style={{fontSize:12,color:"var(--red)",
                background:"var(--white)",border:"1px solid var(--red-md)",
                borderRadius:6,padding:"4px 12px",cursor:"pointer",fontWeight:700}}>
              View Alerts →
            </button>
            <button onClick={()=>setShowAlert(false)}
              style={{fontSize:14,color:"var(--red)",
                background:"transparent",border:"none",
                cursor:"pointer",fontWeight:700,lineHeight:1,padding:"0 4px"}}
              title="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Upload Panel ── */}
      {showUpload && (
        <div style={{background:"var(--white)",borderBottom:"1px solid var(--border)",padding:20}}>
          <div style={{maxWidth:1200,margin:"0 auto"}}>
            <UploadPanel onDataLoaded={d=>{setReport(d);setShowUpload(false);setTab("Overview")}}
              apiBase={API}/>
          </div>
        </div>
      )}

      {/* ── Wake-up banner ── */}
      {loading && waking && (
        <div style={{maxWidth:1200,margin:"28px auto",padding:"0 20px"}}>
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",
            borderRadius:16,padding:"32px 24px",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:14}}>☕</div>
            <div style={{fontSize:17,fontWeight:800,color:"#92400e",marginBottom:6}}>
              Waking up the server...
            </div>
            <div style={{fontSize:13,color:"#a16207",marginBottom:20,maxWidth:420,margin:"0 auto 20px"}}>
              Free hosting spins down after inactivity. First load takes 30–50 seconds. Hang tight!
            </div>
            <div style={{background:"#fef3c7",borderRadius:10,
              padding:"10px 20px",display:"inline-flex",alignItems:"center",gap:10,
              border:"1px solid #fde68a"}}>
              <div style={{width:16,height:16,border:"2px solid #d97706",
                borderTopColor:"transparent",borderRadius:"50%",
                animation:"spin 0.8s linear infinite"}}/>
              <span style={{fontSize:13,fontWeight:700,color:"#92400e",fontFamily:"var(--mono)"}}>
                {waitSecs}s elapsed — please wait
              </span>
            </div>
            <div style={{marginTop:16,fontSize:11,color:"#a16207",fontFamily:"var(--mono)"}}>
              tip: set up UptimeRobot (free) to keep server always awake
            </div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{maxWidth:1200,margin:"28px auto",padding:"0 20px"}}>
          <div style={{background:"var(--red-lt)",border:"1px solid var(--red-md)",
            borderRadius:12,padding:20,color:"var(--red)",fontSize:13}}>
            ⚠ Backend is not responding. It may still be waking up.
            <div style={{marginTop:8,fontSize:12,color:"var(--text3)"}}>
              Try refreshing in 10 seconds — or open&nbsp;
              <a href="https://autoparts-ai-backend.onrender.com/api/health"
                target="_blank" rel="noreferrer"
                style={{color:"var(--primary)",fontFamily:"var(--mono)"}}>
                the health check URL
              </a>
              &nbsp;to wake it up first, then come back.
            </div>
            <button onClick={fetchDemo}
              style={{marginTop:12,padding:"8px 20px",background:"var(--primary)",
                color:"#fff",border:"none",borderRadius:8,cursor:"pointer",
                fontSize:12,fontWeight:700}}>
              ↺ Try Again
            </button>
          </div>
        </div>
      )}

      {loading && !waking && <Skeleton/>}

      {/* ── Main ── */}
      {!loading && report && (
        <main style={{maxWidth:1200,margin:"0 auto",padding:"28px 20px"}}>

          {/* Stat Cards */}
          <div className="stat-grid" style={{display:"grid",
            gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:28}}>
            <StatCard
              label="Total Parts" value={summary.total_products}
              sub="monitored by AI" accent="#2563eb" accentClass="stat-blue" icon="🔧" delay="-1"/>
            <StatCard
              label="Critical Stock" value={summary.critical_reorder_count}
              sub={summary.critical_reorder_count>0?"Order immediately":"All safe"}
              accent="#dc2626" accentClass="stat-red" icon="🚨" delay="-2"/>
            <StatCard
              label="Dead Stock" value={summary.dead_stock_count}
              sub={`₹${(summary.dead_stock_value/1000).toFixed(0)}K locked`}
              accent="#7c3aed" accentClass="stat-purple" icon="📦" delay="-3"/>
            <StatCard
              label="30-Day Forecast" value={summary.total_forecast_30d.toLocaleString("en-IN")}
              sub="units predicted" accent="#16a34a" accentClass="stat-green" icon="📈" delay="-4"/>
            <StatCard
              label="Health Score" value={`${summary.inventory_health_score}%`}
              sub={summary.inventory_health_score>=70?"Good":"Needs attention"}
              accent={healthColor} accentClass="stat-teal" icon="❤️" delay="-5"/>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:10,marginBottom:24,
            alignItems:"center",flexWrap:"wrap"}}>
            <div className="tab-bar">
              {TABS.map(t=>(
                <button key={t.id} className={`tab-btn${tab===t.id?" active":""}`}
                  onClick={()=>setTab(t.id)}>
                  {t.icon} {t.label}
                  {t.id==="Reorder Alerts" && summary.critical_reorder_count>0 && (
                    <span style={{marginLeft:6,background:"var(--red)",color:"#fff",
                      borderRadius:4,fontSize:9,padding:"1px 5px",fontWeight:800}}>
                      {summary.critical_reorder_count}
                    </span>
                  )}
                  {t.id==="Dead Stock" && summary.dead_stock_count>0 && (
                    <span style={{marginLeft:6,background:"var(--purple)",color:"#fff",
                      borderRadius:4,fontSize:9,padding:"1px 5px",fontWeight:800}}>
                      {summary.dead_stock_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div key={tab} className="fade-in">
            {tab==="Overview"       && <Overview  products={products} summary={summary} onTabChange={setTab}/>}
            {tab==="Reorder Alerts" && <Reorders  products={products}/>}
            {tab==="Dead Stock"     && <DeadStock products={products} summary={summary}/>}
            {tab==="Forecasts"      && <Forecasts products={products}/>}
            {tab==="Insights"       && <Insights  products={products} summary={summary}/>}
          </div>
        </main>
      )}


    </div>
  );
}