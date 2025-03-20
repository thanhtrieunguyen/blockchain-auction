// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTMinting is ERC721, Ownable {
    using Strings for uint256;

    uint256 public tokenCounter;
    mapping(uint256 => string) private _tokenURIs;
    
    // Base URI for metadata
    string public baseURI;

    constructor() ERC721("AuctionDemo", "ADEMO") {
        tokenCounter = 0;
        baseURI = "https://ipfs.io/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn/";
    }

    // Hàm để cài đặt URI cho token
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }
    
    // Add a public function that can be called from migration script
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner {
        _setTokenURI(tokenId, _tokenURI);
    }

    // Lấy URI của token
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If token URI is set, return it
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // If not, return the combination of base URI and token ID
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId)));
    }
    
    // Test mint function for testing only
    function testMint(address to) public onlyOwner {
        uint256 newTokenId = tokenCounter;
        _safeMint(to, newTokenId);
        // Don't set URI here, let the migration script do it
        tokenCounter++;
    }
}
