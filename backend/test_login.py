import requests

url = "http://127.0.0.1:8000/users/login"
payload = {
    "username": "bhanuprabha16bd@gmail.com",
    "password": "bhanu"
}
response = requests.post(url, data=payload)
print(response.status_code)
print(response.json())
