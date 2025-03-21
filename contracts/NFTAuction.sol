// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./NFTVerifier.sol";

contract NFTAuction {
    NFTVerifier public verifier;

    enum AuctionState {
        Created,    // Đấu giá đã được tạo nhưng chưa bắt đầu
        Active,     // Đấu giá đang diễn ra (NFT đã được chuyển)
        Ended,      // Đấu giá đã kết thúc
        Cancelled   // Đấu giá đã bị hủy
    }

    struct Auction {
        address creator;           // Địa chỉ người tạo đấu giá
        IERC721 nftContract;       // Địa chỉ hợp đồng NFT
        uint256 tokenId;           // ID của token đang đấu giá
        uint256 startPrice;        // Giá khởi điểm
        uint256 endTime;           // Thời gian kết thúc
        address highestBidder;     // Người trả giá cao nhất
        uint256 highestBid;        // Giá cao nhất hiện tại
        AuctionState state;        // Trạng thái đấu giá
        bool nftDeposited;         // NFT đã được chuyển vào contract chưa
    }

    // Lưu trữ thông tin các phiên đấu giá theo ID
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCounter;

    // Theo dõi phiên đấu giá đang hoạt động của mỗi token
    mapping(uint256 => uint256) public activeAuctionByToken;

    // Lưu trữ số tiền cần hoàn trả cho người đấu giá
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;

    event VerificationRequired(uint256 tokenId, address creator);
    event AuctionCreated(uint256 auctionId, address creator, address nftContract, uint256 tokenId, uint256 startPrice, uint256 endTime);
    event AuctionStarted(uint256 auctionId, address starter);
    event NewBid(uint256 auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address winner, uint256 amount);
    event AuctionCancelled(uint256 auctionId);
    event Refunded(address bidder, uint256 amount);
    event DebugLog(string message, uint256 value);

    constructor(address _verifierAddress) {
        verifier = NFTVerifier(_verifierAddress);
    }

    function setVerifier(address _verifierAddress) external {
        // Có thể thêm quyền admin ở đây
        verifier = NFTVerifier(_verifierAddress);
    }

    // Hàm tạo phiên đấu giá mới (không chuyển NFT)
    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _auctionDuration
    ) external {
        require(_startPrice > 0, "Starting price must be greater than 0");
        require(_auctionDuration > 0, "Auction duration must be greater than 0");
        require(verifier.isNFTVerified(_tokenId), "NFT not verified");

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Caller is not the owner");
        
        emit DebugLog("Creating auction with duration (minutes)", _auctionDuration);
        
        // Chuyển đổi từ phút thành giây
        uint256 durationInSeconds = _auctionDuration * 60;
        emit DebugLog("Duration in seconds", durationInSeconds);

        auctionCounter++;
        Auction storage newAuction = auctions[auctionCounter];
        newAuction.creator = msg.sender;
        newAuction.tokenId = _tokenId;
        newAuction.nftContract = nft;
        newAuction.startPrice = _startPrice;
        newAuction.highestBid = _startPrice;
        newAuction.endTime = block.timestamp + durationInSeconds;
        newAuction.state = AuctionState.Created;
        newAuction.nftDeposited = false;

        activeAuctionByToken[_tokenId] = auctionCounter;

        emit AuctionCreated(
            auctionCounter,
            msg.sender,
            _nftContract,
            _tokenId,
            _startPrice,
            newAuction.endTime
        );
    }

    // Hàm bắt đầu đấu giá (chuyển NFT vào contract)
    function startAuction(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId];
        
        require(auction.creator == msg.sender, "Only creator can start auction");
        require(auction.state == AuctionState.Created, "Auction not in Created state");
        require(!auction.nftDeposited, "NFT already deposited");
        
        // Kiểm tra phê duyệt
        require(
            auction.nftContract.getApproved(auction.tokenId) == address(this),
            "Contract not approved for NFT"
        );
        
        // Chuyển NFT vào contract
        auction.nftContract.transferFrom(msg.sender, address(this), auction.tokenId);
        
        // Cập nhật trạng thái
        auction.state = AuctionState.Active;
        auction.nftDeposited = true;
        
        emit AuctionStarted(_auctionId, msg.sender);
    }

    // Hàm đặt giá thầu
    function bid(uint256 _auctionId) public payable {
        Auction storage auction = auctions[_auctionId];
        
        require(auction.creator != address(0), "Auction does not exist");
        require(auction.state == AuctionState.Active, "Auction not active");
        require(auction.nftDeposited, "NFT not deposited yet");
        require(block.timestamp <= auction.endTime, "Auction has ended");
        require(msg.sender != auction.creator, "Creator cannot bid");
        require(
            msg.value >= auction.startPrice,
            "Bid must be greater than or equal to the start price"
        );
        require(
            msg.value > auction.highestBid,
            "Bid must be greater than the current highest bid"
        );

        // Hoàn tiền cho người đấu giá trước
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
            emit Refunded(auction.highestBidder, auction.highestBid);
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit NewBid(_auctionId, msg.sender, msg.value);
    }

    // Hàm hủy phiên đấu giá
    function cancelAuction(uint256 _auctionId) public {
        Auction storage auction = auctions[_auctionId];
        
        require(auction.creator != address(0), "Auction does not exist");
        require(msg.sender == auction.creator, "Only creator can cancel auction");
        require(auction.state != AuctionState.Ended && auction.state != AuctionState.Cancelled, 
                "Auction already ended or cancelled");

        auction.state = AuctionState.Cancelled;
        
        // Nếu NFT đã được chuyển vào contract, trả lại cho người tạo
        if (auction.nftDeposited) {
            auction.nftContract.transferFrom(address(this), auction.creator, auction.tokenId);
        }

        // Hoàn tiền cho người đấu giá cao nhất nếu có
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
            emit Refunded(auction.highestBidder, auction.highestBid);
        }

        // Clear active auction for the token
        activeAuctionByToken[auction.tokenId] = 0;
        
        emit AuctionCancelled(_auctionId);
    }

    // Hàm kết thúc và thanh toán phiên đấu giá
    function finalizeAuction(uint256 _auctionId) public {
        Auction storage auction = auctions[_auctionId];
        
        require(auction.creator != address(0), "Auction does not exist");
        require(block.timestamp > auction.endTime, "Auction not yet ended");
        require(auction.state == AuctionState.Active, "Auction not active");
        require(auction.nftDeposited, "NFT not deposited");
        require(msg.sender == auction.creator, "Only creator can finalize");

        auction.state = AuctionState.Ended;
        
        // Clear active auction for the token
        activeAuctionByToken[auction.tokenId] = 0;

        if (auction.highestBidder != address(0)) {
            // Chuyển NFT cho người thắng
            auction.nftContract.transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            // Chuyển tiền cho người tạo
            payable(auction.creator).transfer(auction.highestBid);
        } else {
            // Nếu không có ai đấu giá, trả NFT lại cho người tạo
            auction.nftContract.transferFrom(address(this), auction.creator, auction.tokenId);
        }

        emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
    }

    // Hàm lấy thông tin đấu giá
    function getAuction(uint256 _auctionId) external view returns (
        address creator,
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endTime,
        address highestBidder,
        uint256 highestBid,
        uint256 state,
        bool nftDeposited
    ) {
        Auction storage auction = auctions[_auctionId];
        return (
            auction.creator,
            address(auction.nftContract),
            auction.tokenId,
            auction.startPrice,
            auction.endTime,
            auction.highestBidder,
            auction.highestBid,
            uint256(auction.state),
            auction.nftDeposited
        );
    }

    function requestVerification(uint256 _tokenId) external {
        // Forward the verification request to the NFTVerifier contract
        verifier.requestVerification(_tokenId);
        emit VerificationRequired(_tokenId, msg.sender);
    }
}