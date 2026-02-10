import json
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class Reporter:
    def __init__(self):
        self.output_dir = Path(__file__).resolve().parent.parent / "output"

    def generate_summary(self):
        all_files = list(self.output_dir.glob("headlines_*.json"))

        if not all_files:
            return "No data files found to report on."

        total_headlines = 0
        report = []

        # Sort files by date (based on filename)
        for file_path in sorted(all_files):
            with open(file_path, "r") as f:
                data = json.load(f)
                count = data["metadata"]["count"]
                total_headlines += count
                report.append(
                    f"{data['metadata']['timestamp']}: Found {count} headlines."
                )

        summary = (
            f"\n--- WEEKLY REPORT ---\n"
            f"Total Files Scanned: {len(all_files)}\n"
            f"Total Headlines Collected: {total_headlines}\n"
            f"----------------------\n"
        )
        return summary + "\n".join(report)


if __name__ == "__main__":
    rep = Reporter()
    print(rep.generate_summary())
