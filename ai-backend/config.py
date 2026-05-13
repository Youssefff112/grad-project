"""Application configuration."""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App settings from env vars."""
    
    # Database
    database_url: str = "sqlite:///./gym.db"
    
    # OpenAI for chatbot (optional - set OPENAI_API_KEY in .env)
    openai_api_key: str = ""
    
    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
