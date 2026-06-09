import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.config import SessionLocal, engine, Base
from app.models.department_db import Department
from app.models.employee_db import Employee
from app.models import user_db, department_db, employee_db, audit_log_db
from app.models.user_db import User

from app.models.company_db import Company

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing data
db.query(Employee).delete()
db.query(User).delete()
db.query(Company).delete()
db.query(Department).delete()
db.commit()

# Create companies
company1 = Company(name="Company Inc")
db.add(company1)
db.commit()
db.refresh(company1)

company2 = Company(name="Corp")
db.add(company2)
db.commit()
db.refresh(company2)

company3 = Company(name="Global Tech")
db.add(company3)
db.commit()
db.refresh(company3)

# Add test data with password hashes
from app.auth import get_password_hash
admin_user = User(
    name="Bhanu Prabha",
    email="bhanuprabha16bd@gmail.com",
    password_hash=get_password_hash("bhanu"),
    role="Admin",
    company_id=company1.id
)

regular_user = User(
    name="John Doe",
    email="john@example.com",
    password_hash=get_password_hash("user123"),
    role="User",
    company_id=company1.id
)

corp_admin = User(
    name="Corp Admin",
    email="corpadmin@example.com",
    password_hash=get_password_hash("corp123"),
    role="Admin",
    company_id=company2.id
)

global_admin = User(
    name="Global Admin",
    email="globaladmin@example.com",
    password_hash=get_password_hash("global123"),
    role="Admin",
    company_id=company3.id
)

db.add(admin_user)
db.add(regular_user)
db.add(corp_admin)
db.add(global_admin)

departments = ["Engineering", "Development", "Sales", "Marketing", "Design", "Human Resources", "Product", "Data"]
for dept_name in departments:
    if not db.query(Department).filter(Department.name == dept_name).first():
        db.add(Department(name=dept_name))

db.commit()
db.close()
print("Database seeded with companies and departments!")
