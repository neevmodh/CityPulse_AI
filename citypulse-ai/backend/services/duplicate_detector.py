from services.csv_store import CSVStore
from services.dinov2_service import DINOv2Service
import math

store = CSVStore()
dinov2 = DINOv2Service()

LOCATION_THRESHOLD_METERS = 100  # Issues within 100m considered nearby
EMBEDDING_SIMILARITY_THRESHOLD = 0.85
COMBINED_THRESHOLD = 0.75


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Distance in meters between two lat/lon points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class DuplicateDetector:
    def find_duplicates(self, new_issue: dict) -> list[dict]:
        """
        Returns list of potential duplicate issues with similarity scores.
        Checks:
        1. Same category + within 100m radius
        2. DINOv2 embedding similarity > threshold
        """
        issues = store.read_csv("issues")
        candidates = []

        try:
            new_lat = float(new_issue.get("latitude", 0))
            new_lon = float(new_issue.get("longitude", 0))
        except (ValueError, TypeError):
            return []

        new_embedding = dinov2.load_embedding(new_issue["id"])

        for issue in issues:
            if issue["id"] == new_issue["id"]:
                continue
            if issue["status"] == "resolved":
                continue
            if issue.get("category") != new_issue.get("category"):
                continue

            try:
                lat = float(issue.get("latitude", 0))
                lon = float(issue.get("longitude", 0))
            except (ValueError, TypeError):
                continue

            distance = _haversine(new_lat, new_lon, lat, lon)
            if distance > LOCATION_THRESHOLD_METERS:
                continue

            location_score = max(0, 1 - distance / LOCATION_THRESHOLD_METERS)

            embedding_score = 0.0
            if new_embedding is not None:
                existing_emb = dinov2.load_embedding(issue["id"])
                if existing_emb is not None:
                    embedding_score = dinov2.similarity(new_embedding, existing_emb)

            combined = (location_score * 0.4 + embedding_score * 0.6)
            if combined >= COMBINED_THRESHOLD:
                candidates.append({
                    "issue_id": issue["id"],
                    "title": issue.get("title", ""),
                    "distance_meters": round(distance, 1),
                    "location_score": round(location_score, 3),
                    "embedding_score": round(embedding_score, 3),
                    "combined_score": round(combined, 3),
                })

        candidates.sort(key=lambda x: x["combined_score"], reverse=True)
        return candidates
