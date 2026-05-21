import os
import base64
import json
from typing import List
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()


def get_encryption_key() -> bytes:
    key = os.getenv("ENCRYPTION_KEY", "faceauth-encryption-key-32bytes!!")
    key_bytes = key.encode()[:32].ljust(32, b'\0')
    return base64.urlsafe_b64encode(key_bytes)


def encrypt_embedding(embedding: List[float]) -> str:
    cipher = Fernet(get_encryption_key())
    data = json.dumps(embedding).encode()
    return cipher.encrypt(data).decode()


def decrypt_embedding(encrypted: str) -> List[float]:
    cipher = Fernet(get_encryption_key())
    data = cipher.decrypt(encrypted.encode())
    return json.loads(data.decode())
