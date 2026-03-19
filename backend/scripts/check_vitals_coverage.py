import json
import sys
from pathlib import Path


THRESHOLD = 95.0


def main() -> int:
    if len(sys.argv) != 2:
        print(
            "Usage: python backend/scripts/check_vitals_coverage.py <coverage-json-path>"
        )
        return 1

    report_path = Path(sys.argv[1])
    if not report_path.exists():
        print(f"Coverage JSON not found: {report_path}")
        return 1

    payload = json.loads(report_path.read_text(encoding="utf-8"))
    files = payload.get("files", {})

    failures: list[tuple[str, float]] = []
    for filename, details in sorted(files.items()):
        summary = details.get("summary", {})
        percent = float(summary.get("percent_covered", 0.0))
        if percent < THRESHOLD:
            failures.append((filename, percent))

    if not failures:
        print(f"Vitals backend per-file coverage OK (>= {THRESHOLD:.0f}%).")
        return 0

    print(f"Vitals backend per-file coverage failures (< {THRESHOLD:.0f}%):")
    for filename, percent in failures:
        print(f"- {filename}: {percent:.2f}%")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
