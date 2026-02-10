import json
import webbrowser
from pathlib import Path


class DashboardGenerator:
    def __init__(self):
        self.root_dir = Path(__file__).resolve().parent.parent
        self.output_dir = self.root_dir / "output"
        self.html_file = self.root_dir / "index.html"

    def build(self):
        all_files = list(self.output_dir.glob("*.json"))
        if not all_files:
            print("No data found to build dashboard.")
            return

        # Generate HTML cards for each scrape session
        content = ""
        for file in sorted(all_files, reverse=True):
            with open(file, "r") as f:
                data = json.load(f)
                timestamp = data["metadata"]["timestamp"]
                keyword = data["metadata"].get("keyword_used", "None")
                headlines = data["headlines"]

                items = "".join([f"<li>{h}</li>" for h in headlines])
                content += f"""
                <article>
                    <header>
                        <strong>{timestamp}</strong> 
                        <mark style="float: right;">Keyword: {keyword}</mark>
                    </header>
                    <ul>{items}</ul>
                </article>
                """

        # The HTML Template using Pico CSS
        html_template = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
            <title>Tech News Feed</title>
        </head>
        <body>
            <main class="container">
                <hgroup>
                    <h1>My Awesome Project</h1>
                    <h2>Automated Hacker News Feed</h2>
                </hgroup>
                {content}
            </main>
        </body>
        </html>
        """

        with open(self.html_file, "w", encoding="utf-8") as f:
            f.write(html_template)

        # Open in default browser automatically
        webbrowser.open(f"file://{self.html_file}")
        print(f"Dashboard updated and opened!")


if __name__ == "__main__":
    dg = DashboardGenerator()
    dg.build()
