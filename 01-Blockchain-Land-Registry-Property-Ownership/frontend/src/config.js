import deployment from "./deployment.json";

export const CONFIG = {
  contractAddress: deployment.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  rpcUrl: deployment.rpcUrl || "http://127.0.0.1:8545",
  chainId: Number(deployment.chainId || 31337),
  samplePropertyId: deployment.sampleProperty?.id || 1,
  sampleDocumentPath: "./sample_documents/property_001.json",
};

export const DEMO_ACCOUNTS = [
  { role: "Admin / Authority", index: 0, address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
  { role: "Registrar", index: 1, address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  { role: "Surveyor", index: 2, address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
  { role: "Owner A", index: 3, address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
  { role: "Buyer B", index: 4, address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
];
