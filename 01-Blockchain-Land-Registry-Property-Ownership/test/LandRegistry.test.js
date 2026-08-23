const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("LandRegistry - Professional Portfolio Build", function () {
  let registry, admin, registrar, surveyor, ownerA, buyerB, outsider;
  const docHash = ethers.sha256(ethers.toUtf8Bytes("property-001"));
  async function deploy() {
    [admin, registrar, surveyor, ownerA, buyerB, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("LandRegistry");
    registry = await Factory.deploy(); await registry.waitForDeployment();
    await registry.connect(admin).setRegistrar(registrar.address, true);
    await registry.connect(admin).setSurveyor(surveyor.address, true);
  }
  async function register(id = 1, owner = ownerA.address) {
    return registry.connect(registrar).registerProperty(id, `P00${id}`, "Bardhaman Demo Zone", 1200, "Residential", owner, docHash);
  }
  async function verify(id = 1) { return registry.connect(surveyor).verifyProperty(id); }
  beforeEach(deploy);

  it("sets the deployer as admin and grants the configured roles", async function () {
    expect(await registry.admin()).to.equal(admin.address);
    expect(await registry.isRegistrar(registrar.address)).to.equal(true);
    expect(await registry.isSurveyor(surveyor.address)).to.equal(true);
  });
  it("allows a registrar to register a property and stores its initial history", async function () {
    await expect(register()).to.emit(registry, "PropertyRegistered");
    const p = await registry.getProperty(1);
    expect(p.currentOwner).to.equal(ownerA.address); expect(p.verified).to.equal(false); expect(p.status).to.equal(0n);
    expect(await registry.getOwnershipHistory(1)).to.deep.equal([ownerA.address]);
    expect(await registry.getPropertiesByOwner(ownerA.address)).to.deep.equal([1n]);
  });
  it("rejects duplicate property IDs", async function () { await register(); await expect(register()).to.be.revertedWith("Property already exists"); });
  it("rejects malformed registration data", async function () {
    await expect(register(2, ethers.ZeroAddress)).to.be.revertedWith("Owner cannot be zero");
    await expect(registry.connect(registrar).registerProperty(3, "P003", "Bardhaman", 0, "Residential", ownerA.address, docHash)).to.be.revertedWith("Area must be greater than zero");
    await expect(registry.connect(registrar).registerProperty(4, "", "Bardhaman", 100, "Residential", ownerA.address, docHash)).to.be.revertedWith("Property number required");
  });
  it("rejects unauthorized registration", async function () {
    await expect(registry.connect(outsider).registerProperty(2, "P002", "Bardhaman", 100, "Residential", ownerA.address, docHash)).to.be.revertedWith("Not registrar");
  });
  it("allows only a surveyor to verify a registered property", async function () {
    await register(); await expect(registry.connect(outsider).verifyProperty(1)).to.be.revertedWith("Not surveyor");
    await expect(verify()).to.emit(registry, "PropertyVerified").withArgs(1, surveyor.address, anyValue);
    const p = await registry.getProperty(1); expect(p.verified).to.equal(true); expect(p.status).to.equal(1n);
  });
  it("prevents duplicate verification", async function () { await register(); await verify(); await expect(verify()).to.be.revertedWith("Already verified"); });
  it("requires verification before transfer", async function () { await register(); await expect(registry.connect(ownerA).transferOwnership(1, buyerB.address)).to.be.revertedWith("Property not verified"); });
  it("allows only the current owner to transfer a verified property", async function () {
    await register(); await verify(); await expect(registry.connect(outsider).transferOwnership(1, buyerB.address)).to.be.revertedWith("Not property owner");
    await expect(registry.connect(ownerA).transferOwnership(1, buyerB.address)).to.emit(registry, "OwnershipTransferred").withArgs(1, ownerA.address, buyerB.address, anyValue);
  });
  it("updates owner indexes and preserves complete ownership history", async function () {
    await register(); await verify(); await registry.connect(ownerA).transferOwnership(1, buyerB.address);
    const p = await registry.getProperty(1); expect(p.currentOwner).to.equal(buyerB.address); expect(p.previousOwner).to.equal(ownerA.address);
    expect(await registry.getOwnershipHistory(1)).to.deep.equal([ownerA.address, buyerB.address]);
    expect(await registry.getPropertiesByOwner(ownerA.address)).to.deep.equal([]);
    expect(await registry.getPropertiesByOwner(buyerB.address)).to.deep.equal([1n]);
    expect(await registry.getPropertyCountForOwner(ownerA.address)).to.equal(0n); expect(await registry.getPropertyCountForOwner(buyerB.address)).to.equal(1n);
  });
  it("rejects zero and self ownership transfers", async function () {
    await register(); await verify();
    await expect(registry.connect(ownerA).transferOwnership(1, ethers.ZeroAddress)).to.be.revertedWith("New owner cannot be zero");
    await expect(registry.connect(ownerA).transferOwnership(1, ownerA.address)).to.be.revertedWith("Already owner");
  });
  it("blocks the old owner after a completed transfer", async function () {
    await register(); await verify(); await registry.connect(ownerA).transferOwnership(1, buyerB.address);
    await expect(registry.connect(ownerA).transferOwnership(1, outsider.address)).to.be.revertedWith("Not property owner");
  });
  it("rejects invalid property lookups", async function () {
    await expect(registry.getProperty(999)).to.be.revertedWith("Property does not exist");
    await expect(registry.getOwnershipHistory(999)).to.be.revertedWith("Property does not exist");
  });
  it("returns multiple properties for the same owner", async function () { await register(1); await register(2); expect(await registry.getPropertiesByOwner(ownerA.address)).to.deep.equal([1n, 2n]); });
  it("preserves the document integrity hash", async function () { await register(); const p = await registry.getProperty(1); expect(p.documentHash).to.equal(docHash); });
  it("allows admin to mark a registered property as disputed", async function () {
    await register(); await expect(registry.connect(admin).updatePropertyStatus(1, 4)).to.emit(registry, "PropertyStatusUpdated").withArgs(1, 0, 4, admin.address);
    expect((await registry.getProperty(1)).status).to.equal(4n);
  });
  it("prevents invalid status transitions and transfer of disputed property", async function () {
    await register(); await expect(registry.connect(admin).updatePropertyStatus(1, 3)).to.be.revertedWith("Invalid status transition");
    await verify();
    await registry.connect(admin).updatePropertyStatus(1, 4);
    await expect(registry.connect(ownerA).transferOwnership(1, buyerB.address)).to.be.revertedWith("Property is disputed");
  });
  it("allows an admin to resolve a disputed verified record back to VERIFIED", async function () {
    await register(); await verify(); await registry.connect(admin).updatePropertyStatus(1, 4); await registry.connect(admin).updatePropertyStatus(1, 1);
    const p = await registry.getProperty(1); expect(p.status).to.equal(1n); expect(p.verified).to.equal(true);
  });
  it("emits role-management events", async function () {
    await expect(registry.connect(admin).setRegistrar(outsider.address, true)).to.emit(registry, "RegistrarUpdated").withArgs(outsider.address, true);
    await expect(registry.connect(admin).setSurveyor(outsider.address, true)).to.emit(registry, "SurveyorUpdated").withArgs(outsider.address, true);
  });
});
