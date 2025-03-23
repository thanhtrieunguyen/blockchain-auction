// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NFTVerifier {
    address public owner;
    mapping(address => bool) public verifiers;
    mapping(uint256 => bool) public verifiedNFTs;
    mapping(uint256 => string) public verificationReasons;

    // Trạng thái xác minh
    enum VerificationStatus { NotRequested, Pending, Verified, Rejected }
    
    // Thông tin yêu cầu xác minh
    struct VerificationRequest {
        address requester;
        uint256 tokenId;
        VerificationStatus status;
        string reason;
        uint256 requestTime;
    }

    // Lưu trữ yêu cầu xác minh theo tokenId
    mapping(uint256 => VerificationRequest) public verificationRequests;
    
    // Danh sách tokenId đang chờ xác minh
    uint256[] public pendingTokens;
    
    // Các sự kiện
    event NFTVerified(uint256 tokenId, address verifier, string reason);
    event NFTRejected(uint256 tokenId, address verifier, string reason);
    event VerificationRequested(uint256 tokenId, address requester);
    
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
        verifiers[_verifier] = true;
    }
    
    function removeVerifier(address _verifier) external onlyOwner {
        require(_verifier != owner, "Cannot remove owner");
        require(verifiers[_verifier], "Address is not a verifier");
        verifiers[_verifier] = false;
    }
    
    // Yêu cầu xác minh NFT
    function requestVerification(uint256 _tokenId) external {
        // Không cho phép yêu cầu mới nếu đã đang chờ xác minh
        require(
            verificationRequests[_tokenId].status != VerificationStatus.Pending,
            "Verification already requested"
        );
        
        // Tạo yêu cầu mới
        verificationRequests[_tokenId] = VerificationRequest({
            requester: msg.sender,
            tokenId: _tokenId,
            status: VerificationStatus.Pending,
            reason: "",
            requestTime: block.timestamp
        });
        
        // Thêm vào danh sách chờ
        _addToPendingList(_tokenId);
        
        emit VerificationRequested(_tokenId, msg.sender);
    }
    
    // Xác minh NFT
    function verifyNFT(uint256 _tokenId, string calldata _reason) external onlyVerifier {
        require(verificationRequests[_tokenId].status == VerificationStatus.Pending, 
                "No pending verification request");
        
        // Cập nhật trạng thái
        verifiedNFTs[_tokenId] = true;
        verificationReasons[_tokenId] = _reason;
        verificationRequests[_tokenId].status = VerificationStatus.Verified;
        
        // Xóa khỏi danh sách chờ
        _removeFromPendingList(_tokenId);
        
        emit NFTVerified(_tokenId, msg.sender, _reason);
    }
    
    // Từ chối xác minh NFT
    function rejectNFT(uint256 _tokenId, string calldata _reason) external onlyVerifier {
        require(verificationRequests[_tokenId].status == VerificationStatus.Pending,
                "No pending verification request");
        
        // Cập nhật trạng thái
        verifiedNFTs[_tokenId] = false;
        verificationRequests[_tokenId].status = VerificationStatus.Rejected;
        verificationRequests[_tokenId].reason = _reason;
        
        // Xóa khỏi danh sách chờ
        _removeFromPendingList(_tokenId);
        
        emit NFTRejected(_tokenId, msg.sender, _reason);
    }
    
    // Kiểm tra NFT đã được xác minh chưa
    function isNFTVerified(uint256 _tokenId) external view returns (bool) {
        return verifiedNFTs[_tokenId];
    }
    
    // Lấy trạng thái xác minh hiện tại
    function getVerificationStatus(uint256 _tokenId) external view returns (VerificationStatus) {
        return verificationRequests[_tokenId].status;
    }

    // Lấy thông tin yêu cầu xác minh
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
    
    // Lấy danh sách tokenId đang chờ xác minh
    function getPendingTokens() external view returns (uint256[] memory) {
        return pendingTokens;
    }
    
    // Thêm tokenId vào danh sách chờ
    function _addToPendingList(uint256 _tokenId) private {
        for (uint i = 0; i < pendingTokens.length; i++) {
            if (pendingTokens[i] == _tokenId) {
                return; // Đã có trong danh sách
            }
        }
        pendingTokens.push(_tokenId);
    }
    
    // Xóa tokenId khỏi danh sách chờ
    function _removeFromPendingList(uint256 _tokenId) private {
        for (uint i = 0; i < pendingTokens.length; i++) {
            if (pendingTokens[i] == _tokenId) {
                pendingTokens[i] = pendingTokens[pendingTokens.length - 1];
                pendingTokens.pop();
                break;
            }
        }
    }
}