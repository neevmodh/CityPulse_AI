from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from typing import Optional
from services.csv_store import read_csv, append_row, update_row, new_id, now_iso
from services import gemini_service, yolo_service, risk_engine, voice_service
import shutil, os, math

router    = APIRouter()
UPLOADS   = os.getenv("UPLOADS_DIR", "./uploads")


def _save_upload(file: UploadFile, issue_id: str) -> str:
    os.makedirs(UPLOADS, exist_ok=True)
    ext  = os.path.splitext(file.filename or "img.jpg")[1] or ".jpg"
    fname = f"{issue_id}{ext}"
    with open(os.path.join(UPLOADS, fname), "wb") as f:
        shutil.copyfileobj(file.file, f)
    return f"uploads/{fname}"


def _issue_to_dict(row) -> dict:
    result = {
        k: "" if v is None or (isinstance(v, float) and math.isnan(v)) or v == "nan" else v
        for k, v in row.items()
    }
    result.setdefault("title", f"{str(result.get('category', 'Civic issue')).replace('_', ' ').title()} reported at {result.get('ward_id', 'city')}" )
    result.setdefault("ward", result.get("ward_id", ""))
    result.setdefault("reported_by", result.get("reporter_id", ""))
    priority_map = {"P1": "critical", "P2": "high", "P3": "medium", "P4": "low"}
    result["priority"] = priority_map.get(result.get("priority"), result.get("priority", "medium"))
    return result


# POST /api/issues  — create + auto-run full AI pipeline
@router.post("/", status_code=201)
async def create_issue(
    image:       UploadFile          = File(...),
    audio:       Optional[UploadFile] = File(None),
    latitude:    float               = Form(...),
    longitude:   float               = Form(...),
    description: str                 = Form(""),
    category:    Optional[str]       = Form(None),
    reporter_id: str                 = Form(...),
    ward_id:     Optional[str]       = Form(None),
    voice_language: str               = Form("auto"),
    voice_transcript: str             = Form(""),
):
    issue_id   = new_id("CP-")
    image_path = _save_upload(image, issue_id)
    full_path  = os.path.join(".", image_path)

    voice_result = None
    if audio and audio.filename:
        os.makedirs(UPLOADS, exist_ok=True)
        audio_ext = os.path.splitext(audio.filename)[1] or ".webm"
        audio_fname = f"{issue_id}_voice{audio_ext}"
        audio_path = os.path.join(UPLOADS, audio_fname)
        with open(audio_path, "wb") as handle:
            shutil.copyfileobj(audio.file, handle)
        voice_result = voice_service.transcribe(audio_path, voice_language, voice_transcript)
        append_row("voice_reports", {
            "id": new_id("VOI"),
            "issue_id": issue_id,
            "audio_path": f"uploads/{audio_fname}",
            **voice_result,
            "created_at": now_iso(),
        })

    # 1. YOLO road damage detection
    yolo_result = yolo_service.detect_road_damage(full_path)

    # 2. Gemini vision analysis
    gemini_result = gemini_service.analyze_image(full_path)

    # Merge category: prefer YOLO if it detected road damage, else Gemini
    final_category = (
        yolo_result["primary_class"]
        if yolo_result["detected"] and yolo_result["primary_confidence"] > 0.4
        else category or gemini_result.get("category", "other")
    )
    severity       = gemini_result.get("severity", "medium")
    ai_model_label = "gemini-1.5-flash+yolov8"

    # 3. Store AI analysis
    analysis_id = new_id("ANA")
    append_row("ai_analyses", {
        "id":                analysis_id,
        "issue_id":          issue_id,
        "model":             ai_model_label,
        "category":          final_category,
        "confidence":        gemini_result.get("confidence", 0.7),
        "severity":          severity,
        "summary":           gemini_result.get("description", ""),
        "reasoning":         gemini_result.get("gemini_reasoning", ""),
        "recommended_action":gemini_result.get("recommended_action", ""),
        "raw_response":      "",
        "created_at":        now_iso(),
    })

    # 4. Risk engine
    issue_stub = {
        "id":        issue_id,
        "category":  final_category,
        "severity":  severity,
        "ward_id":   ward_id or "w01",
        "latitude":  latitude,
        "longitude": longitude,
    }
    risk_scores = risk_engine.compute_and_store(issue_stub, report_count=1)

    # 5. Store issue
    append_row("issues", {
        "id":            issue_id,
        "issue_code":    f"CP-{issue_id[:4].upper()}",
        "reporter_id":   reporter_id,
        "category":      final_category,
        "description":   description or gemini_result.get("description", ""),
        "image_path":    image_path,
        "latitude":      latitude,
        "longitude":     longitude,
        "ward_id":       ward_id or "w01",
        "severity":      severity,
        "risk_score":    risk_scores["final_score"],
        "priority":      risk_scores["priority"],
        "status":        "ai_analyzed",
        "assigned_to":   "",
        "department_id": "",
        "created_at":    now_iso(),
        "updated_at":    now_iso(),
    })

    # 6. History entry
    append_row("issue_history", {
        "id":         new_id("HIS"),
        "issue_id":   issue_id,
        "old_status": "reported",
        "new_status": "ai_analyzed",
        "changed_by": "system",
        "notes":      f"AI analysis complete. {final_category} detected {gemini_result.get('confidence', 0.7):.0%} confidence.",
        "timestamp":  now_iso(),
    })

    return {
        "issue_id":   issue_id,
        "issue_code": f"CP-{issue_id[:4].upper()}",
        "analysis":   {**gemini_result, **yolo_result},
        "risk":       risk_scores,
    }


