import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ABC_COLOR, STATUS_COLOR, CAT_ICON, StatusBadge, ABCBadge, TrendPill } from "../components/Shared.jsx";

const CAT_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#0f172a","#6366f1"];

export default function Overview({ products, summary, onTabChange }) {
  if (!products) return null;

  const abcGroups = { A:[], B:[], C:[] };
  products.forEach(p => abcGroups[p.abc_class].push(p));

  // Category revenue chart data
  const catData = Object.entries(summary.category_revenue)
    .sort((a,b)=>b[1]-a[1])
    .map(([cat,rev],i)=>({ cat, rev:Math.round(rev), color:CAT_COLORS[i%CAT_COLORS.length] }));

  const totalRev = catData.reduce((s,c)=>s+c.rev,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Row 1: KPI summary cards */}
      <div className="three-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>

        {/* Inventory Health */}
        <div className="card fade-up">
          <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>Inventory Health</div>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:16}}>
            stock level status across all 15 parts
          </div>
          {products.map(p=>{
            const max = Math.max(p.reorder.reorder_point*4, p.reorder.current_stock);
            const pct = Math.min(100,(p.reorder.current_stock/max)*100);
            const sc  = STATUS_COLOR[p.reorder.status];
            return (
              <div key={p.product_id} style={{marginBottom:11}}>
                <div style={{display:"flex",justifyContent:"space-between",
                  marginBottom:4,alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:600,color:"var(--text2)",
                    maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {p.product_name}
                  </span>
                  <span style={{fontSize:10,color:sc,fontFamily:"var(--mono)",fontWeight:700,flexShrink:0}}>
                    {p.reorder.days_remaining}d
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{width:`${pct}%`,background:sc}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Category Revenue */}
        <div className="card fade-up-1">
          <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>Revenue by Category</div>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:14}}>
            avg daily revenue contribution
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={catData} layout="vertical" margin={{top:0,right:10,bottom:0,left:0}}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="cat" width={90}
                tick={{fontSize:10,fill:"#64748b",fontFamily:"IBM Plex Mono,monospace"}}
                axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{fontSize:11,borderRadius:8,border:"1px solid #e2e5ef",
                  background:"#fff",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}
                formatter={v=>[`₹${v.toLocaleString("en-IN")}/day`,"Revenue"]}/>
              <Bar dataKey="rev" radius={[0,4,4,0]}>
                {catData.map((c,i)=><Cell key={i} fill={c.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:12}}>
            {catData.slice(0,3).map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",
                alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:2,background:c.color}}/>
                  <span style={{fontSize:11,color:"var(--text2)"}}>{c.cat}</span>
                </div>
                <span style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
                  {totalRev>0?Math.round((c.rev/totalRev)*100):0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ABC Summary */}
        <div className="card fade-up-2">
          <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>ABC Classification</div>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:16}}>
            revenue-based part prioritisation
          </div>
          {["A","B","C"].map(cls=>(
            <div key={cls} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:26,height:26,borderRadius:7,background:ABC_COLOR[cls]+"15",
                  border:`1px solid ${ABC_COLOR[cls]}30`,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:12,fontWeight:900,color:ABC_COLOR[cls],
                  fontFamily:"var(--mono)"}}>
                  {cls}
                </div>
                <span style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
                  {cls==="A"?"Top revenue — protect stock"
                   :cls==="B"?"Mid-tier — monitor weekly"
                   :"Low priority — watch overstock"}
                </span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {abcGroups[cls].map(p=>(
                  <span key={p.product_id} style={{fontSize:10,background:ABC_COLOR[cls]+"0d",
                    color:ABC_COLOR[cls],border:`1px solid ${ABC_COLOR[cls]}25`,
                    borderRadius:5,padding:"2px 7px",fontWeight:600}}>
                    {p.product_name.split(" ").slice(0,2).join(" ")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Full product table */}
      <div className="card fade-up-3">
        <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>All Parts — Stock Overview</div>
        <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)",marginBottom:16}}>
          complete inventory snapshot with AI status
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Days Left</th>
                <th>Reorder At</th>
                <th>Unit Cost</th>
                <th>30D Forecast</th>
                <th>MoM</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p=>(
                <tr key={p.product_id}>
                  <td>
                    <div style={{fontWeight:700,color:"var(--text)",fontSize:13}}>
                      {p.product_name}
                    </div>
                    <div style={{fontSize:10,color:"var(--text4)",fontFamily:"var(--mono)"}}>
                      {p.product_id}
                    </div>
                  </td>
                  <td>
                    <span style={{fontSize:12,color:"var(--text2)"}}>
                      {CAT_ICON[p.category]||"📦"} {p.category}
                    </span>
                  </td>
                  <td>
                    <span style={{fontWeight:700,color:STATUS_COLOR[p.reorder.status],
                      fontFamily:"var(--mono)"}}>
                      {p.reorder.current_stock}
                    </span>
                  </td>
                  <td>
                    <span style={{fontWeight:700,fontFamily:"var(--mono)",
                      color:STATUS_COLOR[p.reorder.status]}}>
                      {p.reorder.days_remaining}d
                    </span>
                  </td>
                  <td><span className="mono" style={{color:"var(--text3)"}}>{p.reorder.reorder_point}</span></td>
                  <td><span className="mono">₹{p.unit_cost.toLocaleString("en-IN")}</span></td>
                  <td>
                    <span style={{fontWeight:700,color:"var(--primary)",fontFamily:"var(--mono)"}}>
                      {p.forecast?.next_30_days?.toLocaleString("en-IN")||"—"}
                    </span>
                  </td>
                  <td>
                    {p.forecast && <TrendPill trend={p.forecast.trend} pct={p.forecast.mom_change}/>}
                  </td>
                  <td><ABCBadge cls={p.abc_class}/></td>
                  <td><StatusBadge status={p.reorder.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Quick AI summary */}
      <div className="card fade-up-4" style={{background:"linear-gradient(135deg,#f8faff,#f0f4ff)",
        border:"1px solid #dbeafe"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <span style={{fontSize:18}}>🤖</span>
          <div style={{fontWeight:800,fontSize:14,color:"var(--primary)"}}>AI Executive Summary</div>
        </div>
        <div className="three-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          {[
            {
              icon:"🚨",title:"Action Required",color:"var(--red)",bg:"var(--red-lt)",border:"var(--red-md)",
              text: summary.critical_reorder_count>0
                ? `${summary.critical_reorder_count} parts will stockout within 7 days. Estimated procurement cost: ₹${summary.total_order_value.toLocaleString("en-IN")}.`
                : "All critical parts are well stocked. No immediate procurement needed.",
              btn: summary.critical_reorder_count>0 ? {label:"View Alerts →",tab:"Reorder Alerts"} : null
            },
            {
              icon:"💰",title:"Capital Recovery",color:"var(--purple)",bg:"var(--purple-lt)",border:"var(--purple-md)",
              text: summary.dead_stock_value>0
                ? `₹${summary.dead_stock_value.toLocaleString("en-IN")} locked in ${summary.dead_stock_count} slow-moving parts. Consider bulk discounts to distributors.`
                : "No dead stock detected. Working capital is efficiently deployed.",
              btn: summary.dead_stock_count>0 ? {label:"View Dead Stock →",tab:"Dead Stock"} : null
            },
            {
              icon:"📈",title:"Demand Outlook",color:"var(--green)",bg:"var(--green-lt)",border:"var(--green-md)",
              text: `${summary.trending_up_count} parts showing upward demand trend. Total 30-day forecast: ${summary.total_forecast_30d.toLocaleString("en-IN")} units across all categories.`,
              btn: {label:"View Forecasts →",tab:"Forecasts"}
            },
          ].map((item,i)=>(
            <div key={i} style={{background:item.bg,border:`1px solid ${item.border}`,
              borderRadius:10,padding:16}}>
              <div style={{fontSize:12,color:item.color,fontWeight:700,marginBottom:8}}>
                {item.icon} {item.title}
              </div>
              <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.7,marginBottom:item.btn?10:0}}>
                {item.text}
              </div>
              {item.btn && (
                <button onClick={()=>onTabChange(item.btn.tab)}
                  style={{fontSize:11,color:item.color,background:"transparent",
                    border:`1px solid ${item.border}`,borderRadius:6,
                    padding:"4px 10px",cursor:"pointer",fontWeight:700}}>
                  {item.btn.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}