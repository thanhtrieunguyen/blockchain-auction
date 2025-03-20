import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Grid, Box, Button, Card, CardContent, 
  CardMedia, Divider, Paper, TextField, CircularProgress, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';
import { initWeb3, getContracts, getUserNFTs, checkOwnership } from '../web3';
import { useSnackbar } from 'notistack';
import VerificationStatus from '../components/verification/VerificationStatus';

// Helper function to resolve and format IPFS URIs
const resolveIPFSUri = (uri) => {
  if (!uri) return null;
  
  // Handle IPFS URIs
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.substring(7)}`;
  }
  
  // Handle base64 data URIs
  if (uri.startsWith('data:')) {
    return uri;
  }
  
  // For http/https URLs, return as is
  return uri;
};

const MyNFTs = () => {
  const { account, contracts } = useContext(AccountContext);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState({ tokenAddress: '', tokenId: '' });
  const [importLoading, setImportLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch user's NFTs
  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!account) {
        setError("Please connect your wallet");
        setLoading(false);
        return;
      }
      
      const web3 = await initWeb3();
      const { nftMinting, nftVerifier } = await getContracts(web3);
      
      // Get user's NFTs
      const userNFTs = await getUserNFTs(web3, nftMinting, account);
      
      // Check verification status for each NFT
      // Trong hàm fetchNFTs của MyNFTs.js
const verifiedNFTs = await Promise.all(
  userNFTs.map(async (nft) => {
      try {
          // Đảm bảo tokenId là số
          const tokenIdValue = typeof nft.tokenId === 'string' ? parseInt(nft.tokenId, 10) : nft.tokenId;
          
          const isVerified = await nftVerifier.methods.isNFTVerified(tokenIdValue).call();
          let verificationStatus = 0; // Not requested
          let verificationReason = '';

          if (isVerified) {
              verificationStatus = 2; // Verified
              verificationReason = await nftVerifier.methods.verificationReasons(tokenIdValue).call();
          } else {
              // Kiểm tra xem đã yêu cầu xác thực chưa
              try {
                  const request = await nftVerifier.methods.getVerificationRequest(tokenIdValue).call();
                  // Kiểm tra xem requester có phải là địa chỉ 0 không (không có yêu cầu)
                  if (request.requester !== '0x0000000000000000000000000000000000000000') {
                      if (parseInt(request.status) === 1) {
                          verificationStatus = 1; // Pending
                      } else if (parseInt(request.status) === 3) {
                          verificationStatus = 3; // Rejected
                          verificationReason = request.reason;
                      }
                  }
              } catch (e) {
                  console.log("Không tìm thấy yêu cầu xác thực:", e);
              }
          }

          return {
              ...nft,
              verificationStatus,
              verificationReason,
              contractAddress: nftMinting._address
          };
      } catch (error) {
          console.error(`Lỗi khi kiểm tra xác thực cho NFT #${nft.tokenId}:`, error);
          return {
              ...nft,
              verificationStatus: 0,
              contractAddress: nftMinting._address
          };
      }
  })
);
      
      // Also fetch imported NFTs from localStorage
      const importedNFTsJson = localStorage.getItem('importedNFTs');
      let importedNFTs = importedNFTsJson ? JSON.parse(importedNFTsJson) : [];
      
      // Filter to only show NFTs owned by this account
      importedNFTs = importedNFTs.filter(nft => nft.owner && nft.owner.toLowerCase() === account.toLowerCase());
      
      // Check verification status for imported NFTs
      const verifiedImportedNFTs = await Promise.all(
        importedNFTs.map(async (nft) => {
          try {
            const isVerified = await nftVerifier.methods.isNFTVerified(nft.tokenId).call();
            let verificationStatus = 0; // Not requested
            let verificationReason = '';
            
            if (isVerified) {
              verificationStatus = 2; // Verified
              verificationReason = await nftVerifier.methods.verificationReasons(nft.tokenId).call();
            } else {
              // Check if verification was requested
              try {
                const request = await nftVerifier.methods.getVerificationRequest(nft.tokenId).call();
                if (request.status === '1') {
                  verificationStatus = 1; // Pending
                } else if (request.status === '3') {
                  verificationStatus = 3; // Rejected
                  verificationReason = request.reason;
                }
              } catch (e) {
                console.log("No verification request found");
              }
            }
            
            return {
              ...nft,
              verificationStatus,
              verificationReason
            };
          } catch (error) {
            console.error(`Error checking verification for imported NFT #${nft.tokenId}:`, error);
            return { ...nft, verificationStatus: 0 };
          }
        })
      );
      
      // Combine both lists
      setNfts([...verifiedNFTs, ...verifiedImportedNFTs]);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      setError("Failed to load your NFTs. Please try again.");
      enqueueSnackbar("Failed to load your NFTs", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Import external NFT
  const handleImportNFT = async () => {
    try {
      setImportLoading(true);
      setError(null);
      
      const { tokenAddress, tokenId } = importData;
      
      if (!tokenAddress || !tokenId) {
        enqueueSnackbar("Please enter both contract address and token ID", { variant: "error" });
        return;
      }
      
      const web3 = await initWeb3();
      
      // Check if the NFT exists and is owned by the current user
      try {
        // Create a minimal ERC721 interface to check ownership
        const erc721Contract = new web3.eth.Contract([
          {
            "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
            "name": "ownerOf",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
            "name": "tokenURI",
            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function"
          }
        ], tokenAddress);
        
        // Check ownership
        const owner = await erc721Contract.methods.ownerOf(tokenId).call();
        
        if (owner.toLowerCase() !== account.toLowerCase()) {
          enqueueSnackbar("You don't own this NFT", { variant: "error" });
          return;
        }
        
        // Try to get token metadata
        let tokenURI;
        let metadata = { name: `NFT #${tokenId}`, image: null, description: '' };
        
        try {
          tokenURI = await erc721Contract.methods.tokenURI(tokenId).call();
          
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
        
        // Store imported NFT
        const importedNFT = {
          tokenId,
          contractAddress: tokenAddress,
          owner: account,
          name: metadata.name,
          image: metadata.image,
          description: metadata.description,
          attributes: metadata.attributes || [],
          importedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        const savedNFTsJson = localStorage.getItem('importedNFTs');
        const savedNFTs = savedNFTsJson ? JSON.parse(savedNFTsJson) : [];
        
        // Check if this NFT is already imported
        const existingIndex = savedNFTs.findIndex(
          nft => nft.contractAddress.toLowerCase() === tokenAddress.toLowerCase() && 
                nft.tokenId === tokenId
        );
        
        if (existingIndex >= 0) {
          // Update existing entry
          savedNFTs[existingIndex] = importedNFT;
        } else {
          // Add new entry
          savedNFTs.push(importedNFT);
        }
        
        localStorage.setItem('importedNFTs', JSON.stringify(savedNFTs));
        
        enqueueSnackbar("NFT imported successfully", { variant: "success" });
        setImportDialogOpen(false);
        setImportData({ tokenAddress: '', tokenId: '' });
        
        // Refresh NFT list
        fetchNFTs();
        
      } catch (error) {
        console.error("Error importing NFT:", error);
        enqueueSnackbar(error.message || "Failed to import NFT", { variant: "error" });
      }
    } finally {
      setImportLoading(false);
    }
  };

  // Handle verification status change (refresh the list)
  const handleVerificationChange = () => {
    fetchNFTs();
  };

  // Navigate to create auction if NFT is verified
  const handleCreateAuction = (nft) => {
    if (nft.verificationStatus === 2) {
      // NFT is verified, navigate to create auction
      navigate('/create-auction', { 
        state: { 
          tokenAddress: nft.contractAddress, 
          tokenId: nft.tokenId 
        } 
      });
    } else {
      // NFT is not verified
      enqueueSnackbar("This NFT must be verified before creating an auction", { variant: "warning" });
    }
  };

  useEffect(() => {
    if (!account) {
      navigate('/connect-wallet', { state: { returnPath: '/my-nfts' } });
      return;
    }
    
    fetchNFTs();
  }, [account, navigate]);

  // Import Dialog
  const ImportDialog = () => (
    <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
      <DialogTitle>Import External NFT</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Import NFTs you own from other contracts to verify them for auctions.
          </Typography>
          
          <TextField
            label="NFT Contract Address"
            fullWidth
            value={importData.tokenAddress}
            onChange={(e) => setImportData({...importData, tokenAddress: e.target.value})}
            margin="normal"
            variant="outlined"
            placeholder="0x..."
          />
          
          <TextField
            label="Token ID"
            fullWidth
            value={importData.tokenId}
            onChange={(e) => setImportData({...importData, tokenId: e.target.value})}
            margin="normal"
            variant="outlined"
            placeholder="1"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleImportNFT} 
          color="primary" 
          variant="contained"
          disabled={importLoading}
        >
          {importLoading ? <CircularProgress size={24} /> : "Import NFT"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render verification status chip
  const renderVerificationStatusChip = (status) => {
    switch(status) {
      case 1:
        return <Chip label="Đang chờ xác thực" color="warning" size="small" />;
      case 2:
        return <Chip label="Đã xác thực" color="success" size="small" />;
      case 3:
        return <Chip label="Bị từ chối" color="error" size="small" />;
      default:
        return <Chip label="Chưa xác thực" color="default" size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            My NFTs
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setImportDialogOpen(true)}
          >
            Import NFT
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : nfts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              You don't have any NFTs yet
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/marketplace')}
            >
              Browse Marketplace
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {nfts.map((nft, index) => (
              <Grid item key={`${nft.contractAddress}-${nft.tokenId}`} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={nft.image || 'https://via.placeholder.com/400x400?text=No+Image'}
                    alt={nft.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h2" noWrap>
                        {nft.name || `NFT #${nft.tokenId}`}
                      </Typography>
                      {renderVerificationStatusChip(nft.verificationStatus)}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Token ID: {nft.tokenId}
                    </Typography>
                    
                    <Typography variant="body2" noWrap sx={{ mb: 1 }}>
                      {nft.description || 'No description available'}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <VerificationStatus
                        verifierContract={contracts.nftVerifier}
                        tokenId={nft.tokenId}
                        account={account}
                        onRequestVerification={handleVerificationChange}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleCreateAuction(nft)}
                        disabled={nft.verificationStatus !== 2}
                      >
                        Create Auction
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      <ImportDialog />
    </Container>
  );
};

export default MyNFTs;
