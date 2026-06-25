from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database.config import engine, Base
from app.models import user_db, department_db, employee_db, role_request_db, company_db, audit_log_db, invitation_db, reactivation_request_db, attendance_request_db, attendance_log_db, leave_request_db, department_transfer_db, notification_db, export_log_db, reinstatement_request_db
from app.routes import user_routes, employee_routes, department_routes, company_routes, audit_routes, analytics_routes, attendance_routes, leave_routes, notification_routes, export_routes


def ensure_audit_log_table():
    """
    Check if the 'audit_logs' table exists and has the expected columns.
    If the columns do not match the expected schema, drop the table so it can be recreated.
    """
    inspector = inspect(engine)
    if 'audit_logs' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('audit_logs')}
        expected_columns = {'id', 'event_type', 'description', 'actor_id', 'company_id', 'created_at'}

        if not expected_columns.issubset(existing_columns) or existing_columns - expected_columns:
            with engine.begin() as conn:
                conn.execute(text('DROP TABLE IF EXISTS audit_logs'))

ensure_audit_log_table()

def ensure_user_columns():
    """
    Ensure the 'users' table has all required columns.
    Adds missing columns dynamically if they do not exist.
    """
    inspector = inspect(engine)
    if 'users' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        with engine.begin() as conn:
            if 'status' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'Active'"))
            if 'deactivated_by' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN deactivated_by INTEGER"))
            if 'attendance_access' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN attendance_access BOOLEAN DEFAULT FALSE"))
            if 'created_at' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
                conn.execute(text("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
            if 'suspended_by' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN suspended_by INTEGER"))
            if 'suspended_at' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN suspended_at DATETIME"))
            if 'suspension_reason' not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN suspension_reason VARCHAR"))
            conn.execute(text("UPDATE users SET status = 'Deactivated' WHERE status = 'Inactive'"))

ensure_user_columns()
# Initialize database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(title="Backend API")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    """
    Root endpoint to check if the API is running.
    """
    return {"message": "API Running"}


# Register all routers from different modules
app.include_router(user_routes.router)
app.include_router(employee_routes.router)
app.include_router(department_routes.router)
app.include_router(company_routes.router)
app.include_router(audit_routes.router)
app.include_router(analytics_routes.router)
app.include_router(attendance_routes.router)
app.include_router(leave_routes.router)
app.include_router(notification_routes.router)
app.include_router(export_routes.router)
