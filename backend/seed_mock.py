import sqlite3
import urllib.request
import json

conn = sqlite3.connect('users.db')
c = conn.cursor()
response = urllib.request.urlopen('https://jsonplaceholder.typicode.com/users')
data = json.loads(response.read().decode())
companies = c.execute('SELECT id FROM companies').fetchall()
statuses = ['Active', 'Inactive', 'On Leave']
roles = ['Engineer', 'Associate', 'Manager', 'Analyst', 'Specialist', 'Director']
count = 0

for comp in companies:
    comp_id = comp[0]
    for i, u in enumerate(data):
        email = f"{comp_id}_{u['email']}"
        try:
            first_name = u['name'].split()[0]
            last_name = " ".join(u['name'].split()[1:]) if len(u['name'].split()) > 1 else ""
            emp_id = f"EMP{comp_id}{i:03d}"
            c.execute('''INSERT INTO employees 
                         (employee_id, first_name, last_name, email, role, company_id, status, phone, location, joinDate) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
                      (emp_id, first_name, last_name, email, roles[i%len(roles)], comp_id, statuses[i%len(statuses)], u.get('phone',''), u.get('address',{}).get('city',''), '2023-01-01'))
            count += 1
        except Exception as e:
            print(f"Error inserting: {e}")

conn.commit()
print(f'Inserted {count} employees.')
