import requests
import json
import logging
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class DataProcessor:
    def __init__(self, api_key):
        """
        Initializes the processor with an API key and the target URL.
        """
        self.api_key = api_key
        self.url = "https://news.ycombinator.com/"

        # Ensure an 'output' directory exists to keep the root clean
        self.output_dir = Path(__file__).resolve().parent.parent / "output"
        self.output_dir.mkdir(exist_ok=True)

    def run_task(self, limit=5, keyword=""):
        """
        Fetches headlines, filters them by keyword, and saves to a unique JSON file.
        """
        logger.info(f"Connecting to {self.url}...")

        try:
            # 1. Fetch the webpage
            response = requests.get(self.url, timeout=10)
            response.raise_for_status()

            # 2. Parse HTML
            soup = BeautifulSoup(response.text, "html.parser")
            all_headlines = [
                span.get_text() for span in soup.select("span.titleline > a")
            ]

            # 3. Apply keyword filter (case-insensitive)
            if keyword:
                logger.info(f"Filtering for keyword: '{keyword}'")
                all_headlines = [
                    h for h in all_headlines if keyword.lower() in h.lower()
                ]

            # 4. Apply limit
            final_headlines = all_headlines[:limit]

            # 5. Generate a unique filename based on current time
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = self.output_dir / f"headlines_{timestamp}.json"

            # 6. Save data to JSON
            output_data = {
                "metadata": {
                    "timestamp": timestamp,
                    "keyword_used": keyword,
                    "count": len(final_headlines),
                },
                "headlines": final_headlines,
            }

            with open(filename, "w", encoding="utf-8") as f:
                json.dump(output_data, f, indent=4)

            logger.info(
                f"Successfully saved {len(final_headlines)} headlines to {filename.name}"
            )

            return final_headlines

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error occurred: {e}")
            return []
        except Exception as e:
            logger.error(f"An unexpected error occurred: {e}")
            return []


if __name__ == "__main__":
    # Quick internal test
    proc = DataProcessor(api_key="test_mode")
    print(proc.run_task(limit=3))
