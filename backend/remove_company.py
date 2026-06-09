import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.config import SessionLocal
from app.models.company_db import Company
from app.models.user_db import User
from app.models.employee_db import Employee
from app.models.department_db import Department

db = SessionLocal()

# Delete "Another Company LLC"
company = db.query(Company).filter(Company.name == "Another Company LLC").first()
if company:
    db.query(User).filter(User.company_id == company.id).delete()
    db.query(Employee).filter(Employee.company_id == company.id).delete()
    db.delete(company)
    db.commit()
    print("Deleted 'Another Company LLC'")
else:
    print("Company not found")

db.close()
