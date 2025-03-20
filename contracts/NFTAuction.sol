// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./NFTVerifier.sol";

contract NFTAuction {
    NFTVerifier public verifier;

    struct Auction {
        address creator; // Địa chỉ người tạo đấu giá
        IERC721 nftContract; // Địa chỉ hợp đồng NFT
        uint256 tokenId; // ID của token đang đấu giá
        uint256 startPrice; // Giá khởi điểm
        uint256 endTime; // Thời gian kết thúc
        address highestBidder; // Người trả giá cao nhất
        uint256 highestBid; // Giá cao nhất hiện tại
        bool ended; // Trạng thái đã kết thúc
    }

    // Lưu trữ thông tin các phiên đấu giá theo ID
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCounter;

    // Theo dõi phiên đấu giá đang hoạt động của mỗi token
    mapping(uint256 => uint256) public activeAuctionByToken;

    // Lưu trữ số tiền cần hoàn trả cho người đấu giá
    mapping(uint256 => mapping(address => uint256)) public pendingReturns;

    event VerificationRequired(uint256 tokenId, address creator);

    event AuctionCreated(
        uint256 auctionId,
        address creator,
        uint256 tokenId,
        uint256 startPrice,
        uint256 endTime
    );
    event NewBid(uint256 auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address winner, uint256 amount);
    event AuctionCancelled(uint256 auctionId);
    event Refunded(address bidder, uint256 amount);

    constructor(address _verifierAddress) {
        verifier = NFTVerifier(_verifierAddress);
    }

    function setVerifier(address _verifierAddress) external {
        // Có thể thêm quyền admin ở đây
        verifier = NFTVerifier(_verifierAddress);
    }

    // Hàm tạo phiên đấu giá mới
    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _auctionDuration
    ) external {
        require(_startPrice > 0, "Starting price must be greater than 0");
        require(
            _auctionDuration > 0,
            "Auction duration must be greater than 0"
        );
        require(verifier.isNFTVerified(_tokenId), "NFT not verified");

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Caller is not the owner");
        require(
            nft.getApproved(_tokenId) == address(this),
            "Contract not approved"
        );

        auctionCounter++;
        Auction storage newAuction = auctions[auctionCounter];
        newAuction.creator = msg.sender;
        newAuction.tokenId = _tokenId;
        newAuction.nftContract = nft;
        newAuction.startPrice = _startPrice;
        newAuction.highestBid = _startPrice;
        newAuction.endTime = block.timestamp + _auctionDuration;

        activeAuctionByToken[_tokenId] = auctionCounter;

        emit AuctionCreated(
            auctionCounter,
            msg.sender,
            _tokenId,
            _startPrice,
            newAuction.endTime
        );
    }

    function requestVerification(
        IERC721 _nftContract,
        uint256 _tokenId
    ) public {
        require(
            _nftContract.ownerOf(_tokenId) == msg.sender,
            unicode"Bạn không phải chủ sở hữu"
        );
        emit VerificationRequired(_tokenId, msg.sender);
    }

    // Add a new function to request verification from the auction contract
    function requestVerification(uint256 _tokenId) external {
        // Forward the verification request to the NFTVerifier contract
        verifier.requestVerification(_tokenId);
        emit VerificationRequired(_tokenId, msg.sender);
    }

    // Hàm đặt giá thầu
    function bid(uint256 _auctionId) public payable {
        Auction storage auction = auctions[_auctionId];
        require(auction.creator != address(0), "Auction does not exist");
        require(!auction.ended, "Auction has ended");
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
        require(
            msg.sender == auction.creator,
            "Only creator can cancel auction"
        );
        require(!auction.ended, "Auction already ended");

        auction.ended = true;
        auction.nftContract.transferFrom(
            address(this),
            auction.creator,
            auction.tokenId
        );

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
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
        require(!auction.ended, "Auction already ended");
        require(msg.sender == auction.creator, "Only creator can finalize");

        auction.ended = true;
        // Clear active auction for the token
        activeAuctionByToken[auction.tokenId] = 0;

        if (auction.highestBidder != address(0)) {
            auction.nftContract.transferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );
            payable(auction.creator).transfer(auction.highestBid);
        } else {
            auction.nftContract.transferFrom(
                address(this),
                auction.creator,
                auction.tokenId
            );
        }

        emit AuctionEnded(
            _auctionId,
            auction.highestBidder,
            auction.highestBid
        );
    }

    // Hàm kết thúc đấu giá và xử lý kết quả
    function endAuction(uint256 _auctionId) public {
        Auction storage auction = auctions[_auctionId];
        require(
            block.timestamp >= auction.endTime,
            unicode"Phiên đấu giá chưa kết thúc"
        );
        require(!auction.ended, unicode"Phiên đấu giá đã được kết thúc");
        require(
            msg.sender == auction.creator,
            unicode"Chỉ người tạo mới có thể kết thúc"
        );

        auction.ended = true;
        activeAuctionByToken[auction.tokenId] = 0;

        if (auction.highestBidder != address(0)) {
            // Chuyển tiền cho người tạo
            payable(auction.creator).transfer(auction.highestBid);
            // Chuyển NFT cho người thắng
            auction.nftContract.transferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );
        } else {
            // Nếu không có ai đấu giá, trả NFT lại cho người tạo
            auction.nftContract.transferFrom(
                address(this),
                auction.creator,
                auction.tokenId
            );
        }

        emit AuctionEnded(
            _auctionId,
            auction.highestBidder,
            auction.highestBid
        );
    }
}
