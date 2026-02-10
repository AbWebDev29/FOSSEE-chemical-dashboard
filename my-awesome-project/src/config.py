import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    API_KEY = os.getenv("API_KEY")
    DEBUG = os.getenv("DEBUG_MODE") == "True"