import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { ABCBadge, SectionHeader, TrendPill, ABC_COLOR } from "../components/Shared.jsx";

export default function Forecasts({ products }) {
  const sorted = [...(products??[])].sort((a,b)=>b.avg_daily_revenue-a.avg_daily_revenue);

  return (
    <div>
      <SectionHeader
        title="📈 30-Day Demand Forecast"
        sub="ai-predicted demand using linear trend analysis + seasonal pattern detection"
        count={sorted.length}/>

      <div className="card-grid" style={{display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
        {sorted.map(p=>{
          const f     = p.forecast;
          const color = ABC_COLOR[p.abc_class];
          const rev30 = (f.next_30_days*p.unit_cost).toLocaleString("en-IN");

          return (
            <div key={p.product_id} className="card fade-up"
              style={{borderTop:`3px solid ${color}`}}>

              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:"var(--text)",marginBottom:4}}>
                    {p.product_name}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
                      {p.category}
                    </span>
                    <ABCBadge cls={p.abc_class}/>
                  </div>
                </div>
                <TrendPill trend={f.trend} pct={f.mom_change}/>
              </div>

              {/* Metrics */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{background:"var(--primary-lt)",border:"1px solid #bfdbfe",
                  borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:9,color:"var(--primary)",fontWeight:700,
                    letterSpacing:"0.08em",marginBottom:3,fontFamily:"var(--mono)"}}>
                    30-DAY UNITS
                  </div>
                  <div style={{fontSize:20,fontWeight:900,color:"var(--primary)"}}>
                    {f.next_30_days.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{background:"var(--surface2)",border:"1px solid var(--border)",
                  borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:9,color:"var(--text3)",fontWeight:700,
                    letterSpacing:"0.08em",marginBottom:3,fontFamily:"var(--mono)"}}>
                    DAILY AVG
                  </div>
                  <div style={{fontSize:20,fontWeight:900,color:"var(--text)"}}>
                    {f.daily_avg}
                  </div>
                </div>
                <div style={{background:"var(--green-lt)",border:"1px solid var(--green-md)",
                  borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:9,color:"var(--green)",fontWeight:700,
                    letterSpacing:"0.08em",marginBottom:3,fontFamily:"var(--mono)"}}>
                    REV FORECAST
                  </div>
                  <div style={{fontSize:13,fontWeight:900,color:"var(--green)"}}>
                    ₹{rev30}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={f.chart_data} margin={{top:4,right:4,bottom:0,left:-24}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                  <XAxis dataKey="week"
                    tick={{fontSize:9,fill:"#94a3b8",fontFamily:"IBM Plex Mono,monospace"}}
                    interval={3} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <Tooltip
                    contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e2e5ef",
                      background:"#fff",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}
                    formatter={(v,_,pr)=>[`${v} units${pr.payload?.forecast?" (AI forecast)":""}`,""]}
                    labelStyle={{color:"#64748b",fontSize:10,fontFamily:"IBM Plex Mono,monospace"}}
                  />
                  <ReferenceLine x="Jan 12" stroke="#e2e5ef" strokeDasharray="4 2"
                    label={{value:"AI →",fontSize:9,fill:"#94a3b8",position:"insideTopRight"}}/>
                  <Line type="monotone" dataKey="sales" stroke={color}
                    strokeWidth={2.5} dot={false} connectNulls/>
                </LineChart>
              </ResponsiveContainer>

              <div style={{fontSize:9,color:"var(--text4)",marginTop:6,textAlign:"right",
                fontFamily:"var(--mono)"}}>
                solid line = actual · right of marker = ai predicted
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}