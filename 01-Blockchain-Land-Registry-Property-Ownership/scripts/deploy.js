const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  const [admin, registrar, surveyor, ownerA, buyerB] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("LandRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();

  await (await registry.setRegistrar(registrar.address, true)).wait();
  await (await registry.setSurveyor(surveyor.address, true)).wait();

  const documentPath = path.join(__dirname, "..", "sample_documents", "property_001.json");
  const documentBytes = fs.readFileSync(documentPath);
  const documentHash = ethers.sha256(documentBytes);
  await (await registry.connect(registrar).registerProperty(
    1,
    "P001",
    "Bardhaman Demo Zone",
    1200,
    "Residential",
    ownerA.address,
    documentHash
  )).wait();

  const address = await registry.getAddress();
  const deployment = {
    contractAddress: address,
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    deployedAt: new Date().toISOString(),
    accounts: {
      admin: admin.address,
      registrar: registrar.address,
      surveyor: surveyor.address,
      ownerA: ownerA.address,
      buyerB: buyerB.address,
    },
    sampleProperty: {
      id: 1,
      number: "P001",
      documentHash,
    },
  };

  const target = path.join(__dirname, "..", "frontend", "src", "deployment.json");
  fs.writeFileSync(target, JSON.stringify(deployment, null, 2));

  console.log("\n========================================");
  console.log("      LAND REGISTRY DEPLOYMENT");
  console.log("========================================");
  console.log("LandRegistry:", address);
  console.log("Admin:", admin.address);
  console.log("Registrar:", registrar.address);
  console.log("Surveyor:", surveyor.address);
  console.log("Owner A:", ownerA.address);
  console.log("Buyer B:", buyerB.address);
  console.log("Property P001 registered.");
  console.log("Document SHA-256:", documentHash);
  console.log("Frontend config written to frontend/src/deployment.json");
  console.log("========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
