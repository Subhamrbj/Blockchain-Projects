# Document Hash Verification

Generate a SHA-256 hash with:

```bash
sha256sum sample_documents/property_001.json
```

The stored hash in `property_001.sha256` should match the original file. Modify the JSON and run the command again; the hash should change.
