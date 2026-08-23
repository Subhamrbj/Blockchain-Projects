const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const short = (a) => `${a.slice(0, 10)}...${a.slice(-8)}`;

async function main() {
  const [admin, registrar, surveyor, ownerA, buyerB, outsider] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("LandRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();

  await (await registry.setRegistrar(registrar.address, true)).wait();
  await (await registry.setSurveyor(surveyor.address, true)).wait();

  const documentPath = path.join(__dirname, "..", "sample_documents", "property_001.json");
  const docHash = ethers.sha256(fs.readFileSync(documentPath));
  await (await registry.connect(registrar).registerProperty(
    1, "P001", "Bardhaman Demo Zone", 1200, "Residential", ownerA.address, docHash
  )).wait();

  console.log("\n========================================");
  console.log("   LAND REGISTRY LIVE SIMULATION");
  console.log("========================================");
  console.log("Contract        :", await registry.getAddress());
  console.log("Admin           :", short(admin.address));
  console.log("Registrar       :", short(registrar.address));
  console.log("Surveyor        :", short(surveyor.address));
  console.log("Owner A         :", short(ownerA.address));
  console.log("Buyer B         :", short(buyerB.address));

  console.log("\n1. PROPERTY REGISTRATION CHECK");
  console.log("----------------------------------------");
  let p = await registry.getProperty(1);
  console.log("Property ID      :", p.propertyId.toString());
  console.log("Property Number  :", p.propertyNumber);
  console.log("Location         :", p.location);
  console.log("Area             :", p.area.toString());
  console.log("Property Type    :", p.propertyType);
  console.log("Current Owner    :", p.currentOwner);
  console.log("Document SHA-256 :", p.documentHash);
  console.log("Verified         :", p.verified);
  console.log("Status           :", p.status.toString());

  console.log("\n2. PROPERTY VERIFICATION");
  console.log("----------------------------------------");
  const verifyTx = await registry.connect(surveyor).verifyProperty(1);
  await verifyTx.wait();
  p = await registry.getProperty(1);
  console.log("Verification TX  :", verifyTx.hash);
  console.log("Verified         :", p.verified);
  console.log("New Status       :", p.status.toString());

  console.log("\n3. OWNERSHIP TRANSFER");
  console.log("----------------------------------------");
  const transferTx = await registry.connect(ownerA).transferOwnership(1, buyerB.address);
  await transferTx.wait();
  p = await registry.getProperty(1);
  console.log("Old Owner        :", p.previousOwner);
  console.log("New Owner        :", p.currentOwner);
  console.log("History Length    :", (await registry.getOwnershipHistory(1)).length);
  console.log("Transfer TX      :", transferTx.hash);

  console.log("\n4. OWNERSHIP HISTORY");
  console.log("----------------------------------------");
  const history = await registry.getOwnershipHistory(1);
  history.forEach((owner, i) => console.log(`Owner ${i + 1}         :`, owner));

  console.log("\n5. OLD OWNER SECURITY TEST");
  console.log("----------------------------------------");
  try {
    await registry.connect(ownerA).transferOwnership(1, outsider.address);
    console.log("FAILED: Old owner was unexpectedly allowed to transfer.");
  } catch (e) {
    console.log("PASSED: Old owner transfer was rejected.");
  }

  console.log("\n6. FINAL PROPERTY STATE");
  console.log("----------------------------------------");
  p = await registry.getProperty(1);
  console.log("Property Number  :", p.propertyNumber);
  console.log("Current Owner    :", p.currentOwner);
  console.log("Previous Owner   :", p.previousOwner);
  console.log("Verified         :", p.verified);
  console.log("Status           :", p.status.toString());
  console.log("\n========================================");
  console.log("       SIMULATION COMPLETED");
  console.log("========================================\n");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
