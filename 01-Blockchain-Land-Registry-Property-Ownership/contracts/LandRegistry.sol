// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandRegistry
 * @notice Educational prototype for a blockchain-based property registry.
 * @dev Uses synthetic data only. It does not establish legal ownership.
 */
contract LandRegistry {
    address public immutable admin;
    mapping(address => bool) public isRegistrar;
    mapping(address => bool) public isSurveyor;

    enum PropertyStatus { REGISTERED, VERIFIED, TRANSFER_PENDING, TRANSFERRED, DISPUTED }

    struct Property {
        uint256 propertyId;
        string propertyNumber;
        string location;
        uint256 area;
        string propertyType;
        address currentOwner;
        address previousOwner;
        bytes32 documentHash;
        bool verified;
        PropertyStatus status;
        uint256 registeredAt;
        uint256 lastTransferredAt;
    }

    mapping(uint256 => Property) private properties;
    mapping(uint256 => bool) public propertyExists;
    mapping(address => uint256[]) private ownerProperties;
    mapping(uint256 => address[]) private ownershipHistory;

    event PropertyRegistered(uint256 indexed propertyId, string propertyNumber, address indexed owner, bytes32 documentHash);
    event PropertyVerified(uint256 indexed propertyId, address indexed verifier, uint256 verifiedAt);
    event OwnershipTransferred(uint256 indexed propertyId, address indexed previousOwner, address indexed newOwner, uint256 transferredAt);
    event PropertyStatusUpdated(uint256 indexed propertyId, PropertyStatus oldStatus, PropertyStatus newStatus, address indexed updatedBy);
    event RegistrarUpdated(address indexed account, bool enabled);
    event SurveyorUpdated(address indexed account, bool enabled);

    modifier onlyAdmin() { require(msg.sender == admin, "Not admin"); _; }
    modifier onlyRegistrar() { require(isRegistrar[msg.sender], "Not registrar"); _; }
    modifier onlySurveyor() { require(isSurveyor[msg.sender], "Not surveyor"); _; }
    modifier validProperty(uint256 propertyId) { require(propertyExists[propertyId], "Property does not exist"); _; }
    modifier onlyPropertyOwner(uint256 propertyId) {
        require(propertyExists[propertyId], "Property does not exist");
        require(properties[propertyId].currentOwner == msg.sender, "Not property owner");
        _;
    }

    constructor() {
        admin = msg.sender;
        isRegistrar[msg.sender] = true;
        isSurveyor[msg.sender] = true;
    }

    function setRegistrar(address account, bool enabled) external onlyAdmin {
        require(account != address(0), "Zero address");
        isRegistrar[account] = enabled;
        emit RegistrarUpdated(account, enabled);
    }

    function setSurveyor(address account, bool enabled) external onlyAdmin {
        require(account != address(0), "Zero address");
        isSurveyor[account] = enabled;
        emit SurveyorUpdated(account, enabled);
    }

    function registerProperty(uint256 propertyId, string calldata propertyNumber, string calldata location, uint256 area, string calldata propertyType, address initialOwner, bytes32 documentHash) external onlyRegistrar {
        require(!propertyExists[propertyId], "Property already exists");
        require(initialOwner != address(0), "Owner cannot be zero");
        require(area > 0, "Area must be greater than zero");
        require(bytes(propertyNumber).length > 0, "Property number required");
        require(bytes(location).length > 0, "Location required");
        require(bytes(propertyType).length > 0, "Property type required");
        require(documentHash != bytes32(0), "Document hash required");

        properties[propertyId] = Property({
            propertyId: propertyId, propertyNumber: propertyNumber, location: location, area: area, propertyType: propertyType,
            currentOwner: initialOwner, previousOwner: address(0), documentHash: documentHash, verified: false,
            status: PropertyStatus.REGISTERED, registeredAt: block.timestamp, lastTransferredAt: 0
        });
        propertyExists[propertyId] = true;
        ownerProperties[initialOwner].push(propertyId);
        ownershipHistory[propertyId].push(initialOwner);
        emit PropertyRegistered(propertyId, propertyNumber, initialOwner, documentHash);
    }

    function verifyProperty(uint256 propertyId) external onlySurveyor validProperty(propertyId) {
        Property storage p = properties[propertyId];
        require(!p.verified, "Already verified");
        require(p.status == PropertyStatus.REGISTERED, "Invalid verification state");
        p.verified = true;
        p.status = PropertyStatus.VERIFIED;
        emit PropertyVerified(propertyId, msg.sender, block.timestamp);
    }

    function transferOwnership(uint256 propertyId, address newOwner) external onlyPropertyOwner(propertyId) {
        Property storage p = properties[propertyId];
        require(newOwner != address(0), "New owner cannot be zero");
        require(newOwner != p.currentOwner, "Already owner");
        require(p.verified, "Property not verified");
        require(p.status != PropertyStatus.DISPUTED, "Property is disputed");
        require(p.status != PropertyStatus.TRANSFER_PENDING, "Transfer already pending");

        address oldOwner = p.currentOwner;
        p.previousOwner = oldOwner;
        p.currentOwner = newOwner;
        p.lastTransferredAt = block.timestamp;
        p.status = PropertyStatus.TRANSFERRED;
        _removePropertyFromOwner(oldOwner, propertyId);
        ownerProperties[newOwner].push(propertyId);
        ownershipHistory[propertyId].push(newOwner);
        emit OwnershipTransferred(propertyId, oldOwner, newOwner, block.timestamp);
    }

    function updatePropertyStatus(uint256 propertyId, PropertyStatus newStatus) external onlyAdmin validProperty(propertyId) {
        Property storage p = properties[propertyId];
        PropertyStatus oldStatus = p.status;
        require(newStatus != oldStatus, "Status already set");
        require(_isValidTransition(oldStatus, newStatus), "Invalid status transition");
        if (newStatus == PropertyStatus.VERIFIED) p.verified = true;
        p.status = newStatus;
        emit PropertyStatusUpdated(propertyId, oldStatus, newStatus, msg.sender);
    }

    function getProperty(uint256 propertyId) external view validProperty(propertyId) returns (Property memory) { return properties[propertyId]; }
    function getPropertiesByOwner(address owner) external view returns (uint256[] memory) { return ownerProperties[owner]; }
    function getOwnershipHistory(uint256 propertyId) external view validProperty(propertyId) returns (address[] memory) { return ownershipHistory[propertyId]; }
    function getPropertyCountForOwner(address owner) external view returns (uint256) { return ownerProperties[owner].length; }

    function _isValidTransition(PropertyStatus oldStatus, PropertyStatus newStatus) internal pure returns (bool) {
        if (oldStatus == PropertyStatus.REGISTERED) return newStatus == PropertyStatus.VERIFIED || newStatus == PropertyStatus.DISPUTED;
        if (oldStatus == PropertyStatus.VERIFIED) return newStatus == PropertyStatus.DISPUTED;
        if (oldStatus == PropertyStatus.TRANSFERRED) return newStatus == PropertyStatus.DISPUTED;
        if (oldStatus == PropertyStatus.DISPUTED) return newStatus == PropertyStatus.VERIFIED;
        return false;
    }

    function _removePropertyFromOwner(address owner, uint256 propertyId) internal {
        uint256[] storage ids = ownerProperties[owner];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == propertyId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                return;
            }
        }
    }
}
