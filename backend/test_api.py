import requests

with open("../sample-data.csv", "w") as f:
    f.write("date,value\n2025-01-01,10\n2025-01-02,12\n2025-01-03,14\n2025-01-04,11\n2025-01-05,10\n2025-01-06,12\n2025-01-07,14\n2025-01-08,11\n2025-01-09,10\n2025-01-10,12\n2025-01-11,14\n2025-01-12,11")

try:
    with open("../sample-data.csv", "rb") as f:
        res = requests.post("http://127.0.0.1:8000/api/forecast", files={"file": f}, data={"horizon": 2})
        print(res.status_code)
        if res.status_code != 200:
            print(res.text)
        else:
            print("OK")
except Exception as e:
    print("Error:", e)
