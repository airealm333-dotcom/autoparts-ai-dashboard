import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export const STATUS_COLOR  = { critical:"#dc2626", low:"#d97706", ok:"#16a34a" };
export const STATUS_BG     = { critical:"#fef2f2",  low:"#fffbeb",  ok:"#f0fdf4" };
export const STATUS_BORDER = { critical:"#fecaca",  low:"#fde68a",  ok:"#bbf7d0" };
export const STATUS_TEXT   = { critical:"CRITICAL", low:"LOW",      ok:"OK" };
export const ABC_COLOR     = { A:"#2563eb", B:"#d97706", C:"#64748b" };
export const TREND_ICON    = { up:"↑", down:"↓", stable:"→" };
export const TREND_COLOR   = { up:"#16a34a", down:"#dc2626", stable:"#64748b" };

export const CAT_ICON = {
  Engine:"⚙️", Brakes:"🛑", Ignition:"⚡", Exterior:"🪟",
  Electrical:"🔋", Transmission:"🔧", Cooling:"🌡️",
  Suspension:"🚗", Steering:"🎯", Interior:"💺",
  Exhaust:"💨", Default:"📦"
};

export function MiniChart({ data, color, height=60 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{top:4,right:2,bottom:0,left:2}}>
        <ReferenceLine x="Jan 12" stroke="#e2e5ef" strokeDasharray="3 3"/>
        <Line type="monotone" dataKey="sales" stroke={color} strokeWidth={2} dot={false}/>
        <Tooltip
          contentStyle={{fontSize:11,padding:"5px 10px",borderRadius:8,
            border:"1px solid #e2e5ef",background:"#fff",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}
          formatter={v=>[`${v} units`,"Sales"]}
          labelStyle={{color:"#64748b",fontSize:10,fontFamily:"IBM Plex Mono,monospace"}}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function InfoTile({ label, value, accent }) {
  return (
    <div className="info-tile">
      <div style={{fontSize:10,color:"var(--text4)",marginBottom:3,fontWeight:600,
        letterSpacing:"0.07em",textTransform:"uppercase",fontFamily:"var(--mono)"}}>
        {label}
      </div>
      <div style={{fontSize:14,fontWeight:700,color:accent||"var(--text)"}}>
        {value}
      </div>
    </div>
  );
}

export function ABCBadge({ cls }) {
  const tip = {A:"Top 80% revenue",B:"Mid-tier",C:"Low priority"};
  return (
    <span className="badge" title={tip[cls]} style={{
      background: ABC_COLOR[cls]+"15", color: ABC_COLOR[cls],
      border:`1px solid ${ABC_COLOR[cls]}30`
    }}>
      {cls}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className="badge" style={{
      background: STATUS_BG[status], color: STATUS_COLOR[status],
      border:`1px solid ${STATUS_BORDER[status]}`
    }}>
      {STATUS_TEXT[status]}
    </span>
  );
}

export function SectionHeader({ title, sub, count }) {
  return (
    <div style={{marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <h2 style={{fontSize:16,fontWeight:800,color:"var(--text)"}}>{title}</h2>
        {count!==undefined && (
          <span className="mono" style={{background:"var(--bg2)",color:"var(--text3)",
            fontSize:11,padding:"2px 8px",borderRadius:5,border:"1px solid var(--border)"}}>
            {count}
          </span>
        )}
      </div>
      {sub && <p style={{fontSize:12,color:"var(--text3)",marginTop:4,fontFamily:"var(--mono)"}}>{sub}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{textAlign:"center",padding:"70px 20px",color:"var(--text4)"}}>
      <div style={{fontSize:44,marginBottom:14}}>{icon}</div>
      <div style={{fontSize:16,fontWeight:700,color:"var(--text2)",marginBottom:8}}>{title}</div>
      <div style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--text3)"}}>{sub}</div>
    </div>
  );
}

export function TrendPill({ trend, pct }) {
  const color = TREND_COLOR[trend];
  const bg    = trend==="up"?"#f0fdf4":trend==="down"?"#fef2f2":"#f8fafc";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,
      background:bg,color,fontSize:11,fontWeight:700,
      padding:"2px 8px",borderRadius:20,fontFamily:"var(--mono)"}}>
      {TREND_ICON[trend]} {pct>0?"+":""}{pct}%
    </span>
  );
}