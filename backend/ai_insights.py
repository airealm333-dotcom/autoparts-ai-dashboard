# backend/ai_insights.py
import os
import anthropic
import json

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def generate_ai_analysis(report_data: dict) -> str:
    """
    Sends real inventory data to Claude and gets intelligent analysis back.
    """
    summary  = report_data["summary"]
    products = report_data["products"]

    # Build a clean data summary for Claude
    critical_parts = [p["product_name"] for p in products if p["reorder"]["status"] == "critical"]
    dead_parts     = [p["product_name"] for p in products if p["dead_stock"]["is_dead"]]
    trending_up    = [p["product_name"] for p in products if p["forecast"] and p["forecast"]["trend"] == "up"]
    trending_down  = [p["product_name"] for p in products if p["forecast"] and p["forecast"]["trend"] == "down"]

    top_products = sorted(products, key=lambda x: x["avg_daily_revenue"], reverse=True)[:5]
    top_list = [f"{p['product_name']} (Rs.{int(p['avg_daily_revenue'])}/day)" for p in top_products]

    mom_changes = []
    for p in products:
        if p["forecast"]:
            mom_changes.append(f"{p['product_name']}: {p['forecast']['mom_change']:+.1f}%")

    data_summary = f"""
You are an expert supply chain analyst for an automotive spare parts business.
Analyse this real inventory data and provide actionable insights.

INVENTORY SNAPSHOT:
- Total Parts: {summary['total_products']}
- Inventory Health Score: {summary['inventory_health_score']}%
- Total Inventory Value: Rs.{summary['total_inventory_value']:,}
- Dead Stock Capital Locked: Rs.{summary['dead_stock_value']:,}

STOCK ALERTS:
- Critical Stockout Risk (< 7 days): {', '.join(critical_parts) if critical_parts else 'None'}
- Dead Stock (90+ days): {', '.join(dead_parts) if dead_parts else 'None'}

DEMAND TRENDS:
- Trending UP: {', '.join(trending_up) if trending_up else 'None'}
- Trending DOWN: {', '.join(trending_down) if trending_down else 'None'}

TOP 5 REVENUE PARTS:
{chr(10).join(top_list)}

MONTH-OVER-MONTH CHANGES:
{chr(10).join(mom_changes)}

Provide a sharp, professional analysis with:
1. Top 3 urgent actions (be specific with part names and numbers)
2. One key opportunity being missed
3. One risk the owner may not have noticed
4. A one-sentence overall health assessment

Keep it under 250 words. Be direct and specific. No generic advice.
"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": data_summary}]
    )

    return message.content[0].text


def answer_inventory_question(question: str, report_data: dict) -> str:
    """
    Lets the user ask any question about their inventory in plain English.
    Claude reads the live data and answers intelligently.
    """
    summary  = report_data["summary"]
    products = report_data["products"]

    # Give Claude the full data as context
    product_details = []
    for p in products:
        product_details.append({
            "name":          p["product_name"],
            "category":      p["category"],
            "current_stock": p["reorder"]["current_stock"],
            "days_left":     p["reorder"]["days_remaining"],
            "status":        p["reorder"]["status"],
            "daily_sales":   p["reorder"]["avg_daily_sales"],
            "unit_cost":     p["unit_cost"],
            "forecast_30d":  p["forecast"]["next_30_days"] if p["forecast"] else 0,
            "trend":         p["forecast"]["trend"] if p["forecast"] else "unknown",
            "mom_change":    p["forecast"]["mom_change"] if p["forecast"] else 0,
            "dead_stock":    p["dead_stock"]["is_dead"],
            "days_of_stock": p["dead_stock"]["days_of_stock"],
            "abc_class":     p["abc_class"],
            "daily_revenue": p["avg_daily_revenue"],
        })

    context = f"""
You are an AI assistant for an automotive spare parts inventory system.
Answer the user's question using ONLY the real data provided below.
Be specific, use actual numbers and part names. Keep answer under 150 words.

LIVE INVENTORY DATA:
{json.dumps(product_details, indent=2)}

SUMMARY:
- Health Score: {summary['inventory_health_score']}%
- Critical Parts: {summary['critical_reorder_count']}
- Dead Stock Value: Rs.{summary['dead_stock_value']:,}
- 30-Day Forecast: {summary['total_forecast_30d']:,} units

USER QUESTION: {question}
"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=300,
        messages=[{"role": "user", "content": context}]
    )

    return message.content[0].text