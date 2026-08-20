"""
CityPulse AI — DINOv2 Visual Embedding Service
facebook/dinov2-base — used for duplicate detection and resolution verification.
"""
from __future__ import annotations

try:
    from transformers import AutoImageProcessor, AutoModel
    import torch
except ImportError:
    AutoImageProcessor = AutoModel = None
    torch = None
from PIL import Image
import numpy as np
import os

_processor = None
_model     = None

EMBEDDINGS_DIR = os.path.join(os.getenv("DATA_DIR", "./data"), "embeddings")


def load_model():
    global _processor, _model
    if AutoImageProcessor is None or AutoModel is None or torch is None:
        return
    if _processor is None:
        try:
            _processor = AutoImageProcessor.from_pretrained("facebook/dinov2-base")
            _model     = AutoModel.from_pretrained("facebook/dinov2-base")
            _model.eval()
            print("[DINOv2Service] Model loaded.")
        except Exception as e:
            print(f"[DINOv2Service] Load failed: {e}")


def get_embedding(image_path: str) -> np.ndarray:
    """Return 768-dim DINOv2 CLS embedding for an image."""
    load_model()
    if _model is None or _processor is None:
        return np.zeros(768, dtype=np.float32)
    try:
        img    = Image.open(image_path).convert("RGB")
        inputs = _processor(images=img, return_tensors="pt")
        with torch.no_grad():
            outputs = _model(**inputs)
        return outputs.last_hidden_state[:, 0, :].squeeze().numpy()
    except Exception as e:
        print(f"[DINOv2Service] get_embedding error: {e}")
        return np.zeros(768, dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b) + 1e-8
    return float(np.dot(a, b) / denom)


def save_embedding(issue_id: str, image_path: str) -> str:
    """Compute and cache embedding to disk. Returns path."""
    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
    out = os.path.join(EMBEDDINGS_DIR, f"{issue_id}.npy")
    emb = get_embedding(image_path)
    np.save(out, emb)
    return out


def load_embedding(issue_id: str) -> np.ndarray | None:
    p = os.path.join(EMBEDDINGS_DIR, f"{issue_id}.npy")
    if not os.path.exists(p):
        return None
    return np.load(p)


def is_duplicate(
    new_image_path: str,
    existing_entries: list[dict],   # list of {"issue_id": str, "image_path": str}
    threshold: float = 0.92,
) -> tuple[bool, str | None, float]:
    """
    Returns (is_duplicate, matching_issue_id, similarity_score).
    existing_entries: list of dicts with issue_id + image_path keys.
    """
    new_emb = get_embedding(new_image_path)
    for entry in existing_entries:
        cached = load_embedding(entry["issue_id"])
        if cached is None:
            cached_path = entry.get("image_path", "")
            if not os.path.exists(cached_path):
                continue
            cached = get_embedding(cached_path)
        sim = cosine_similarity(new_emb, cached)
        if sim >= threshold:
            return True, entry["issue_id"], round(sim, 4)
    return False, None, 0.0


def verify_resolution_visual(before_path: str, after_path: str) -> dict:
    """
    Compare before/after embeddings to detect if visual appearance changed.
    Returns dict with similarity + resolved indicator.
    """
    before_emb = get_embedding(before_path)
    after_emb  = get_embedding(after_path)
    sim        = cosine_similarity(before_emb, after_emb)
    # Low similarity = images look different = repair likely made a change
    resolved   = sim < 0.75
    return {
        "visual_similarity": round(sim, 4),
        "visually_different": resolved,
        "dinov2_confidence":  round(1 - sim if resolved else sim, 4),
    }
