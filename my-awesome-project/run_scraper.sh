#!/bin/bash
# 1. Navigate to the project folder
cd /Users/anvibansal/FOSSEE/my-awesome-project

# 2. Activate the virtual environment
source .venv/bin/activate

# 3. Run the scraper with your favorite settings
python src/main.py --limit 20 --keyword "AI"

# 4. Deactivate
deactivate