import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.config import SessionLocal, engine, Base
from app.models.department_db import Department
from app.models.employee_db import Employee
from app.models import user_db, department_db, employee_db

Base.metadata.create_all(bind=engine)

db = SessionLocal()

departments = ["Engineering", "Development", "Sales", "Marketing", "Design", "Human Resources", "Product", "Data"]
for dept_name in departments:
    if not db.query(Department).filter(Department.name == dept_name).first():
        db.add(Department(name=dept_name))

db.commit()
db.close()
print("Database seeded with departments!")
