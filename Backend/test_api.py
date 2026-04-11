import requests

url = "http://127.0.0.1:5000/predict"

files = {"image": open("test.jpg", "rb")}

res = requests.post(url, files=files)

print(res.json())