# GET /api/issues
@router.get("/")
def list_issues(
    role:       Optional[str] = Query(None),
    user_id:    Optional[str] = Query(None),
    officer_id: Optional[str] = Query(None),
    status:     Optional[str] = Query(None),
    category:   Optional[str] = Query(None),
    ward_id:    Optional[str] = Query(None),
    priority:   Optional[str] = Query(None),
    limit:      int           = Query(100, le=500),
    offset:     int           = Query(0),
):
    df = read_csv("issues")
    if df.empty:
        return {"total": 0, "issues": []}

    # Role-based filtering
    if role == "citizen" and user_id:
        df = df[df["reporter_id"] == user_id]
    elif role == "worker" and officer_id:
        df = df[df["assigned_to"] == officer_id]

    if status:   df = df[df["status"]   == status]
    if category: df = df[df["category"] == category]
    if ward_id:  df = df[df["ward_id"]  == ward_id]
    if priority: df = df[df["priority"] == priority]

    # Sort by risk score desc
    if "risk_score" in df.columns:
        df["_rs"] = df["risk_score"].apply(lambda x: float(x) if str(x).replace(".","").isdigit() else 0)
        df = df.sort_values("_rs", ascending=False).drop(columns=["_rs"])

    total  = len(df)
    page   = df.iloc[offset: offset + limit]
    issues = [_issue_to_dict(r) for r in page.to_dict("records")]
    return {"total": total, "issues": issues}


@router.get("/citizen/{user_id}")
def citizen_issues(user_id: str, limit: int = Query(100, le=500)):
    return list_issues(role="citizen", user_id=user_id, limit=limit)


@router.get("/worker/{worker_id}")
def worker_issues(worker_id: str, limit: int = Query(100, le=500)):
    return list_issues(role="worker", officer_id=worker_id, limit=limit)


# GET /api/issues/{id}
@router.get("/{issue_id}")
def get_issue(issue_id: str):
    df = read_csv("issues")
    rows = df[df["id"] == issue_id] if not df.empty else df
    if rows.empty:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue = _issue_to_dict(rows.iloc[0].to_dict())

    # Analysis
    adf   = read_csv("ai_analyses")
    analysis = None
    if not adf.empty and "issue_id" in adf.columns:
        arows = adf[adf["issue_id"] == issue_id]
        if not arows.empty:
            analysis = _issue_to_dict(arows.iloc[0].to_dict())

    # History
    hdf = read_csv("issue_history")
    history = []
    if not hdf.empty and "issue_id" in hdf.columns:
        hrows = hdf[hdf["issue_id"] == issue_id].sort_values("timestamp", ascending=False)
        history = [_issue_to_dict(row) for row in hrows.to_dict("records")]

    # Risk
    rdf = read_csv("risk_scores")
    risk = None
    if not rdf.empty and "issue_id" in rdf.columns:
        rrows = rdf[rdf["issue_id"] == issue_id]
        if not rrows.empty:
            risk = _issue_to_dict(rrows.iloc[0].to_dict())

    resolution = None
    resolution_df = read_csv("resolutions")
    if not resolution_df.empty and "issue_id" in resolution_df.columns:
        resolution_rows = resolution_df[resolution_df["issue_id"] == issue_id]
        if not resolution_rows.empty:
            resolution = _issue_to_dict(resolution_rows.iloc[-1].to_dict())

    voice = None
    voice_df = read_csv("voice_reports")
    if not voice_df.empty and "issue_id" in voice_df.columns:
        voice_rows = voice_df[voice_df["issue_id"] == issue_id]
        if not voice_rows.empty:
            voice = _issue_to_dict(voice_rows.iloc[-1].to_dict())

    return {"issue": issue, "analysis": analysis, "history": history, "risk": risk, "resolution": resolution, "voice": voice}


# PATCH /api/issues/{id}/status
@router.patch("/{issue_id}/status")
def update_status(issue_id: str, status: str, notes: str = "", changed_by: str = "system"):
    df = read_csv("issues")
    if df.empty or (df["id"] == issue_id).sum() == 0:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_status = df[df["id"] == issue_id].iloc[0].get("status", "")
    update_row("issues", "id", issue_id, {"status": status, "updated_at": now_iso()})

    append_row("issue_history", {
        "id":         new_id("HIS"),
        "issue_id":   issue_id,
        "old_status": old_status,
        "new_status": status,
        "changed_by": changed_by,
        "notes":      notes or f"Status updated to {status}",
        "timestamp":  now_iso(),
    })
    return {"message": "Status updated", "new_status": status}
