import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.config import SessionLocal, engine, Base
from app.models.department_db import Department
from app.models.employee_db import Employee
from app.models import user_db, department_db, employee_db
from app.models.user_db import User

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing data
db.query(User).delete()
db.query(Department).delete()
db.commit()

# Add test data with password hashes
from app.auth import get_password_hash
admin_user = User(
    name="Bhanu Prabha",
    email="bhanuprabha16bd@gmail.com",
    password_hash=get_password_hash("bhanu"),
    role="Admin",
    company="Company Inc"
)

regular_user = User(
    name="John Doe",
    email="john@example.com",
    password_hash=get_password_hash("user123"),
    role="User",
    company="Company Inc"
)

db.add(admin_user)
db.add(regular_user)

departments = ["Engineering", "Development", "Sales", "Marketing", "Design", "Human Resources", "Product", "Data"]
for dept_name in departments:
    if not db.query(Department).filter(Department.name == dept_name).first():
        db.add(Department(name=dept_name))

db.commit()
db.close()
print("Database seeded with departments!")
