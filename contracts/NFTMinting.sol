// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTMinting is ERC721, Ownable {
    using Strings for uint256;

    uint256 public tokenCounter;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => uint256) public mintPrices;
    mapping(uint256 => bool) public availableToMint;

    event NFTCreated(uint256 indexed tokenId, string tokenURI, uint256 price);
    event NFTMinted(address indexed minter, uint256 indexed tokenId);

    constructor() ERC721("MyNFT", "MNFT") {
        tokenCounter = 0;
    }

    // Chỉ admin có thể tạo NFT mới
    function createNFT(
        string memory _tokenURI,
        uint256 price
    ) public onlyOwner returns (uint256) {
        uint256 newTokenId = tokenCounter;
        _tokenURIs[newTokenId] = _tokenURI;
        mintPrices[newTokenId] = price;
        availableToMint[newTokenId] = true;

        tokenCounter++;
        emit NFTCreated(newTokenId, _tokenURI, price);
        return newTokenId;
    }

    // Người dùng có thể mint NFT đã được tạo
    function mintNFT(uint256 tokenId) public payable {
        require(availableToMint[tokenId], "NFT is not available to mint");
        require(msg.value >= mintPrices[tokenId], "Insufficient payment");
        require(!_exists(tokenId), "NFT already minted");

        _safeMint(msg.sender, tokenId);
        availableToMint[tokenId] = false;

        // Hoàn trả tiền thừa nếu có
        if (msg.value > mintPrices[tokenId]) {
            payable(msg.sender).transfer(msg.value - mintPrices[tokenId]);
        }

        emit NFTMinted(msg.sender, tokenId);
    }

    // Lấy URI của token
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(
            _exists(tokenId) || availableToMint[tokenId],
            "URI query for nonexistent token"
        );
        return _tokenURIs[tokenId];
    }

    // Lấy giá mint của token
    function getMintPrice(uint256 tokenId) public view returns (uint256) {
        require(availableToMint[tokenId], "NFT is not available to mint");
        return mintPrices[tokenId];
    }

    // Lấy danh sách NFT có thể mint
    function getAvailableNFTs() public view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < tokenCounter; i++) {
            if (availableToMint[i]) count++;
        }

        uint256[] memory availableTokens = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tokenCounter; i++) {
            if (availableToMint[i]) {
                availableTokens[index] = i;
                index++;
            }
        }
        return availableTokens;
    }

    // Admin có thể rút tiền
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
}
