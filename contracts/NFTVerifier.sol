// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NFTVerifier {
    address public owner;
    mapping(address => bool) public verifiers;
    mapping(uint256 => bool) public verifiedNFTs;
    mapping(uint256 => string) public verificationReasons;

    enum VerificationStatus { Pending, Approved, Rejected }
    
    struct VerificationRequest {
        address requester;
        uint256 tokenId;
        VerificationStatus status;
        string reason;
        uint256 requestTime;
    }

    mapping(uint256 => VerificationRequest) public verificationRequests;
    uint256[] public pendingRequests;

    event NFTVerified(uint256 tokenId, address verifier, string reason);
    event NFTRejected(uint256 tokenId, address verifier, string reason);
    event VerificationRequested(uint256 tokenId, address requester);
    event VerifierAdded(address verifier);
    event VerifierRemoved(address verifier);
    
    constructor() {
        owner = msg.sender;
        verifiers[msg.sender] = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Only authorized verifiers can call this function");
        _;
    }
    
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        require(!verifiers[_verifier], "Address is already a verifier");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }
    
    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier], "Address is not a verifier");
        require(_verifier != owner, "Cannot remove owner from verifiers");
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }
    
    function requestVerification(uint256 _tokenId) external {
        // Kiểm tra xem yêu cầu đã tồn tại chưa
        // Nếu yêu cầu không tồn tại hoặc đã bị từ chối, cho phép yêu cầu mới
        if (verificationRequests[_tokenId].requester != address(0)) {
            // Nếu yêu cầu đang pending, không cho phép yêu cầu mới
            require(verificationRequests[_tokenId].status != VerificationStatus.Pending, 
                    "Verification already requested");
        }
        
        // Tạo yêu cầu mới
        verificationRequests[_tokenId] = VerificationRequest({
            requester: msg.sender,
            tokenId: _tokenId,
            status: VerificationStatus.Pending,
            reason: "",
            requestTime: block.timestamp
        });
        
        pendingRequests.push(_tokenId);
        emit VerificationRequested(_tokenId, msg.sender);
    }
    
    function verifyNFT(uint256 _tokenId, string memory _reason) external onlyVerifier {
        require(verificationRequests[_tokenId].status == VerificationStatus.Pending, "No pending verification request");
        
        verifiedNFTs[_tokenId] = true;
        verificationReasons[_tokenId] = _reason;
        verificationRequests[_tokenId].status = VerificationStatus.Approved;
        verificationRequests[_tokenId].reason = _reason;
        
        _removePendingRequest(_tokenId);
        emit NFTVerified(_tokenId, msg.sender, _reason);
    }
    
    function rejectNFT(uint256 _tokenId, string memory _reason) external onlyVerifier {
        require(verificationRequests[_tokenId].status == VerificationStatus.Pending, "No pending verification request");
        
        verifiedNFTs[_tokenId] = false;
        verificationReasons[_tokenId] = _reason;
        verificationRequests[_tokenId].status = VerificationStatus.Rejected;
        verificationRequests[_tokenId].reason = _reason;
        
        _removePendingRequest(_tokenId);
        emit NFTRejected(_tokenId, msg.sender, _reason);
    }
    
    function _removePendingRequest(uint256 _tokenId) private {
    for (uint i = 0; i < pendingRequests.length; i++) {
        if (pendingRequests[i] == _tokenId) {
            // Thay thế bằng phần tử cuối cùng và pop
            pendingRequests[i] = pendingRequests[pendingRequests.length - 1];
            pendingRequests.pop();
            break;
        }
    }
}
    
    function isNFTVerified(uint256 _tokenId) external view returns (bool) {
        return verifiedNFTs[_tokenId];
    }
    
    function getVerificationReason(uint256 _tokenId) external view returns (string memory) {
        return verificationReasons[_tokenId];
    }
    
    function getPendingRequests() external view returns (uint256[] memory) {
        return pendingRequests;
    }
    
    function getVerificationRequest(uint256 _tokenId) external view returns (
        address requester,
        uint256 tokenId,
        VerificationStatus status,
        string memory reason,
        uint256 requestTime
    ) {
        VerificationRequest memory request = verificationRequests[_tokenId];
        return (
            request.requester,
            request.tokenId,
            request.status,
            request.reason,
            request.requestTime
        );
    }
    
    function getVerificationStatus(uint256 _tokenId) external view returns (VerificationStatus) {
        return verificationRequests[_tokenId].status;
    }
    
    function isVerifier(address _address) external view returns (bool) {
        return verifiers[_address];
    }
    
    function getAllVerifiers() external view returns (address[] memory) {
        uint count = 0;
        
        // Count verifiers first
        for (uint i = 1; i <= 100; i++) { // Limiting to 100 to prevent DOS
            address addr = address(uint160(i));
            if (verifiers[addr]) {
                count++;
            }
        }
        
        address[] memory result = new address[](count);
        count = 0;
        
        // Fill the array
        for (uint i = 1; i <= 100; i++) {
            address addr = address(uint160(i));
            if (verifiers[addr]) {
                result[count] = addr;
                count++;
            }
        }
        
        return result;
    }
}