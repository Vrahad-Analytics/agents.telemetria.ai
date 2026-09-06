import hashlib
import hmac
import os
import secrets
from typing import Tuple


def hash_api_key(api_key: str) -> str:
    """Hash an API key using SHA-256 for secure DB storage."""
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()


def verify_api_key(plain_api_key: str, hashed_api_key: str) -> bool:
    """Verify a plain API key against its stored hash with constant time comparison."""
    expected = hash_api_key(plain_api_key)
    return hmac.compare_digest(expected, hashed_api_key)


def generate_api_key(prefix: str = "tlm_live_") -> Tuple[str, str]:
    """
    Generate a new random API key and its hash.
    Returns: (raw_key, hashed_key)
    """
    raw_secret = secrets.token_urlsafe(32)
    raw_key = f"{prefix}{raw_secret}"
    return raw_key, hash_api_key(raw_key)


def hash_password(password: str, salt: bytes | None = None) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored salt$hash string."""
    try:
        salt_hex, key_hex = hashed_password.split("$")
        salt = bytes.fromhex(salt_hex)
        expected_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000).hex()
        return hmac.compare_digest(expected_key, key_hex)
    except Exception:
        return False
