"""AES-256-GCM encryption for runtime secrets (shared format with Console)."""

from __future__ import annotations

import base64
import json
import os
from typing import Any, Dict

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _parse_key(key_raw: str) -> bytes:
    raw = (key_raw or "").strip()
    if not raw:
        raise ValueError("AOL_CONFIG_ENCRYPTION_KEY is required")
    try:
        key = base64.b64decode(raw, validate=True)
    except Exception:
        if len(raw) == 64 and all(c in "0123456789abcdefABCDEF" for c in raw):
            key = bytes.fromhex(raw)
        else:
            raise ValueError(
                "AOL_CONFIG_ENCRYPTION_KEY must be base64 (32 bytes) or 64-char hex"
            ) from None
    if len(key) != 32:
        raise ValueError("AOL_CONFIG_ENCRYPTION_KEY must decode to 32 bytes")
    return key


def encrypt_secrets(secrets: Dict[str, str], key_raw: str) -> tuple[str, str]:
    key = _parse_key(key_raw)
    nonce = os.urandom(12)
    plaintext = json.dumps(secrets, ensure_ascii=False).encode("utf-8")
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, None)
    return (
        base64.b64encode(ciphertext).decode("ascii"),
        base64.b64encode(nonce).decode("ascii"),
    )


def decrypt_secrets(ciphertext_b64: str, nonce_b64: str, key_raw: str) -> Dict[str, str]:
    key = _parse_key(key_raw)
    nonce = base64.b64decode(nonce_b64)
    ciphertext = base64.b64decode(ciphertext_b64)
    plaintext = AESGCM(key).decrypt(nonce, ciphertext, None)
    data = json.loads(plaintext.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("decrypted secrets must be a JSON object")
    return {str(k): "" if v is None else str(v) for k, v in data.items()}


def empty_secrets_blob(key_raw: str) -> tuple[str, str]:
    return encrypt_secrets({}, key_raw)
