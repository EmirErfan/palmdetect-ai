import os
from sqlalchemy import create_engine, MetaData

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sawit.db")
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

meta = MetaData()
meta.reflect(bind=engine)

for table in reversed(meta.sorted_tables):
    print(f"Clearing table: {table}")
    with engine.begin() as conn:
        conn.execute(table.delete())

print("All data reset successfully!")
