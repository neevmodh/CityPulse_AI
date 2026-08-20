from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.csv_store import read_csv, append_row, new_id, now_iso
from services import gemini_service, yolo_service, dinov2_service, risk_engine
import shutil, os

router  = APIRouter()
UPLOADS = os.getenv("UPLOADS_DIR", "./uploads")


# POST /api/ai/analyze  — full pipeline: YOLO + Gemini + risk engine
@router.post("/analyze")
async def analyze(
    image:     UploadFile        = File(...),
    latitude:  float             = Form(...),
    longitude: float             = Form(...),
    issue_id:  str               = Form(""),
):
    os.makedirs(UPLOADS, exist_ok=True)
    tmp_id   = issue_id or new_id("TMP")
    ext      = os.path.splitext(image.filename or "img.jpg")[1] or ".jpg"
    tmp_path = os.path.join(UPLOADS, f"tmp_{tmp_id}{ext}")

    with open(tmp_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        yolo_result   = yolo_service.detect_road_damage(tmp_path)
        gemini_result = gemini_service.analyze_image(tmp_path)

        # Persist DINOv2 embedding
        if issue_id:
            dinov2_service.save_embedding(issue_id, tmp_path)

        # Merge category
        final_category = (
            yolo_result["primary_class"]
            if yolo_result["detected"] and yolo_result["primary_confidence"] > 0.4
            else gemini_result.get("category", "other")
        )

        # Risk score
        issue_stub = {
            "id":       issue_id or tmp_id,
            "category": final_category,
            "severity": gemini_result.get("severity", "medium"),
            "ward_id":  "w01",
            "latitude": latitude,
            "longitude": longitude,
        }
        risk = risk_engine.calculate_risk(
            severity  = gemini_result.get("severity", "medium"),
            category  = final_category,
            latitude  = latitude,
            longitude = longitude,
        )

        # Store analysis if issue_id provided
        if issue_id:
            append_row("ai_analyses", {
                "id":                 new_id("ANA"),
                "issue_id":           issue_id,
                "model":              "gemini-1.5-flash+yolov8",
                "category":           final_category,
                "confidence":         gemini_result.get("confidence", 0.7),
                "severity":           gemini_result.get("severity", "medium"),
                "summary":            gemini_result.get("description", ""),
                "reasoning":          gemini_result.get("gemini_reasoning", ""),
                "recommended_action": gemini_result.get("recommended_action", ""),
                "raw_response":       "",
                "created_at":         now_iso(),
            })

        return {
            "gemini":   gemini_result,
            "yolo":     yolo_result,
            "risk":     risk,
            "category": final_category,
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# GET /api/ai/analysis/{issue_id}
@router.get("/analysis/{issue_id}")
def get_analysis(issue_id: str):
    df = read_csv("ai_analyses")
    if df.empty or "issue_id" not in df.columns:
        raise HTTPException(status_code=404, detail="Analysis not found")
    rows = df[df["issue_id"] == issue_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return rows.iloc[0].to_dict()


@router.post("/quick-analyze")
async def quick_analyze(image: UploadFile = File(...)):
    """Fast citizen preview used before location and final submission."""
    os.makedirs(UPLOADS, exist_ok=True)
    tmp_path = os.path.join(UPLOADS, f"quick_{new_id('IMG')}{os.path.splitext(image.filename or 'img.jpg')[1] or '.jpg'}")
    with open(tmp_path, "wb") as handle:
        shutil.copyfileobj(image.file, handle)
    try:
        yolo_result = yolo_service.detect_road_damage(tmp_path)
        gemini_result = gemini_service.analyze_image(tmp_path)
        category = (
            yolo_result.get("primary_class")
            if yolo_result.get("detected") and yolo_result.get("primary_confidence", 0) > 0.4
            else gemini_result.get("category", "other")
        )
        severity = gemini_result.get("severity", "medium")
        risk = risk_engine.calculate_risk(severity, category, 0, 0)
        return {
            **gemini_result,
            "category": category,
            "severity": severity,
            "risk_score": risk["final_score"],
            "priority": risk["priority"],
            "summary": gemini_result.get("description", ""),
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
