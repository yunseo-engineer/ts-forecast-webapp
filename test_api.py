import requests

with open("sample-data.csv", "rb") as f:
    res = requests.post("http://127.0.0.1:8000/api/forecast", files={"file": f}, data={"horizon": 12})
    print(res.status_code)
    try:
        data = res.json()
        if "dataset" in data and "statistics" in data["dataset"]:
            print("Statistics:", data["dataset"]["statistics"])
        else:
            print("Missing statistics or error:", data)
    except Exception as e:
        print("Error parsing json:", e)
        print(res.text)
