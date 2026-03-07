"""
AutoParts AI — Demand Forecasting Engine
Car Spare Parts Supply Chain Intelligence
"""
import pandas as pd
import numpy as np
from datetime import datetime


def generate_sample_data() -> pd.DataFrame:
    np.random.seed(99)
    products = [
        {"id":"AP001","name":"Engine Oil Filter",       "category":"Engine",      "unit_cost":450,  "base":85,  "trend":0.02},
        {"id":"AP002","name":"Brake Pads (Front Set)",  "category":"Brakes",      "unit_cost":1200, "base":60,  "trend":0.015},
        {"id":"AP003","name":"Air Filter",              "category":"Engine",      "unit_cost":380,  "base":70,  "trend":0.01},
        {"id":"AP004","name":"Spark Plugs (Set of 4)",  "category":"Ignition",    "unit_cost":920,  "base":55,  "trend":0.02},
        {"id":"AP005","name":"Windshield Wiper Blades", "category":"Exterior",    "unit_cost":320,  "base":90,  "trend":0.03},
        {"id":"AP006","name":"Battery 12V 65Ah",        "category":"Electrical",  "unit_cost":4800, "base":25,  "trend":0.01},
        {"id":"AP007","name":"Clutch Plate Assembly",   "category":"Transmission","unit_cost":3200, "base":18,  "trend":-0.01},
        {"id":"AP008","name":"Radiator Coolant 1L",     "category":"Cooling",     "unit_cost":280,  "base":75,  "trend":0.02},
        {"id":"AP009","name":"Shock Absorber (Pair)",   "category":"Suspension",  "unit_cost":2800, "base":22,  "trend":0.01},
        {"id":"AP010","name":"Timing Belt Kit",         "category":"Engine",      "unit_cost":1800, "base":30,  "trend":0.005},
        {"id":"AP011","name":"Headlight Bulb H4",       "category":"Electrical",  "unit_cost":180,  "base":110, "trend":0.025},
        {"id":"AP012","name":"Power Steering Fluid",    "category":"Steering",    "unit_cost":350,  "base":4,   "trend":-0.005},
        {"id":"AP013","name":"Disc Brake Rotor",        "category":"Brakes",      "unit_cost":2200, "base":5,   "trend":0.0},
        {"id":"AP014","name":"Cabin Air Filter",        "category":"Interior",    "unit_cost":520,  "base":65,  "trend":0.03},
        {"id":"AP015","name":"Exhaust Gasket Set",      "category":"Exhaust",     "unit_cost":680,  "base":28,  "trend":0.01},
    ]
    dates = pd.date_range("2023-01-01","2024-12-31",freq="D")
    records = []
    for p in products:
        for i, d in enumerate(dates):
            weekly  = 1.0 + 0.18*np.sin(2*np.pi*d.dayofweek/7)
            monthly = 1.0 + 0.20*np.sin(2*np.pi*(d.month-3)/12)
            monsoon = 0.75 if (p["category"]=="Exterior" and d.month in [7,8]) else 1.0
            yearend = 1.35 if d.month==12 else 1.0
            t       = 1.0 + p["trend"]*i/365
            noise   = np.random.normal(1.0,0.13)
            qty     = max(0,int(p["base"]*weekly*monthly*monsoon*yearend*t*noise))
            records.append({"date":d.strftime("%Y-%m-%d"),"product_id":p["id"],
                "product_name":p["name"],"category":p["category"],
                "quantity_sold":qty,"unit_cost":p["unit_cost"]})
    return pd.DataFrame(records)


