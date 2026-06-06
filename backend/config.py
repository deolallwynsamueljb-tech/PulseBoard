from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL:     str = ""
    MONGO_USERNAME:  str = ""
    MONGO_PASSWORD:  str = ""
    MONGO_HOST:      str = "cluster0.d09nwvq.mongodb.net"
    DB_NAME:         str = "agriintel"
    MISTRAL_API_KEY: str = ""
    GROQ_API_KEY:    str = ""
    GOOGLE_API_KEY:  str = ""

    class Config:
        env_file = ".env"

settings = Settings()
