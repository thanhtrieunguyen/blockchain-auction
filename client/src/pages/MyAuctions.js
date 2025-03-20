import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Grid, Card, CardMedia, CardContent, Chip, Skeleton, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';
import { initWeb3, getContracts } from '../web3';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import GavelIcon from '@mui/icons-material/Gavel';
import { Paper, CircularProgress, Divider } from '@mui/material';

// Helper function to get status chip based on auction state
const getStatusChip = (auction) => {
  if (auction.ended) {
    return (
      <Chip 
        label="Ended"
        color="default"
        size="small"
        sx={{ borderRadius: '4px' }}
      />
    );
  }
  if (auction.endTime < Date.now()) {
    return (
      <Chip 
        label="Ready to Finalize"
        color="warning"
        size="small"
        sx={{ borderRadius: '4px' }}
      />
    );
  }
  return (
    <Chip 
      label="Active"
      color="success"
      size="small"
      sx={{ borderRadius: '4px' }}
    />
  );
};

// Enhanced helper function to resolve IPFS URLs or other formats
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
  
  // Handle relative URLs
  if (uri.startsWith('/')) {
    console.log("Relative URI found:", uri);
    return uri;
  }
  
  // For http/https URLs, return as is
  return uri;
};

const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [countdowns, setCountdowns] = useState({}); // NEW: countdown state
  const { account } = useContext(AccountContext);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const fetchMyAuctions = async () => {
    try {
      console.log("Fetching auctions for account:", account);
      setError(null);
      setLoading(true);
      const web3 = await initWeb3();
      const { nftAuction, nftMinting } = await getContracts(web3);
      
      const auctionCounter = await nftAuction.methods.auctionCounter().call();
      console.log("Total auctions:", auctionCounter);
      const myAuctions = [];
      
      for (let i = 1; i <= auctionCounter; i++) {
        try {
          const auction = await nftAuction.methods.auctions(i).call();
          console.log(`Auction #${i}:`, auction);
          
          // Skip if auction doesn't exist or creator doesn't match
          if (!auction || !auction.creator || auction.creator.toLowerCase() !== account.toLowerCase()) {
            continue;
          }
          
          console.log(`Processing auction #${i} owned by me`);
          
          // Use nftContract from the auction data instead of undefined tokenAddress
          const tokenAddress = auction.nftContract;
          console.log(`NFT Contract Address: ${tokenAddress}`);
          
          // Default metadata
          let metadata = { 
            name: `NFT #${auction.tokenId}`, 
            image: 'https://via.placeholder.com/400x400?text=No+Image', 
            description: '' 
          };
          
          try {
            if (tokenAddress) {
              console.log(`Fetching metadata for NFT at address ${tokenAddress}, token ID ${auction.tokenId}`);
              
              let tokenURI;
              try {
                // Check if the token is from our own NFT contract
                if (tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
                  console.log("Using internal NFT contract");
                  tokenURI = await nftMinting.methods.tokenURI(auction.tokenId).call();
                } else {
                  console.log("Using external NFT contract");
                  // Create contract instance for external NFT
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
                }
                console.log("Raw tokenURI:", tokenURI);
              } catch (uriError) {
                console.error("Failed to get tokenURI:", uriError);
                throw new Error("Could not retrieve token URI");
              }
              
              if (tokenURI) {
                try {
                  // Resolve the URI
                  const resolvedURI = resolveIPFSUri(tokenURI);
                  console.log("Resolved tokenURI:", resolvedURI);
                  
                  if (resolvedURI) {
                    // Fetch metadata
                    const response = await fetch(resolvedURI);
                    if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log("NFT Metadata:", data);
                    
                    if (data) {
                      // Process image URL
                      let imageUrl = data.image;
                      if (imageUrl) {
                        imageUrl = resolveIPFSUri(imageUrl);
                        console.log("Resolved image URL:", imageUrl);
                      }
                      
                      metadata = {
                        name: data.name || `NFT #${auction.tokenId}`,
                        image: imageUrl || 'https://via.placeholder.com/400x400?text=No+Image',
                        description: data.description || ''
                      };
                    }
                  }
                } catch (metadataError) {
                  console.error("Error fetching/parsing metadata:", metadataError);
                }
              }
            }
          } catch (metaErr) {
            console.error(`Metadata fetch error for auction #${i}:`, metaErr);
          }
          
          // Calculate auction status and countdown values
          const endTimeMs = parseInt(auction.endTime, 10) * 1000;
          const now = Date.now();
          const hasEnded = now >= endTimeMs || auction.ended;
          // Fix hasBids calculation (highestBid was being compared as string)
          const hasBids = auction.highestBid && auction.highestBid > 0;
          const endTimeFormatted = new Date(endTimeMs).toLocaleString();
          
          const auctionData = {
            id: i,
            tokenId: auction.tokenId,
            tokenAddress: tokenAddress, // Use the tokenAddress we extracted from nftContract
            startPrice: web3.utils.fromWei(auction.startPrice, 'ether'),
            highestBid: web3.utils.fromWei(auction.highestBid, 'ether'),
            highestBidder: auction.highestBidder,
            endTime: endTimeMs,
            endTimeFormatted,
            hasEnded,
            ended: auction.ended,
            hasBids,
            name: metadata.name,
            image: metadata.image,
            description: metadata.description
          };
          
          console.log("Adding auction to list:", auctionData);
          myAuctions.push(auctionData);
        } catch (error) {
          console.error(`Error processing auction #${i}:`, error);
        }
      }
      
      // Sort auctions: active first, then by end time
      myAuctions.sort((a, b) => {
        if (a.hasEnded !== b.hasEnded) return a.hasEnded ? 1 : -1;
        return b.endTime - a.endTime;
      });
      
      console.log("Final auctions list:", myAuctions);
      setAuctions(myAuctions);
    } catch (error) {
      console.error("Error loading auctions:", error);
      setError(error.message || "Failed to load your auctions");
      enqueueSnackbar("Failed to load your auctions", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAuction = async (auctionId) => {
    try {
      setLoading(true);
      const web3 = await initWeb3();
      const { nftAuction } = await getContracts(web3);
      
      await nftAuction.methods.finalizeAuction(auctionId).send({ from: account });
      
      enqueueSnackbar("Auction finalized successfully!", { variant: "success" });
      fetchMyAuctions();
    } catch (error) {
      console.error("Error finalizing auction:", error);
      enqueueSnackbar(error.message || "Failed to finalize auction", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuction = async (auctionId) => {
    try {
      setLoading(true);
      const web3 = await initWeb3();
      const { nftAuction } = await getContracts(web3);
      
      await nftAuction.methods.cancelAuction(auctionId).send({ from: account });
      
      enqueueSnackbar("Auction cancelled successfully!", { variant: "success" });
      fetchMyAuctions();
    } catch (error) {
      console.error("Error cancelling auction:", error);
      enqueueSnackbar(error.message || "Failed to cancel auction", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account) {
      navigate('/connect-wallet', { state: { returnPath: '/my-auctions' } });
      return;
    }
    fetchMyAuctions();
  }, [account, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      auctions.forEach((auction) => {
        if (!auction.hasEnded) {
          const remainingMs = auction.endTime - Date.now();
          if (remainingMs > 0) {
            const minutes = Math.floor((remainingMs / 1000 / 60) % 60);
            const seconds = Math.floor((remainingMs / 1000) % 60);
            newCountdowns[auction.id] = `${minutes}m ${seconds}s`;
          } else {
            newCountdowns[auction.id] = "00m 00s";
          }
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [auctions]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="600">
          Các phiên đấu giá của tôi
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained"
            onClick={() => navigate('/create-auction')}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            Create New Auction
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={fetchMyAuctions} 
            disabled={loading}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px',
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center', 
            color: 'error.main', 
            bgcolor: 'error.light',
            borderRadius: 2
          }}
        >
          <ErrorOutlineIcon sx={{ mr: 1 }} />
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : auctions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" gutterBottom>
            You haven't created any auctions yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Start selling your NFTs by creating your first auction
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/create-auction')}
          >
            Create Auction
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {auctions.map((auction) => (
            <Grid item xs={12} md={6} lg={4} key={auction.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 2,
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                }
              }}>
                <Box 
                  sx={{ 
                    position: 'relative',
                    cursor: 'pointer' 
                  }}
                  onClick={() => navigate(`/auctions/${auction.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={auction.image || 'https://via.placeholder.com/400x400?text=No+Image'}
                    alt={auction.name}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      console.error("Image failed to load:", e.target.src);
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    }}
                  />
                  
                  {/* Status badge */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10
                  }}>
                    {getStatusChip(auction)}
                  </Box>
                  
                  {/* Countdown badge for active auctions */}
                  {!auction.ended && auction.endTime > Date.now() && (
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: 'rgba(0,0,0,0.7)', 
                      color: 'white',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        {countdowns[auction.id] || "Loading..."}
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <CardContent 
                  sx={{ 
                    flexGrow: 1, 
                    p: 2,
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/auctions/${auction.id}`)}
                >
                  {/* NFT Name */}
                  <Typography 
                    variant="h6" 
                    component="div" 
                    noWrap
                    sx={{ 
                      mb: 2,
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    }}
                  >
                    {auction.name}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Price info */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box display="flex" alignItems="center">
                      <LocalOfferIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" component="span">
                        {auction.hasBids ? 'Current bid:' : 'Start price:'}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body1" 
                      fontWeight="bold" 
                      color={auction.hasBids ? 'primary.main' : 'text.primary'}
                    >
                      {auction.hasBids ? auction.highestBid : auction.startPrice} ETH
                    </Typography>
                  </Box>
                  
                  {/* End time */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box display="flex" alignItems="center">
                      <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {auction.ended ? 'Ended on:' : 'Ends on:'}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {auction.endTimeFormatted}
                    </Typography>
                  </Box>
                  
                  {/* Bid status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box display="flex" alignItems="center">
                      <GavelIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" component="span">
                        Bids:
                      </Typography>
                    </Box>
                    <Box>
                      {auction.hasBids ? (
                        <Chip 
                          size="small" 
                          label="Has bids" 
                          color="success" 
                          variant="outlined"
                          sx={{ height: 24, borderRadius: '4px' }}
                        />
                      ) : (
                        <Chip 
                          size="small" 
                          label="No bids" 
                          color="default" 
                          variant="outlined" 
                          sx={{ height: 24, borderRadius: '4px' }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
                
                {/* Action buttons in a separate container that isn't clickable */}
                <Box sx={{ p: 2, pt: 0, bgcolor: 'background.paper' }}>
                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!auction.ended && auction.endTime < Date.now() && (
                      <Button 
                        variant="contained" 
                        color="primary"
                        size="small"
                        fullWidth
                        onClick={() => handleFinalizeAuction(auction.id)}
                        sx={{ 
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Finalize
                      </Button>
                    )}
                    
                    {!auction.ended && !auction.hasBids && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        size="small"
                        fullWidth
                        onClick={() => handleCancelAuction(auction.id)}
                        sx={{ 
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default MyAuctions;