def get_default_inventory() -> list:
    return [
        {"product_id":"AP001","product_name":"Engine Oil Filter",       "category":"Engine",      "unit_cost":450,  "current_stock":35,  "reorder_point":80},
        {"product_id":"AP002","product_name":"Brake Pads (Front Set)",  "category":"Brakes",      "unit_cost":1200, "current_stock":12,  "reorder_point":40},
        {"product_id":"AP003","product_name":"Air Filter",              "category":"Engine",      "unit_cost":380,  "current_stock":95,  "reorder_point":60},
        {"product_id":"AP004","product_name":"Spark Plugs (Set of 4)",  "category":"Ignition",    "unit_cost":920,  "current_stock":48,  "reorder_point":50},
        {"product_id":"AP005","product_name":"Windshield Wiper Blades", "category":"Exterior",    "unit_cost":320,  "current_stock":22,  "reorder_point":70},
        {"product_id":"AP006","product_name":"Battery 12V 65Ah",        "category":"Electrical",  "unit_cost":4800, "current_stock":8,   "reorder_point":15},
        {"product_id":"AP007","product_name":"Clutch Plate Assembly",   "category":"Transmission","unit_cost":3200, "current_stock":280, "reorder_point":10},
        {"product_id":"AP008","product_name":"Radiator Coolant 1L",     "category":"Cooling",     "unit_cost":280,  "current_stock":130, "reorder_point":60},
        {"product_id":"AP009","product_name":"Shock Absorber (Pair)",   "category":"Suspension",  "unit_cost":2800, "current_stock":6,   "reorder_point":12},
        {"product_id":"AP010","product_name":"Timing Belt Kit",         "category":"Engine",      "unit_cost":1800, "current_stock":42,  "reorder_point":20},
        {"product_id":"AP011","product_name":"Headlight Bulb H4",       "category":"Electrical",  "unit_cost":180,  "current_stock":28,  "reorder_point":90},
        {"product_id":"AP012","product_name":"Power Steering Fluid",    "category":"Steering",    "unit_cost":350,  "current_stock":520, "reorder_point":20},
        {"product_id":"AP013","product_name":"Disc Brake Rotor",        "category":"Brakes",      "unit_cost":2200, "current_stock":380, "reorder_point":8},
        {"product_id":"AP014","product_name":"Cabin Air Filter",        "category":"Interior",    "unit_cost":520,  "current_stock":55,  "reorder_point":50},
        {"product_id":"AP015","product_name":"Exhaust Gasket Set",      "category":"Exhaust",     "unit_cost":680,  "current_stock":18,  "reorder_point":20},
    ]


def forecast_product(df, product_id):
    df["date"] = pd.to_datetime(df["date"])
    pdata  = df[df["product_id"]==product_id].sort_values("date").set_index("date")
    weekly = pdata["quantity_sold"].resample("W").sum()
    if len(weekly)<8: return None
    x = np.arange(len(weekly),dtype=float)
    y = weekly.values.astype(float)
    A = np.vstack([x,np.ones(len(x))]).T
    slope,_ = np.linalg.lstsq(A,y,rcond=None)[0]
    last30  = float(pdata["quantity_sold"].tail(30).mean())
    next30  = max(int(last30*30*(1+slope/(last30+1e-5)*0.3)),0)
    recent  = weekly.tail(12).reset_index()
    recent.columns=["week","sales"]
    chart = [{"week":r["week"].strftime("%b %d"),"sales":int(r["sales"]),"forecast":False}
             for _,r in recent.iterrows()]
    last_date = weekly.index[-1]
    for i in range(1,5):
        fw   = last_date+pd.Timedelta(weeks=i)
        proj = max(int(last30*7*(1+slope/(last30+1e-5)*0.1*i)),0)
        chart.append({"week":fw.strftime("%b %d"),"sales":proj,"forecast":True})
    last_m = float(pdata["quantity_sold"].tail(30).sum())
    prev_m = float(pdata["quantity_sold"].iloc[-60:-30].sum()) if len(pdata)>=60 else last_m
    mom    = round(((last_m-prev_m)/(prev_m+1e-5))*100,1)
    trend  = "up" if float(slope)>0.5 else "down" if float(slope)<-0.5 else "stable"
    return {"next_30_days":int(next30),"daily_avg":round(last30,1),
            "trend":trend,"trend_pct":round(float(slope/(last30+1e-5)*100),1),
            "mom_change":float(mom),"chart_data":chart}


