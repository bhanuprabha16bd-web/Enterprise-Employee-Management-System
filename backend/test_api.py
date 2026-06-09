import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiaGFudXByYWJoYTE2YmRAZ21haWwuY29tIiwicm9sZSI6IkFkbWluIiwibmFtZSI6IkJoYW51IFByYWJoYSIsImNvbXBhbnlfaWQiOjEsImV4cCI6MTc4MDQ2ODA4MX0.BbNXWMLFLZTf7n3AfLyh9O12N1ioFY500-8IQMBwgWA"

headers = {"Authorization": f"Bearer {token}"}
response = requests.get("http://127.0.0.1:8000/audit-logs/", headers=headers)
print("Audit Logs status:", response.status_code)
print(response.json())
