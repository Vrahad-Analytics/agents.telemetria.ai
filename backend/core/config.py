from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = ROOT_DIR / "telemetria_dev.db"
DEFAULT_RAW_LOGS = ROOT_DIR / "data" / "raw_logs"


class Settings(BaseSettings):
    PROJECT_NAME: str = "agents.telemetria.ai"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/v1"
    
    # Operational Database
    # Default to sqlite local file if POSTGRES_URL not provided, fully compatible with Postgres URL
    DATABASE_URL: str = Field(
        default=f"sqlite:///{DEFAULT_DB_PATH}",
        description="SQLAlchemy database connection string. e.g. postgresql+psycopg2://user:pass@localhost:5432/telemetria",
    )
    
    # Secret key for JWT / internal token signing
    SECRET_KEY: str = "telemetria-super-secret-key-change-in-production-32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Raw Telemetry Storage (Staging for PySpark ingestion)
    RAW_LOGS_DIR: Path = DEFAULT_RAW_LOGS
    
    # AI Gateway Provider API Keys
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_BASE_URL: str = "https://api.anthropic.com/v1"
    
    # Gateway mock mode for local testing without active API keys
    GATEWAY_MOCK_MODE: bool = False

    # MongoDB Atlas Configuration
    MONGODB_URI: str = Field(
        default="mongodb+srv://talk_db_user:D6Emzx8Z87Sk9K4u@vrahad-analytics-cluste.laihf2o.mongodb.net/?appName=Vrahad-analytics-Cluster",
        description="MongoDB connection URI",
    )
    MONGODB_USERNAME: str = "talk_db_user"
    MONGODB_PASSWORD: str = "D6Emzx8Z87Sk9K4u"
    MONGODB_DB_NAME: str = "telemetria_agents"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
