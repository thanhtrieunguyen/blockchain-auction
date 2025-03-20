import Web3 from 'web3';
import NFTAuction from './contracts/NFTAuction.json';
import NFTMinting from './contracts/NFTMinting.json';
import NFTVerifier from './contracts/NFTVerifier.json';

export const initWeb3 = async () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
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
  
  // Thêm khởi tạo NFTVerifier contract
  const nftVerifier = new web3.eth.Contract(
    NFTVerifier.abi,
    NFTVerifier.networks[networkId].address
  );

  return { nftAuction, nftMinting, nftVerifier };
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

// Helper function to resolve IPFS URLs
const resolveIPFSUri = (uri) => {
  if (!uri) return null;
  
  // Handle IPFS URIs
  if (uri.startsWith('ipfs://')) {
    // Try multiple IPFS gateways for better reliability
    return `https://ipfs.io/ipfs/${uri.substring(7)}`;
  }
  
  // Handle base64 data URIs
  if (uri.startsWith('data:')) {
    return uri;
  }
  
  // For http/https URLs, return as is
  return uri;
};

export const getAllAuctions = async (web3, nftAuction, nftMinting) => {
  try {
    const auctionCounter = await nftAuction.methods.auctionCounter().call();
    let allAuctions = [];
    for (let i = 1; i <= auctionCounter; i++) {
      const auction = await nftAuction.methods.auctions(i).call();
      
      // Lấy thêm thông tin metadata của NFT
      let metadata = {};
      try {
        // Try to get token metadata
        const tokenAddress = auction.nftContract;
        let tokenURI;

        // Check if NFT is from our contract or external
        if (tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
          // Our NFT contract
          tokenURI = await nftMinting.methods.tokenURI(auction.tokenId).call();
        } else {
          // External NFT contract
          try {
            const externalNFTContract = new web3.eth.Contract(
              [{
                "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                "name": "tokenURI",
                "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                "stateMutability": "view",
                "type": "function"
              }],
              tokenAddress
            );
            tokenURI = await externalNFTContract.methods.tokenURI(auction.tokenId).call();
          } catch (err) {
            console.warn(`Failed to get tokenURI from external contract for auction #${i}:`, err);
          }
        }
        
        console.log(`Token URI for auction #${i}:`, tokenURI);
        
        // Handle different URI formats
        if (tokenURI) {
          if (tokenURI.startsWith('http')) {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          } else if (tokenURI.startsWith('ipfs://')) {
            // Resolve IPFS URI to HTTP gateway
            const resolvedUri = resolveIPFSUri(tokenURI);
            console.log(`Resolved IPFS URI to: ${resolvedUri}`);
            const response = await fetch(resolvedUri);
            metadata = await response.json();
          } else if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64Data = tokenURI.split(',')[1];
            const jsonString = atob(base64Data);
            metadata = JSON.parse(jsonString);
          }
          
          // Resolve image URL if it's IPFS
          if (metadata.image && metadata.image.startsWith('ipfs://')) {
            metadata.image = resolveIPFSUri(metadata.image);
            console.log(`Resolved metadata image URL: ${metadata.image}`);
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch metadata for token ${auction.tokenId}:`, err);
      }
      
      // Ensure metadata has at least empty strings for important fields
      if (!metadata) metadata = {};
      if (!metadata.name) metadata.name = `NFT #${auction.tokenId}`;
      if (!metadata.description) metadata.description = '';
      if (!metadata.image) metadata.image = 'https://via.placeholder.com/300?text=No+Image';
      
      allAuctions.push({
        id: i,
        ...auction,
        metadata: metadata
      });
    }
    return allAuctions;
  } catch (error) {
    console.error("Error fetching all auctions:", error);
    throw error;
  }
};

// Function to check if an NFT is verified
export const checkNFTVerification = async (verifierContract, tokenId) => {
  try {
    const isVerified = await verifierContract.methods.isNFTVerified(tokenId).call();
    return isVerified;
  } catch (error) {
    console.error("Error checking NFT verification status:", error);
    throw error;
  }
};

// Function to get verification status (more detailed than just isVerified)
export const getNFTVerificationStatus = async (verifierContract, tokenId) => {
  try {
    // First check if NFT is verified
    const isVerified = await verifierContract.methods.isNFTVerified(tokenId).call();
    
    if (isVerified) {
      const reason = await verifierContract.methods.verificationReasons(tokenId).call();
      return { status: 2, reason }; // 2 = Verified
    }
    
    // If not verified, check for pending or rejected request
    try {
      const request = await verifierContract.methods.getVerificationRequest(tokenId).call();
      if (request.status === '1') {
        return { status: 1, reason: '' }; // 1 = Pending
      } else if (request.status === '3') {
        return { status: 3, reason: request.reason }; // 3 = Rejected
      }
    } catch (e) {
      // No request found
    }
    
    return { status: 0, reason: '' }; // 0 = Not requested
  } catch (error) {
    console.error("Error getting NFT verification status:", error);
    throw error;
  }
};

// Function to fetch metadata for external NFT
export const getExternalNFTMetadata = async (web3, tokenAddress, tokenId) => {
  try {
    // Create a minimal ERC721 interface
    const erc721Contract = new web3.eth.Contract([
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }
    ], tokenAddress);
    
    let metadata = {
      name: `NFT #${tokenId}`,
      image: 'https://via.placeholder.com/400x400?text=No+Image',
      description: '',
      attributes: []
    };
    
    try {
      const tokenURI = await erc721Contract.methods.tokenURI(tokenId).call();
      
      if (tokenURI) {
        // Resolve IPFS or HTTP URI
        const resolvedURI = resolveIPFSUri(tokenURI);
        
        if (resolvedURI && resolvedURI.startsWith('http')) {
          const response = await fetch(resolvedURI);
          const data = await response.json();
          
          metadata = {
            name: data.name || `NFT #${tokenId}`,
            image: resolveIPFSUri(data.image) || 'https://via.placeholder.com/400x400?text=No+Image',
            description: data.description || '',
            attributes: data.attributes || []
          };
        }
      }
    } catch (error) {
      console.warn("Could not fetch token metadata:", error);
    }
    
    // Get owner
    const owner = await erc721Contract.methods.ownerOf(tokenId).call();
    
    return {
      tokenId,
      tokenAddress,
      owner,
      ...metadata
    };
  } catch (error) {
    console.error("Error fetching external NFT metadata:", error);
    throw error;
  }
};

// Function to get all NFTs owned by a user
export const getUserNFTs = async (web3, nftContract, userAddress) => {
  try {
    console.log(`Fetching NFTs owned by ${userAddress}`);
    
    const userNFTs = [];
    
    // Instead of using totalSupply, use the balanceOf method to get the number of NFTs owned by the user
    try {
      const balance = await nftContract.methods.balanceOf(userAddress).call();
      console.log(`User owns ${balance} NFTs`);
      
      // For each NFT the user owns, get its token ID using tokenOfOwnerByIndex
      for (let i = 0; i < balance; i++) {
        try {
          // Try to use tokenOfOwnerByIndex if available (ERC721Enumerable)
          const tokenId = await nftContract.methods.tokenOfOwnerByIndex(userAddress, i).call();
          console.log(`Found token ID: ${tokenId}`);
          
          // Get token metadata
          let metadata = { 
            name: `NFT #${tokenId}`, 
            image: 'https://via.placeholder.com/400x400?text=No+Image',
            description: ''
          };
          
          try {
            const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
            
            if (tokenURI) {
              // Process token URI - same as before
              if (tokenURI.startsWith('ipfs://')) {
                const resolvedURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
                const response = await fetch(resolvedURI);
                const data = await response.json();
                
                metadata = {
                  name: data.name || `NFT #${tokenId}`,
                  image: data.image || 'https://via.placeholder.com/400x400?text=No+Image',
                  description: data.description || '',
                  attributes: data.attributes || []
                };
                
                // Resolve image URI if it's IPFS
                if (metadata.image && metadata.image.startsWith('ipfs://')) {
                  metadata.image = `https://ipfs.io/ipfs/${metadata.image.substring(7)}`;
                }
              } else if (tokenURI.startsWith('http')) {
                const response = await fetch(tokenURI);
                const data = await response.json();
                
                metadata = {
                  name: data.name || `NFT #${tokenId}`,
                  image: data.image || 'https://via.placeholder.com/400x400?text=No+Image',
                  description: data.description || '',
                  attributes: data.attributes || []
                };
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch metadata for token ${tokenId}:`, err);
          }
          
          userNFTs.push({
            tokenId,
            ...metadata
          });
        } catch (err) {
          console.warn(`Error with tokenOfOwnerByIndex for index ${i}:`, err);
          // ERC721Enumerable not supported, break out of the loop
          break;
        }
      }
      
    } catch (error) {
      console.error("Error accessing balanceOf method:", error);
      // If balanceOf is also not available, this may not be an ERC721 contract
      // Just return an empty array
    }
    
    return userNFTs;
  } catch (error) {
    console.error("Error fetching user's NFTs:", error);
    throw error;
  }
};

// Add a utility function to handle transaction errors
export const handleTransactionError = (error) => {
  console.error('Transaction error:', error);
  
  // Common MetaMask errors with user-friendly messages
  if (error.code === -32603) {
    return 'MetaMask internal error. Please try again or restart your browser.';
  } else if (error.message && error.message.includes('User denied')) {
    return 'Transaction was rejected in your wallet';
  } else if (error.message && error.message.includes('gas')) {
    return 'Gas estimation failed. Network may be congested.';
  } else if (error.message && error.message.includes('nonce')) {
    return 'Transaction nonce error. Try resetting your MetaMask account.';
  } else if (error.message) {
    // Extract relevant part of the error message
    return error.message.split('\n')[0].substring(0, 100);
  }
  
  return 'Failed to complete transaction';
};

// Enhanced transaction sender with retry logic and better error handling
export const sendTransaction = async (method, options = {}) => {
  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
      try {
          // Thêm gas limit hợp lý nếu chưa được cung cấp
          const txOptions = { 
              gas: 500000,  // Tăng từ 300000 lên 500000
              ...options 
          };

          // Ước tính gas price với fallback
          try {
              const web3 = await initWeb3();
              const gasPrice = await web3.eth.getGasPrice();
              // Thêm 20% buffer cho gas price (tăng từ 10%)
              txOptions.gasPrice = Math.floor(parseInt(gasPrice) * 1.2).toString();
          } catch (gasPriceError) {
              console.warn('Không thể ước tính gas price:', gasPriceError);
          }

          // Gửi giao dịch
          return await method.send(txOptions);
      } catch (error) {
          retryCount++;

          // Không retry nếu người dùng từ chối
          if (error.message && (
              error.message.includes('User denied') || 
              error.message.includes('user rejected')
          )) {
              throw error;
          }

          if (retryCount > maxRetries) {
              throw error;
          }

          // Chờ trước khi retry (exponential backoff)
          const waitTime = 2000 * retryCount;  // Tăng thời gian chờ
          console.log(`Đang thử lại giao dịch sau ${waitTime/1000}s (lần ${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
      }
  }
};
