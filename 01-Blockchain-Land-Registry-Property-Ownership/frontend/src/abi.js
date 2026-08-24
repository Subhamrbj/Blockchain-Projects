export const LAND_REGISTRY_ABI = [

  "function admin() view returns (address)",

  "function isRegistrar(address) view returns (bool)",

  "function isSurveyor(address) view returns (bool)",

  "function propertyExists(uint256) view returns (bool)",

  "function registerProperty(uint256,string,string,uint256,string,address,bytes32)",

  "function verifyProperty(uint256)",

  "function transferOwnership(uint256,address)",

  "function updatePropertyStatus(uint256,uint8)",

  "function getProperty(uint256) view returns (tuple(uint256 propertyId,string propertyNumber,string location,uint256 area,string propertyType,address currentOwner,address previousOwner,bytes32 documentHash,bool verified,uint8 status,uint256 registeredAt,uint256 lastTransferredAt))",

  "function getPropertiesByOwner(address) view returns (uint256[])",

  "function getOwnershipHistory(uint256) view returns (address[])",

  "function getPropertyCountForOwner(address) view returns (uint256)",

  "event PropertyRegistered(uint256 indexed propertyId,string propertyNumber,address indexed owner,bytes32 documentHash)",

  "event PropertyVerified(uint256 indexed propertyId,address indexed verifier,uint256 verifiedAt)",

  "event OwnershipTransferred(uint256 indexed propertyId,address indexed previousOwner,address indexed newOwner,uint256 transferredAt)",

  "event PropertyStatusUpdated(uint256 indexed propertyId,uint8 oldStatus,uint8 newStatus,address indexed updatedBy)",

  "event RegistrarUpdated(address indexed account,bool enabled)",

  "event SurveyorUpdated(address indexed account,bool enabled)"

];

export const STATUS = [
  "REGISTERED",
  "VERIFIED",
  "TRANSFER_PENDING",
  "TRANSFERRED",
  "DISPUTED"
];