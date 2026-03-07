
from pydantic import BaseModel
from ai_insights import generate_ai_analysis, answer_inventory_question
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

from engine import generate_sample_data, get_default_inventory, run_full_analysis

app = FastAPI(title="StockSense AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "StockSense AI is running!"}

@app.get("/api/demo")
def get_demo():
    df        = generate_sample_data()
    inventory = get_default_inventory()
    return run_full_analysis(df, inventory)

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported.")
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read CSV: {str(e)}")

    required = {"date", "product_id", "product_name", "category", "quantity_sold", "unit_cost"}
    missing  = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing)}")

    df["date"] = pd.to_datetime(df["date"])
    inventory  = []
    for pid, group in df.groupby("product_id"):
        avg = group.sort_values("date").tail(7)["quantity_sold"].mean()
        row = group.iloc[0]
        inventory.append({
            "product_id":    str(pid),
            "product_name":  str(row["product_name"]),
            "category":      str(row["category"]),
            "unit_cost":     int(row["unit_cost"]),
            "current_stock": max(int(avg * 5), 1),
            "reorder_point": max(int(avg * 7), 1),
        })

    return run_full_analysis(df, inventory)

@app.get("/api/sample-csv")
def sample_csv():
    df     = generate_sample_data()
    sample = df.head(60).to_csv(index=False)
    return {"csv": sample, "filename": "stocksense_sample.csv"}

@app.get("/api/ai-analysis")
def get_ai_analysis():
    """Claude reads your real data and writes a custom analysis."""
    df        = generate_sample_data()
    inventory = get_default_inventory()
    report    = run_full_analysis(df, inventory)
    analysis  = generate_ai_analysis(report)
    return {"analysis": analysis}


class QuestionRequest(BaseModel):
    question: str

@app.post("/api/ask")
def ask_question(req: QuestionRequest):
    """Ask Claude anything about your inventory in plain English."""
    df        = generate_sample_data()
    inventory = get_default_inventory()
    report    = run_full_analysis(df, inventory)
    answer    = answer_inventory_question(req.question, report)
    return {"answer": answer}
