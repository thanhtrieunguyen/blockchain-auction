import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { AccountContext } from '../../context/AccountContext';
import { initWeb3 } from '../../web3';

// Component kiểm tra tính hợp lệ của NFT trước khi sử dụng
const NFTValidator = ({ nft, auctionContractAddress, onValidationComplete }) => {
  const { account } = useContext(AccountContext);
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [verified, setVerified] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false); // Track if validation was attempted
  
  // Sử dụng useEffect riêng để kiểm tra xác thực NFT từ smart contract
  useEffect(() => {
    if (!nft || !nft.tokenId) return;
  
    const checkVerificationStatus = async () => {
      try {
        const web3 = await initWeb3();
        const { nftVerifier } = await getContracts(web3);
  
        if (!nftVerifier || !nftVerifier.methods) {
          console.log("NFTVerifier contract không khả dụng");
          return;
        }
  
        const tokenId = nft.tokenId;
        const isVerified = await nftVerifier.methods.isNFTVerified(tokenId).call();
        console.log(`Trạng thái xác thực của NFT #${tokenId} từ smart contract:`, isVerified);
  
        setVerified(isVerified);
  
        // Nếu NFT chưa được xác thực, hiển thị thông báo rõ ràng
        if (!isVerified) {
          setValidationResults({
            isValid: false,
            ownershipValid: true,
            approvalValid: true,
            verified: false,
            errors: ['NFT chưa được xác thực. Vui lòng yêu cầu xác thực trước khi tạo đấu giá.']
          });
          setValidationAttempted(true);
          if (onValidationComplete) {
            onValidationComplete({
              isValid: false,
              ownershipValid: true,
              approvalValid: true,
              verified: false,
              errors: ['NFT chưa được xác thực. Vui lòng yêu cầu xác thực trước khi tạo đấu giá.']
            });
          }
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái xác thực NFT:", error);
      }
    };
  
    checkVerificationStatus();
  }, [nft && nft.tokenId, onValidationComplete]);  
  
  useEffect(() => {
    // Nếu NFT đã được xác thực từ smart contract, không cần kiểm tra thêm
    if (verified) return;
    
    // Nếu không có NFT hoặc account hoặc contract address, không làm gì cả
    if (!nft || !account || !auctionContractAddress) return;
    
    // Nếu đã validate và không phải là verified, không cần validate lại
    // This prevents infinite loops for unverified NFTs
    if (validationAttempted && validationResults && !validationResults.verified) return;
    
    const validateNFT = async () => {
      // Kiểm tra nếu đã đang trong quá trình xác thực, không xác thực lại
      if (validating) return;
      
      setValidating(true);
      try {
        const web3 = await initWeb3();
        
        const results = {
          isValid: true,
          ownershipValid: false,
          approvalValid: false,
          verified: false,
          errors: []
        };
        
        // Chuẩn bị địa chỉ hợp đồng và tokenId từ dữ liệu NFT
        const tokenAddress = nft.address || nft.tokenAddress || auctionContractAddress;
        const tokenId = nft.tokenId;
        
        if (!tokenAddress || !tokenId) {
          throw new Error("Thiếu thông tin địa chỉ token hoặc token ID");
        }
        
        // Sử dụng ABI tối thiểu để tránh lỗi validator
        const minimalERC721ABI = [
          {
            "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
            "name": "ownerOf",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
            "name": "getApproved",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          }
        ];
        
        const nftContract = new web3.eth.Contract(minimalERC721ABI, tokenAddress);
        
        // Kiểm tra quyền sở hữu
        try {
          console.log(`Đang kiểm tra quyền sở hữu: token ${tokenId} tại địa chỉ ${tokenAddress}`);
          const owner = await nftContract.methods.ownerOf(tokenId).call();
          console.log(`Chủ sở hữu NFT: ${owner}, Tài khoản hiện tại: ${account}`);
          
          results.ownershipValid = (owner.toLowerCase() === account.toLowerCase());
          
          if (!results.ownershipValid) {
            results.isValid = false;
            results.errors.push(`Bạn không phải là chủ sở hữu của NFT này. Chủ sở hữu: ${owner}`);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra quyền sở hữu:", error);
          results.isValid = false;
          results.errors.push('Không thể xác minh quyền sở hữu: ' + (error.message || "Lỗi không xác định"));
        }
        
        // Kiểm tra phê duyệt
        if (results.ownershipValid) {
          try {
            console.log(`Đang kiểm tra phê duyệt: token ${tokenId} cho địa chỉ ${auctionContractAddress}`);
            const approved = await nftContract.methods.getApproved(tokenId).call();
            console.log(`Địa chỉ được phê duyệt: ${approved}`);
            
            results.approvalValid = (approved.toLowerCase() === auctionContractAddress.toLowerCase());
            
            if (!results.approvalValid) {
              // Đây không phải là lỗi nghiêm trọng vì có thể phê duyệt sau
              results.errors.push('NFT chưa được phê duyệt cho hợp đồng đấu giá');
            }
          } catch (error) {
            console.error("Lỗi khi kiểm tra phê duyệt:", error);
            results.errors.push('Không thể kiểm tra phê duyệt: ' + (error.message || "Lỗi không xác định"));
          }
        }
        
        // Đánh dấu rằng validation đã được thử
        setValidationAttempted(true);
        
        setValidationResults(results);
        if (onValidationComplete) {
          onValidationComplete(results);
        }
      } catch (error) {
        console.error("Lỗi khi xác thực NFT:", error);
        setValidationResults({
          isValid: false,
          verified: false,
          errors: ['Lỗi xác thực NFT: ' + (error.message || "Lỗi không xác định")]
        });
        
        // Đánh dấu rằng validation đã được thử
        setValidationAttempted(true);
        
        if (onValidationComplete) {
          onValidationComplete({
            isValid: false,
            verified: false,
            errors: ['Lỗi xác thực NFT: ' + (error.message || "Lỗi không xác định")]
          });
        }
      } finally {
        setValidating(false);
      }
    };
    
    // Chỉ chạy một lần khi component mount hoặc khi cần thiết
    validateNFT();
  }, [nft, account, auctionContractAddress, verified, validationAttempted, validationResults, validating, onValidationComplete]);
  
  if (!nft) return null;
  
  return (
      <Box sx={{ mt: 2, mb: 2 }}>
        {validating && (
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography>Đang xác thực NFT...</Typography>
          </Box>
        )}
        
        {verified && (
          <Alert severity="success">
            <Typography variant="body2">
              NFT này đã được xác thực. Bạn có thể tiếp tục tạo đấu giá.
            </Typography>
          </Alert>
        )}
        
        {!verified && validationResults && !validationResults.isValid && (
          <Alert severity="error">
            <Typography variant="body2" fontWeight="bold">
              Lỗi xác thực NFT:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {validationResults.errors.map((error, index) => (
                <li key={index}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        
        {!verified && validationResults && validationResults.errors.length > 0 && (
          <Alert severity={validationResults.isValid ? "warning" : "error"}>
            <Typography variant="body2" fontWeight="bold">
              {validationResults.isValid ? "Cảnh báo:" : "Lỗi:"}
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {validationResults.errors.map((error, index) => (
                <li key={index}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        
        {!verified && validationResults && validationResults.isValid && !validationResults.approvalValid && (
          <Alert severity="info">
            <Typography variant="body2">
              NFT của bạn cần được phê duyệt trước khi tạo đấu giá. Quá trình này sẽ được tự động thực hiện khi bạn tạo đấu giá.
            </Typography>
          </Alert>
        )}
        
        {!verified && validationResults && validationResults.isValid && validationResults.ownershipValid && validationResults.approvalValid && (
          <Alert severity="info">
            <Typography variant="body2">
              NFT hợp lệ nhưng chưa được xác thực. Bạn cần yêu cầu xác thực NFT trước khi tạo đấu giá.
            </Typography>
          </Alert>
        )}
        
        {!verified && validationAttempted && !validating && (
          <Alert severity="warning">
            <Typography variant="body2">
              NFT này chưa được xác thực. Vui lòng yêu cầu xác thực trước khi tạo đấu giá.
            </Typography>
          </Alert>
        )}
      </Box>
    );
};

// Helper function to get contracts
async function getContracts(web3) {
  try {
    const networkId = await web3.eth.net.getId();
    
    // Import contract ABIs directly rather than using dynamic import
    // This helps avoid potential ESLint issues and improves reliability
    const NFTVerifier = require('../../contracts/NFTVerifier.json');
    
    // Initialize the contract instances
    const nftVerifier = new web3.eth.Contract(
      NFTVerifier.abi,
      NFTVerifier.networks[networkId]?.address
    );
    
    return { nftVerifier };
  } catch (error) {
    console.error("Error getting contracts:", error);
    return {};
  }
}

export default NFTValidator;
