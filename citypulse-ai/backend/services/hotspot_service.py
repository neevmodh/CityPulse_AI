from services.csv_store import read_csv, write_csv
import math, uuid
from datetime import datetime, timezone

HOTSPOT_RADIUS_METERS = 300
MIN_ISSUES_FOR_HOTSPOT = 3


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class HotspotService:
    def detect_hotspots(self) -> list[dict]:
        """
        Cluster open issues by proximity. Groups within HOTSPOT_RADIUS_METERS
        with MIN_ISSUES_FOR_HOTSPOT+ issues are flagged as hotspots.
        """
        issues = read_csv("issues").fillna("").to_dict("records")
        open_issues = [
            i for i in issues
            if i["status"] != "resolved"
        ]

        visited = set()
        hotspots = []

        for i, issue in enumerate(open_issues):
            if issue["id"] in visited:
                continue
            try:
                lat = float(issue.get("latitude", 0))
                lon = float(issue.get("longitude", 0))
            except (ValueError, TypeError):
                continue

            cluster = [issue]
            for j, other in enumerate(open_issues):
                if i == j or other["id"] in visited:
                    continue
                try:
                    olat = float(other.get("latitude", 0))
                    olon = float(other.get("longitude", 0))
                except (ValueError, TypeError):
                    continue
                if _haversine(lat, lon, olat, olon) <= HOTSPOT_RADIUS_METERS:
                    cluster.append(other)

            if len(cluster) >= MIN_ISSUES_FOR_HOTSPOT:
                for c in cluster:
                    visited.add(c["id"])

                avg_lat = sum(float(c.get("latitude", 0)) for c in cluster) / len(cluster)
                avg_lon = sum(float(c.get("longitude", 0)) for c in cluster) / len(cluster)
                avg_risk = sum(float(c.get("risk_score", 0)) for c in cluster) / len(cluster)

                cat_counts: dict = {}
                for c in cluster:
                    cat = c.get("category", "other")
                    cat_counts[cat] = cat_counts.get(cat, 0) + 1
                dominant_cat = max(cat_counts, key=cat_counts.get)

                severity = (
                    "critical" if avg_risk >= 85 else
                    "high" if avg_risk >= 65 else
                    "medium"
                )

                hotspots.append({
                    "id": f"HSP{str(uuid.uuid4())[:6].upper()}",
                    "ward": cluster[0].get("ward_id", ""),
                    "latitude": round(avg_lat, 6),
                    "longitude": round(avg_lon, 6),
                    "radius_meters": HOTSPOT_RADIUS_METERS,
                    "issue_count": len(cluster),
                    "dominant_category": dominant_cat,
                    "avg_risk_score": round(avg_risk, 2),
                    "severity": severity,
                    "detected_at": datetime.now(timezone.utc).isoformat(),
                    "is_active": "true",
                })

        # Persist
        if hotspots:
            write_csv("hotspots", __import__("pandas").DataFrame(hotspots))
        return hotspots


def detect_hotspots() -> list[dict]:
    return HotspotService().detect_hotspots()
