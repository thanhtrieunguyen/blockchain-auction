import Web3 from 'web3';
import NFTAuction from './contracts/NFTAuction.json';
import NFTMinting from './contracts/NFTMinting.json';


export const initWeb3 = async () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.enable();
      return web3;
    } catch (error) {
      throw new Error("User denied account access");
    }
  }
  throw new Error("Please install MetaMask!");
};

export const getContracts = async (web3) => {
  const networkId = await web3.eth.net.getId();
  
  const nftAuction = new web3.eth.Contract(
    NFTAuction.abi,
    NFTAuction.networks[networkId].address
  );

  const nftMinting = new web3.eth.Contract(
    NFTMinting.abi, 
    NFTMinting.networks[networkId].address
  );

  return { nftAuction, nftMinting };
};

export const approveNFT = async (web3, nftContract, account, tokenId, spenderAddress) => {
  try {
    // Kiểm tra xem NFT đã được phê duyệt chưa
    const approved = await nftContract.methods.getApproved(tokenId).call();
    
    if (approved.toLowerCase() !== spenderAddress.toLowerCase()) {
      const gasEstimate = await nftContract.methods
        .approve(spenderAddress, tokenId)
        .estimateGas({ from: account });
        
      const result = await nftContract.methods
        .approve(spenderAddress, tokenId)
        .send({
          from: account,
          gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        });
        
      return result;
    }
    return true; // Đã được phê duyệt
  } catch (error) {
    console.error("Approval error:", error);
    throw error;
  }
};

// Hàm kiểm tra quyền sở hữu NFT
export const checkOwnership = async (nftContract, account, tokenId) => {
  try {
    const owner = await nftContract.methods.ownerOf(tokenId).call();
    return owner.toLowerCase() === account.toLowerCase();
  } catch (error) {
    console.error("Ownership check error:", error);
    throw error;
  }
};

export const getUserCreatedAuctions = async (web3, nftAuction, nftMinting, userAddress) => {
  try {
    const auctionCounter = await nftAuction.methods.auctionCounter().call();
    let userAuctions = [];
    
    for (let i = 1; i <= auctionCounter; i++) {
      const auction = await nftAuction.methods.auctions(i).call();
      
      if (auction.creator.toLowerCase() === userAddress.toLowerCase()) {
        // Lấy thêm thông tin metadata của NFT
        const tokenURI = await nftMinting.methods.tokenURI(auction.tokenId).call();
        let metadata = {};
        
        if (tokenURI.startsWith('http')) {
          try {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          } catch (err) {
            console.warn(`Failed to fetch metadata for token ${auction.tokenId}`);
          }
        }
        
        userAuctions.push({
          id: i,
          ...auction,
          metadata: metadata
        });
      }
    }
    
    return userAuctions;
  } catch (error) {
    console.error("Error fetching user created auctions:", error);
    throw error;
  }
};

// Lấy danh sách auction mà người dùng đang đặt giá cao nhất
export const getUserBidAuctions = async (web3, nftAuction, nftMinting, userAddress) => {
  try {
    const auctionCounter = await nftAuction.methods.auctionCounter().call();
    let userBids = [];
    
    for (let i = 1; i <= auctionCounter; i++) {
      const auction = await nftAuction.methods.auctions(i).call();
      
      if (auction.highestBidder.toLowerCase() === userAddress.toLowerCase()) {
        // Lấy thêm thông tin metadata của NFT
        const tokenURI = await nftMinting.methods.tokenURI(auction.tokenId).call();
        let metadata = {};
        
        if (tokenURI.startsWith('http')) {
          try {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          } catch (err) {
            console.warn(`Failed to fetch metadata for token ${auction.tokenId}`);
          }
        }
        
        userBids.push({
          id: i,
          ...auction,
          metadata: metadata
        });
      }
    }
    
    return userBids;
  } catch (error) {
    console.error("Error fetching user bid auctions:", error);
    throw error;
  }
};