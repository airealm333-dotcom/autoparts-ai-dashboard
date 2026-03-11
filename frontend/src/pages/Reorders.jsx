import { MiniChart, InfoTile, ABCBadge, StatusBadge, SectionHeader, EmptyState, STATUS_COLOR } from "../components/Shared.jsx";

function ReorderCard({ p }) {
  const r  = p.reorder;
  const sc = STATUS_COLOR[r.status];

  return (
    <div className="card fade-up" style={{borderTop:`3px solid ${sc}`}}>
      <div style={{display:"flex",justifyContent:"space-between",
        alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:"var(--text)",marginBottom:4}}>
            {p.product_name}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
              {p.product_id}
            </span>
            <span style={{color:"var(--text4)"}}>·</span>
            <ABCBadge cls={p.abc_class}/>
          </div>
        </div>
        <StatusBadge status={r.status}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        <InfoTile label="Current Stock" value={`${r.current_stock} units`}/>
        <InfoTile label="Days Remaining" value={`${r.days_remaining} days`} accent={sc}/>
        <InfoTile label="Daily Usage" value={`${r.avg_daily_sales} u/day`}/>
      </div>

      {/* AI Order Recommendation */}
      <div style={{background:"var(--primary-lt)",border:"1px solid #bfdbfe",
        borderRadius:10,padding:"12px 14px",marginBottom:12,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,color:"var(--primary)",fontWeight:700,
            letterSpacing:"0.08em",marginBottom:4,fontFamily:"var(--mono)"}}>
            AI RECOMMENDATION
          </div>
          <div style={{fontSize:16,fontWeight:900,color:"var(--primary)"}}>
            Order {r.suggested_reorder_qty.toLocaleString("en-IN")} units
          </div>
          <div style={{fontSize:11,color:"var(--text3)",marginTop:1,fontFamily:"var(--mono)"}}>
            = 30-day demand buffer
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:"var(--text4)",fontFamily:"var(--mono)",marginBottom:2}}>
            ESTIMATED COST
          </div>
          <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>
            ₹{r.order_value.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div>
        <div style={{fontSize:10,color:"var(--text4)",marginBottom:4,fontFamily:"var(--mono)"}}>
          SALES VELOCITY — 12 WEEKS + FORECAST
        </div>
        <MiniChart data={p.forecast?.chart_data} color={sc} height={56}/>
      </div>
    </div>
  );
}

export default function Reorders({ products }) {
  const critical = products?.filter(p=>p.reorder.status==="critical")??[];
  const low      = products?.filter(p=>p.reorder.status==="low")??[];
  const totalValue = [...critical,...low].reduce((s,p)=>s+p.reorder.order_value,0);

  if (critical.length===0 && low.length===0)
    return <EmptyState icon="" title="All parts are well stocked"
      sub="no reorder alerts · ai will notify when action is needed"/>;

  return (
    <div>
      {/* Summary banner */}
      <div className="card fade-up" style={{marginBottom:20,background:"var(--primary-lt)",
        border:"1px solid #bfdbfe",flexDirection:"row",display:"flex",
        justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:"var(--primary)"}}>
            {critical.length+low.length} parts need reordering
          </div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:2,fontFamily:"var(--mono)"}}>
            {critical.length} critical · {low.length} low stock
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>TOTAL PROCUREMENT</div>
          <div style={{fontSize:22,fontWeight:900,color:"var(--primary)"}}>
            ₹{totalValue.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {critical.length>0 && (
        <div style={{marginBottom:28}}>
          <SectionHeader title=" Critical — Order Immediately"
            sub="will stockout within 7 days at current usage rate"
            count={critical.length}/>
          <div className="card-grid" style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
            {critical.map(p=><ReorderCard key={p.product_id} p={p}/>)}
          </div>
        </div>
      )}

      {low.length>0 && (
        <div>
          <SectionHeader title=" Low Stock — Order This Week"
            sub="will stockout within 15 days — plan procurement"
            count={low.length}/>
          <div className="card-grid" style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
            {low.map(p=><ReorderCard key={p.product_id} p={p}/>)}
          </div>
        </div>
      )}
    </div>
  );
}