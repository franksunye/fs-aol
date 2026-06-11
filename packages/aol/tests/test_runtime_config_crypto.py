import base64
import os
import unittest

from aol.runtime_config.crypto import decrypt_secrets, encrypt_secrets


class RuntimeConfigCryptoTest(unittest.TestCase):
    def setUp(self) -> None:
        self.key = base64.b64encode(os.urandom(32)).decode("ascii")

    def test_roundtrip(self) -> None:
        secrets = {"fsm_mongo_url": "mongodb://x", "llm_api_key": "sk-test"}
        ct, nonce = encrypt_secrets(secrets, self.key)
        out = decrypt_secrets(ct, nonce, self.key)
        self.assertEqual(out, secrets)

    def test_wrong_key_fails(self) -> None:
        ct, nonce = encrypt_secrets({"a": "b"}, self.key)
        other = base64.b64encode(os.urandom(32)).decode("ascii")
        with self.assertRaises(Exception):
            decrypt_secrets(ct, nonce, other)


if __name__ == "__main__":
    unittest.main()