def detect_dead_stock(df, product_id, current_stock, unit_cost):
    df["date"] = pd.to_datetime(df["date"])
    cutoff = df["date"].max()-pd.Timedelta(days=60)
    pdata  = df[(df["product_id"]==product_id)&(df["date"]>=cutoff)]
    avg    = float(pdata["quantity_sold"].mean()) if len(pdata)>0 else 0.0
    dos    = float(current_stock/avg) if avg>0 else 999.0
    return {"avg_daily_sales_60d":round(avg,1),"total_sales_60d":int(pdata["quantity_sold"].sum()),
            "days_of_stock":round(dos,0),"is_dead":bool(dos>90),"is_slow":bool(45<dos<=90),
            "capital_locked":int(current_stock*unit_cost) if dos>90 else 0}


def reorder_alert(df, product_id, current_stock, reorder_point, unit_cost):
    df["date"] = pd.to_datetime(df["date"])
    avg     = float(df[df["product_id"]==product_id]["quantity_sold"].tail(30).mean())
    days    = float(current_stock/avg) if avg>0 else 999.0
    qty     = int(avg*30)
    status  = "critical" if days<7 else "low" if days<15 else "ok"
    return {"current_stock":int(current_stock),"avg_daily_sales":round(avg,1),
            "days_remaining":round(days,1),"reorder_point":int(reorder_point),
            "suggested_reorder_qty":qty,"order_value":int(qty*unit_cost),
            "status":status,"needs_reorder":bool(current_stock<=reorder_point)}


def run_full_analysis(df, inventory_list):
    df["date"] = pd.to_datetime(df["date"])
    results = []
    for item in inventory_list:
        pid,stock,rp,cost = item["product_id"],item["current_stock"],item["reorder_point"],item["unit_cost"]
        fc = forecast_product(df,pid)
        ds = detect_dead_stock(df,pid,stock,cost)
        ra = reorder_alert(df,pid,stock,rp,cost)
        avg_rev = float(df[df["product_id"]==pid]["quantity_sold"].mean())*cost
        results.append({"product_id":pid,"product_name":item["product_name"],
            "category":item["category"],"unit_cost":int(cost),
            "forecast":fc,"dead_stock":ds,"reorder":ra,
            "avg_daily_revenue":float(round(avg_rev,0)),"abc_class":"C"})
    revs   = sorted([r["avg_daily_revenue"] for r in results],reverse=True)
    cumsum = np.cumsum(revs)
    tot    = float(cumsum[-1]) if cumsum[-1]>0 else 1.0
    for r in results:
        rk = sum(1 for v in revs if v>=r["avg_daily_revenue"])
        cp = float(cumsum[rk-1])/tot
        r["abc_class"] = "A" if cp<=0.80 else "B" if cp<=0.95 else "C"
    critical = [r for r in results if r["reorder"]["status"]=="critical"]
    low      = [r for r in results if r["reorder"]["status"]=="low"]
    dead     = [r for r in results if r["dead_stock"]["is_dead"]]
    slow     = [r for r in results if r["dead_stock"]["is_slow"]]
    trending_up = [r for r in results if r["forecast"] and r["forecast"]["trend"]=="up"]
    cat_rev  = {}
    for r in results:
        cat_rev[r["category"]] = cat_rev.get(r["category"],0)+r["avg_daily_revenue"]
    ok_count = len([r for r in results if r["reorder"]["status"]=="ok" and not r["dead_stock"]["is_dead"]])
    health   = int((ok_count/len(results))*100) if results else 0
    total_inv_value = sum(r["reorder"]["current_stock"]*r["unit_cost"] for r in results)
    summary = {
        "total_products":         int(len(results)),
        "critical_reorder_count": int(len(critical)),
        "low_stock_count":        int(len(low)),
        "dead_stock_count":       int(len(dead)),
        "slow_stock_count":       int(len(slow)),
        "trending_up_count":      int(len(trending_up)),
        "total_forecast_30d":     int(sum(r["forecast"]["next_30_days"] for r in results if r["forecast"])),
        "dead_stock_value":       int(sum(r["dead_stock"]["capital_locked"] for r in results)),
        "total_order_value":      int(sum(r["reorder"]["order_value"] for r in critical+low)),
        "inventory_health_score": health,
        "total_inventory_value":  int(total_inv_value),
        "category_revenue":       {k:round(v,0) for k,v in cat_rev.items()},
        "generated_at":           datetime.now().strftime("%d %b %Y, %I:%M %p"),
    }
    return {"summary":summary,"products":results}