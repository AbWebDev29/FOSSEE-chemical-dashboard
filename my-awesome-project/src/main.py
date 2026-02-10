import os
import logging
import argparse
from pathlib import Path
from dotenv import load_dotenv
from processor import DataProcessor

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Setup Environment
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)


def main():
    parser = argparse.ArgumentParser(description="Professional Python Scraper CLI")
    parser.add_argument(
        "--limit", type=int, default=5, help="Number of headlines to fetch"
    )
    parser.add_argument(
        "--keyword", type=str, default="", help="Filter headlines by keyword"
    )
    parser.add_argument(
        "--visual", action="store_true", help="Open results in the web dashboard"
    )
    # --- NEW: The missing flag ---
    parser.add_argument(
        "--report", action="store_true", help="Generate a summary report of stored data"
    )

    args = parser.parse_args()
    if args.visual:
        from dashboard import DashboardGenerator

        dg = DashboardGenerator()
        dg.build()
    # Handle Reporting Mode
    if args.report:
        from reporter import Reporter

        rep = Reporter()
        print(rep.generate_summary())
        return  # Stop here so we don't run a new scrape

    # Handle Scraping Mode
    api_key = os.getenv("API_KEY")
    if not api_key:
        logger.error("API_KEY is missing!")
        return

    processor = DataProcessor(api_key)
    results = processor.run_task(limit=args.limit, keyword=args.keyword)

    print("\n--- NEW SCRAPE RESULTS ---")
    for i, title in enumerate(results, 1):
        print(f"{i}. {title}")


if __name__ == "__main__":
    main()
