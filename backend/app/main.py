from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database.config import engine, Base
from app.models import user_db, department_db, employee_db, role_request_db, company_db, audit_log_db, invitation_db
from app.routes import user_routes, employee_routes, department_routes, company_routes, audit_routes, analytics_routes


def ensure_audit_log_table():
    inspector = inspect(engine)
    if 'audit_logs' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('audit_logs')}
        expected_columns = {'id', 'event_type', 'description', 'actor_id', 'company_id', 'created_at'}

        if not expected_columns.issubset(existing_columns) or existing_columns - expected_columns:
            with engine.begin() as conn:
                conn.execute(text('DROP TABLE IF EXISTS audit_logs'))

ensure_audit_log_table()

def ensure_user_status_column():
    inspector = inspect(engine)
    if 'users' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        if 'status' not in existing_columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'Active'"))

ensure_user_status_column()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "API Running"}


app.include_router(user_routes.router)
app.include_router(employee_routes.router)
app.include_router(department_routes.router)
app.include_router(company_routes.router)
app.include_router(audit_routes.router)
app.include_router(analytics_routes.router)
