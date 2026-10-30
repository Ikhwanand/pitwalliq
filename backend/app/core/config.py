from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
# Load .env into os.environ so FastF1 and third-party libraries receive F1 credentials
load_dotenv(_BASE_DIR / ".env")
load_dotenv(_BASE_DIR.parent / ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "PitwallIQ API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Caching
    BASE_DIR: Path = _BASE_DIR
    CACHE_DIR: Path = _BASE_DIR / "cache" / "fastf1"
    FASTF1_CACHE_ENABLED: bool = True

    # Formula 1 Credentials for FastF1 Live Timing / Telemetry
    F1_USERNAME: str | None = None
    F1_PASSWORD: str | None = None

    # AI Model Providers
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "deepseek/deepseek-r1:free"
    OPENROUTER_DECISION_MODEL: str = "inception/mercury-decide:free"
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o"
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    NVIDIA_API_KEY: str | None = None
    NVIDIA_MODEL: str = "mistralai/mistral-large-4-1t-a52b"
    XKIRO_API_KEY: str | None = None 
    XKIRO_MODEL: str = "qwen/qwen3.8-max:free"
    
    model_config = SettingsConfigDict(
        env_file=(_BASE_DIR / ".env", ".env"),
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
