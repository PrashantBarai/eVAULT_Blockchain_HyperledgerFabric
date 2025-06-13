import requests
from dotenv import load_dotenv
import os

load_dotenv()

print(os.getenv("JWT"))
url = "https://api.pinata.cloud/data/testAuthentication"
headers = {
    "pinata_api_key": os.getenv("PINATA_API_KEY"),
    "pinata_secret_api_key": os.getenv("PINATA_SECRET_API_KEY")
}

response = requests.get(url, headers=headers)
print(response.json())  # Should return success if credentials are correct
