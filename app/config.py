import os

APP_NAME = "Vehicle Service Centre Management System"

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017/?replicaSet=rs0&directConnection=true",
)
MONGO_DB = os.getenv("MONGO_DB", "vsc_system")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
