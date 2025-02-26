from dotenv import load_dotenv
import requests
import os


load_dotenv()

JWT = os.getenv('JWT') 

def pin_file_to_ipfs(file_name):
    try:
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {
            "Authorization": f"Bearer {JWT}",
        }

        with open(file_name, "rb") as file:
            files = {"file": (file_name, file)}
            response = requests.post(url, headers=headers, files=files)

        print(response.json())  # Print the response
    except Exception as e:
        print("Error:", e)

pin_file_to_ipfs("uploads/CCL1.docx")