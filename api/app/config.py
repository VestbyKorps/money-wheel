from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Korps Årshjul"
    secret_key: str = "dev-secret-change-me-in-production"
    access_token_expire_minutes: int = 60 * 12
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./aarshjul.db"
    cors_origins: str = "http://localhost:3847,http://127.0.0.1:3847"
    seed_admin_email: str = "admin@korps.example"
    seed_admin_password: str = "admin123"
    seed_admin_name: str = "Administrator"

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        if origins == ["*"]:
            return ["*"]
        return origins

    @property
    def cors_allow_credentials(self) -> bool:
        # Starlette forbids credentials=True together with allow_origins=["*"]
        return self.cors_origin_list != ["*"]


settings = Settings()
