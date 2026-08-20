from fastapi import APIRouter, HTTPException
from services.csv_store import read_csv
from services.risk_engine import compute_and_store, calculate_risk

router = APIRouter()


# POST /api/risk/compute/{issue_id}
@router.post("/compute/{issue_id}")
def compute_risk(issue_id: str):
    df = read_csv("issues")
    if df.empty or (df["id"] == issue_id).sum() == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue = df[df["id"] == issue_id].iloc[0].to_dict()

    # Count corroborating reports
    rdf   = read_csv("reports")
    count = 1
    if not rdf.empty and "issue_id" in rdf.columns:
        count = max(1, int((rdf["issue_id"] == issue_id).sum()))

    return compute_and_store(issue, report_count=count)


# GET /api/risk/score/{issue_id}
@router.get("/score/{issue_id}")
def get_risk_score(issue_id: str):
    df = read_csv("risk_scores")
    if df.empty or "issue_id" not in df.columns:
        raise HTTPException(status_code=404, detail="Risk score not found")
    rows = df[df["issue_id"] == issue_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Risk score not found")
    return rows.iloc[0].to_dict()


# GET /api/risk/leaderboard
@router.get("/leaderboard")
def leaderboard(limit: int = 10):
    df = read_csv("issues")
    if df.empty:
        return {"issues": []}
    open_df = df[df["status"] != "resolved"].copy()
    if "risk_score" in open_df.columns:
        open_df["_rs"] = open_df["risk_score"].apply(lambda x: float(x) if str(x).replace(".","").isdigit() else 0)
        open_df = open_df.sort_values("_rs", ascending=False).drop(columns=["_rs"])
    return {"issues": open_df.head(limit).to_dict("records")}


# POST /api/risk/recompute-all
@router.post("/recompute-all")
def recompute_all():
    df = read_csv("issues")
    if df.empty:
        return {"updated": 0}
    open_issues = df[df["status"] != "resolved"]
    count = 0
    for _, row in open_issues.iterrows():
        issue = row.to_dict()
        try:
            compute_and_store(issue)
            count += 1
        except Exception:
            pass
    return {"updated": count, "message": f"Recomputed risk for {count} issues"}
