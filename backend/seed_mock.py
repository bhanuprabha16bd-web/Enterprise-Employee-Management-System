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
            c.execute('''INSERT INTO employees 
                         (name, email, role, company_id, status, phone, location, joinDate) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                      (u['name'], email, roles[i%len(roles)], comp_id, statuses[i%len(statuses)], u.get('phone',''), u.get('address',{}).get('city',''), '2023-01-01'))
            count += 1
        except Exception as e:
            pass

conn.commit()
print(f'Inserted {count} employees.')
