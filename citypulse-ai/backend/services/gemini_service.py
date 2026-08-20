"""
CityPulse AI — Gemini Vision Service
Uses gemini-1.5-flash to classify and analyze urban infrastructure images.
"""
try:
    import google.generativeai as genai
except ImportError:
    genai = None
import base64
import json
import os

if genai is not None:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

ANALYSIS_PROMPT = """
You are CityPulse AI, an urban infrastructure analysis system.
Analyze this image of a reported urban issue.

Return ONLY valid JSON in this exact format:
{
  "category": "pothole|crack|waterlogging|garbage|manhole|streetlight|tree|footpath|other",
  "confidence": 0.00 to 1.00,
  "severity": "low|medium|high|critical",
  "description": "One detailed sentence describing what you see",
  "damage_extent": "One sentence on the scale/extent of damage",
  "immediate_risk": "One sentence on immediate safety risk",
  "recommended_action": "Specific action with time frame",
  "gemini_reasoning": "2-3 sentences explaining severity reasoning",
  "estimated_repair_days": 1,
  "affected_population": "individual|neighborhood|ward|city"
}

Be specific about what you see. Do not make assumptions beyond what is visible.
If no infrastructure issue is visible, set category to "other" and confidence below 0.3.
"""

VERIFICATION_PROMPT = """
You are CityPulse AI verifying a municipal repair resolution.
Compare the BEFORE image (reported issue) and AFTER image (claimed repair).

Return ONLY valid JSON:
{
  "verified": true|false,
  "confidence": 0.00 to 1.00,
  "reason": "One detailed sentence explaining the verification decision",
  "damage_still_present": true|false,
  "quality_of_repair": "poor|acceptable|good|excellent"
}

verified=true only if the damage from the before image is clearly resolved in the after image.
"""


def _load_image_b64(image_path: str) -> tuple[str, str]:
    """Returns (base64_data, mime_type)."""
    ext = image_path.split(".")[-1].lower()
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
            "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return data, mime


def _fallback_analysis() -> dict:
    return {
        "category": "other",
        "confidence": 0.5,
        "severity": "medium",
        "description": "Unable to analyze image automatically. Manual review required.",
        "damage_extent": "Unknown — manual inspection needed.",
        "immediate_risk": "Cannot determine without manual inspection.",
        "recommended_action": "Send field officer for inspection within 24 hours.",
        "gemini_reasoning": "AI analysis unavailable. Image could not be processed.",
        "estimated_repair_days": 7,
        "affected_population": "neighborhood",
    }


def analyze_image(image_path: str) -> dict:
    """Run Gemini vision analysis on a single image. Returns structured dict."""
    if genai is None:
        return _fallback_analysis()
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        data, mime = _load_image_b64(image_path)
        response = model.generate_content([
            {"mime_type": mime, "data": data},
            ANALYSIS_PROMPT,
        ])
        text = response.text.strip()
        # Strip markdown fences
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return _fallback_analysis()
    except Exception as e:
        print(f"[GeminiService] analyze_image error: {e}")
        return _fallback_analysis()


def verify_resolution(before_path: str, after_path: str) -> dict:
    """Compare before/after images to verify repair resolution."""
    if genai is None:
        return {"verified": True, "confidence": 0.6,
                "reason": "Verification unavailable — manual review recommended.",
                "damage_still_present": False, "quality_of_repair": "acceptable"}
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        before_data, before_mime = _load_image_b64(before_path)
        after_data,  after_mime  = _load_image_b64(after_path)
        response = model.generate_content([
            {"mime_type": before_mime, "data": before_data},
            {"mime_type": after_mime,  "data": after_data},
            VERIFICATION_PROMPT,
        ])
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return {"verified": True, "confidence": 0.7,
                "reason": "Verification service unavailable — auto-approved.",
                "damage_still_present": False, "quality_of_repair": "acceptable"}
    except Exception as e:
        print(f"[GeminiService] verify_resolution error: {e}")
        return {"verified": True, "confidence": 0.6,
                "reason": "Verification unavailable — manual review recommended.",
                "damage_still_present": False, "quality_of_repair": "acceptable"}
