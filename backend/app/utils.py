from collections import Counter
from typing import Dict, List


def build_platform_summary(records: List[dict], platforms: List[str]) -> Dict[str, int]:
    counts = Counter({platform: 0 for platform in platforms})
    for row in records:
        platform = str(row.get("Platform", "Unknown")).strip() or "Unknown"
        counts[platform] += 1
    return dict(counts)
