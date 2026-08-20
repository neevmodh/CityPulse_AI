"""
CityPulse AI — YOLOv8 Road Damage Detection Service
Uses pretrained RDD (Road Damage Dataset) checkpoint.
Falls back to yolov8n.pt if RDD weights not available.
"""
import os
from typing import Optional

_model = None
WEIGHTS_PATH = os.getenv("YOLO_WEIGHTS", "./weights/yolov8_rdd.pt")

YOLO_CLASS_MAP = {
    # RDD dataset classes
    "D00": "longitudinal_crack",
    "D10": "transverse_crack",
    "D20": "alligator_crack",
    "D40": "pothole",
    # Integer fallbacks
    0: "pothole",
    1: "longitudinal_crack",
    2: "transverse_crack",
    3: "alligator_crack",
}


def get_model():
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO
        if os.path.exists(WEIGHTS_PATH):
            _model = YOLO(WEIGHTS_PATH)
            print(f"[YOLOService] Loaded RDD weights from {WEIGHTS_PATH}")
        else:
            print("[YOLOService] RDD weights not found — falling back to yolov8n.pt")
            _model = YOLO("yolov8n.pt")
        return _model
    except Exception as e:
        print(f"[YOLOService] Failed to load model: {e}")
        return None


def detect_road_damage(image_path: str) -> dict:
    """
    Run YOLO detection. Returns structured detection result.
    Safe — returns empty result if model unavailable.
    """
    model = get_model()
    if model is None:
        return {
            "detected": False,
            "primary_class": None,
            "primary_confidence": 0.0,
            "all_detections": [],
            "model": "unavailable",
        }

    try:
        results = model(image_path, conf=0.25, verbose=False)
        detections = []
        best_conf  = 0.0
        best_class = None

        for r in results:
            for box in r.boxes:
                cls_id     = int(box.cls[0])
                conf       = float(box.conf[0])
                class_name = YOLO_CLASS_MAP.get(cls_id, "road_damage")
                detections.append({
                    "class":      class_name,
                    "confidence": round(conf, 3),
                    "bbox":       [round(x, 1) for x in box.xyxy[0].tolist()],
                })
                if conf > best_conf:
                    best_conf  = conf
                    best_class = class_name

        return {
            "detected":            len(detections) > 0,
            "primary_class":       best_class,
            "primary_confidence":  round(best_conf, 3),
            "all_detections":      detections,
            "model":               "yolov8_rdd",
        }
    except Exception as e:
        print(f"[YOLOService] Detection error: {e}")
        return {
            "detected": False,
            "primary_class": None,
            "primary_confidence": 0.0,
            "all_detections": [],
            "model": "error",
        }
