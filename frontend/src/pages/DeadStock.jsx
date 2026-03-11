import { MiniChart, InfoTile, SectionHeader, EmptyState } from "../components/Shared.jsx";

function DeadCard({ p }) {
  const ds     = p.dead_stock;
  const locked = (p.reorder.current_stock * p.unit_cost).toLocaleString("en-IN");
  const months = Math.round(ds.days_of_stock/30);
  const accent = ds.is_dead ? "#7c3aed" : "#d97706";
  const bg     = ds.is_dead ? "#f5f3ff"  : "#fffbeb";
  const border = ds.is_dead ? "#ddd6fe"  : "#fde68a";
  const label  = ds.is_dead ? "DEAD STOCK" : "SLOW MOVING";

  return (
    <div className="card fade-up" style={{borderTop:`3px solid ${accent}`}}>
      <div style={{display:"flex",justifyContent:"space-between",
        alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:"var(--text)",marginBottom:4}}>
            {p.product_name}
          </div>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>
            {p.product_id} · ₹{p.unit_cost.toLocaleString("en-IN")}/unit
          </div>
        </div>
        <span className="badge" style={{background:bg,color:accent,border:`1px solid ${border}`}}>
          {label}
        </span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <InfoTile label="Units On Hand"     value={`${p.reorder.current_stock} units`}/>
        <InfoTile label="Days of Supply"    value={`${ds.days_of_stock} days`} accent={accent}/>
        <InfoTile label="Daily Sales (60d)" value={`${ds.avg_daily_sales_60d} u/day`}/>
        <InfoTile label="Capital Locked"    value={`₹${locked}`} accent={accent}/>
      </div>

      <div style={{background:bg,border:`1px solid ${border}`,borderRadius:10,
        padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:10,color:accent,fontWeight:700,
          letterSpacing:"0.08em",marginBottom:6,fontFamily:"var(--mono)"}}>
          AI RECOMMENDATION
        </div>
        <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.7}}>
          {ds.is_dead
            ? `At current velocity, this stock will last ${months} more months. Offer 15–20% trade discount to bulk buyers or distributors to recover ₹${locked} in working capital.`
            : `Trending towards dead stock. Run a short-term combo deal or fleet service promotion to accelerate movement before stock stagnates.`}
        </div>
      </div>

      <div>
        <div style={{fontSize:10,color:"var(--text4)",marginBottom:4,fontFamily:"var(--mono)"}}>
          SALES VELOCITY — LAST 12 WEEKS
        </div>
        <MiniChart data={p.forecast?.chart_data} color={accent} height={52}/>
      </div>
    </div>
  );
}

export default function DeadStock({ products, summary }) {
  const dead = products?.filter(p=>p.dead_stock.is_dead)??[];
  const slow = products?.filter(p=>p.dead_stock.is_slow)??[];

  if (dead.length===0 && slow.length===0)
    return <EmptyState icon="" title="No dead or slow stock"
      sub="all inventory moving at healthy velocity"/>;

  return (
    <div>
      {summary?.dead_stock_value>0 && (
        <div className="card fade-up" style={{marginBottom:20,
          background:"var(--purple-lt)",border:"1px solid var(--purple-md)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"var(--purple)"}}>
              Capital Recovery Opportunity
            </div>
            <div style={{fontSize:12,color:"var(--text3)",marginTop:2,fontFamily:"var(--mono)"}}>
              {dead.length} dead stock · {slow.length} slow moving parts
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--mono)"}}>TOTAL LOCKED</div>
            <div style={{fontSize:22,fontWeight:900,color:"var(--purple)"}}>
              ₹{summary.dead_stock_value.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {dead.length>0 && (
        <div style={{marginBottom:28}}>
          <SectionHeader title=" Dead Stock — 90+ Days No Movement"
            sub="immediate action needed to free working capital"
            count={dead.length}/>
          <div className="card-grid" style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
            {dead.map(p=><DeadCard key={p.product_id} p={p}/>)}
          </div>
        </div>
      )}

      {slow.length>0 && (
        <div>
          <SectionHeader title=" Slow Moving — 45–90 Days"
            sub="monitor closely — trending toward dead stock"
            count={slow.length}/>
          <div className="card-grid" style={{display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
            {slow.map(p=><DeadCard key={p.product_id} p={p}/>)}
          </div>
        </div>
      )}
    </div>
  );
}