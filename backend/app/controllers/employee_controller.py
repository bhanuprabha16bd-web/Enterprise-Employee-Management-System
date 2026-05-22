from fastapi import HTTPException
import requests

BASE_URL = "https://jsonplaceholder.typicode.com/users"


ROLES = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Marketing Executive",
    "Sales Manager"
]


DEPARTMENTS = [
    "Engineering",
    "Development",
    "Sales",
    "Marketing"
]


STATUSES = [
    "Active",
    "Inactive",
    "On Leave"
]


def get_all_employees():
    response = requests.get(BASE_URL)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch employees")

    users = response.json()

    employees = []

    for index, user in enumerate(users):
        employees.append({
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],

            
            "role": ROLES[index % len(ROLES)],

            
            "department": DEPARTMENTS[index % len(DEPARTMENTS)],

            
            "status": STATUSES[index % len(STATUSES)],

            "joinDate": "2024-01-10",
            "avatar": f"https://i.pravatar.cc/150?u={user['id']}",
            "phone": user["phone"],
            "location": user["address"]["city"]
        })

    return employees


def get_employee_by_id(employee_id: int):
    response = requests.get(f"{BASE_URL}/{employee_id}")

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = response.json()

    employee = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],

        
        "role": ROLES[(user["id"] - 1) % len(ROLES)],

        
        "department": DEPARTMENTS[(user["id"] - 1) % len(DEPARTMENTS)],

        
        "status": STATUSES[(user["id"] - 1) % len(STATUSES)],

        "joinDate": "2024-01-10",
        "avatar": f"https://i.pravatar.cc/150?u={user['id']}",
        "phone": user["phone"],
        "location": user["address"]["city"]
    }

    return employee