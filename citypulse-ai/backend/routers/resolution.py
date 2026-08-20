from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from services.csv_store import read_csv, append_row, update_row, new_id, now_iso
from services import gemini_service, dinov2_service
import shutil, os

router  = APIRouter()
UPLOADS = os.getenv("UPLOADS_DIR", "./uploads")


# POST /api/resolution/{issue_id}
@router.post("/{issue_id}", status_code=201)
async def resolve_issue(
    issue_id:    str,
    after_image: UploadFile        = File(...),
    notes:       str               = Form(""),
    officer_id:  str               = Form(...),
    latitude:    Optional[float]   = Form(None),
    longitude:   Optional[float]   = Form(None),
    started_at:  str               = Form(""),
    completed_at:str               = Form(""),
    time_taken_hours: Optional[float] = Form(None),
):
    # Load issue
    df   = read_csv("issues")
    rows = df[df["id"] == issue_id] if not df.empty else df
    if rows.empty:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue = rows.iloc[0].to_dict()

    # Save after-image
    os.makedirs(UPLOADS, exist_ok=True)
    ext        = os.path.splitext(after_image.filename or "img.jpg")[1] or ".jpg"
    after_fname = f"{issue_id}_after{ext}"
    after_path  = os.path.join(UPLOADS, after_fname)
    with open(after_path, "wb") as f:
        shutil.copyfileobj(after_image.file, f)

    before_path = os.path.join(".", issue.get("image_path", ""))

    # 1. DINOv2 visual comparison
    visual = {"visual_similarity": 0.5, "visually_different": True, "dinov2_confidence": 0.7}
    if os.path.exists(before_path):
        visual = dinov2_service.verify_resolution_visual(before_path, after_path)

    # 2. Gemini verification
    gemini_verify = {"verified": True, "confidence": 0.7, "reason": "Verification unavailable", "damage_still_present": False}
    if os.path.exists(before_path):
        gemini_verify = gemini_service.verify_resolution(before_path, after_path)

    # Combined verdict: both must agree
    verified = gemini_verify.get("verified", False) and visual.get("visually_different", False)
    v_score  = (gemini_verify.get("confidence", 0.7) + visual.get("dinov2_confidence", 0.7)) / 2
    v_reason = gemini_verify.get("reason", "")

    v_status = "verified" if verified else "failed"

    # Store resolution
    res_id = new_id("RES")
    append_row("resolutions", {
        "id":                  res_id,
        "issue_id":            issue_id,
        "officer_id":          officer_id,
        "before_image":        issue.get("image_path", ""),
        "after_image":         f"uploads/{after_fname}",
        "latitude":            latitude or issue.get("latitude", ""),
        "longitude":           longitude or issue.get("longitude", ""),
        "notes":               notes,
        "started_at":          started_at,
        "completed_at":        completed_at or now_iso(),
        "time_taken_hours":    time_taken_hours if time_taken_hours is not None else "",
        "verification_status": v_status,
        "verification_score":  round(v_score, 3),
        "verification_reason": v_reason,
        "resolved_at":         now_iso() if verified else "",
    })

    if verified:
        update_row("issues", "id", issue_id, {"status": "resolved", "updated_at": now_iso()})
        # Notify reporter
        try:
            from routers.notifications import notify_user, broadcast
            reporter_id = issue.get("reporter_id", "")
            if reporter_id:
                notify_user(reporter_id, "resolution", f"Issue {issue_id[:8].upper()} resolved!", f"Your reported issue has been resolved and verified by AI. Score: {v_score:.0%}", issue_id)
            broadcast("admin", "resolution", f"Issue resolved", f"Issue {issue_id[:8].upper()} resolved. Verification score: {v_score:.2f}", issue_id)
        except Exception:
            pass
        append_row("issue_history", {
            "id":         new_id("HIS"),
            "issue_id":   issue_id,
            "old_status": issue.get("status", "in_progress"),
            "new_status": "resolved",
            "changed_by": officer_id,
            "notes":      f"AI verified resolution. Score: {v_score:.2f}. {v_reason}",
            "timestamp":  now_iso(),
        })
    else:
        update_row("issues", "id", issue_id, {"status": "reopened", "updated_at": now_iso()})
        append_row("issue_history", {
            "id":         new_id("HIS"),
            "issue_id":   issue_id,
            "old_status": issue.get("status", "in_progress"),
            "new_status": "reopened",
            "changed_by": "system",
            "notes":      f"AI verification FAILED. Score: {v_score:.2f}. {v_reason}",
            "timestamp":  now_iso(),
        })

    return {
        "resolution_id":       res_id,
        "verification_status": v_status,
        "verification_score":  round(v_score, 3),
        "verification_reason": v_reason,
        "gemini_verify":       gemini_verify,
        "dinov2_visual":       visual,
    }


# GET /api/resolution/{issue_id}
@router.get("/{issue_id}")
def get_resolution(issue_id: str):
    df = read_csv("resolutions")
    if df.empty or "issue_id" not in df.columns:
        raise HTTPException(status_code=404, detail="Resolution not found")
    rows = df[df["issue_id"] == issue_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Resolution not found")
    return rows.iloc[0].to_dict()
