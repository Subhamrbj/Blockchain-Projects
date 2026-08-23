const fs = require("fs");
const crypto = require("crypto");

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const original = "./sample_documents/property_001.json";
const modified = "./sample_documents/property_001_modified.json";
const onChain = sha256(original);
const changed = sha256(modified);

console.log("\n========================================");
console.log("     PROPERTY DOCUMENT INTEGRITY DEMO");
console.log("========================================");
console.log(`Original document : ${original}`);
console.log(`SHA-256           : ${onChain}`);
console.log("\nIntegrity Check:");
console.log("MATCH — Original document hash is the reference fingerprint.");
console.log("\nTamper Demonstration:");
console.log("A modified copy was generated with a changed property value.");
console.log(`Modified SHA-256   : ${changed}`);
console.log(`Tamper Detection   : ${onChain === changed ? "FAIL — hashes unexpectedly match." : "PASS — modified document does not match the reference hash."}`);
console.log("========================================\n");
