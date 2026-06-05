from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL:     str
    DB_NAME:         str = "agriintel"
    MISTRAL_API_KEY: str = ""
    GROQ_API_KEY:    str = ""

    class Config:
        env_file = ".env"

settings = Settings()
