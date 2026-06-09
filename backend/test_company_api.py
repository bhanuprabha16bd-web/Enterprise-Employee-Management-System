import requests

login_data = {
    "username": "bhanuprabha16bd@gmail.com",
    "password": "bhanu"
}
login_res = requests.post("http://127.0.0.1:8000/users/login", data=login_data)
token = login_res.json().get("access_token")

headers = {"Authorization": f"Bearer {token}"}
response = requests.get("http://127.0.0.1:8000/company/all", headers=headers)
print("Company API status:", response.status_code)
print(response.json())
