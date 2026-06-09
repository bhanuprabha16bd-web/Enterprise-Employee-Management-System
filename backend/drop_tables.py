import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.config import engine, Base
from app.models import user_db, department_db, employee_db, role_request_db, company_db, audit_log_db

Base.metadata.drop_all(bind=engine)
print("All tables dropped successfully.")
