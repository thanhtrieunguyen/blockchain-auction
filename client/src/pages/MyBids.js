import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Grid, Card, CardMedia, CardContent, Chip, Button, Divider, CircularProgress, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';
import { initWeb3, getContracts } from '../web3';
import { useSnackbar } from 'notistack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import GavelIcon from '@mui/icons-material/Gavel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Helper function to get status chip based on auction and bid state
const getStatusChip = (auction, isHighestBidder) => {
  if (auction.ended) {
    return (
      <Chip 
        label={isHighestBidder ? "Won" : "Ended"}
        color={isHighestBidder ? "success" : "default"}
        size="small"
        sx={{ borderRadius: '4px', fontWeight: 'bold' }}
      />
    );
  }
  
  if (auction.endTime < Date.now()) {
    return (
      <Chip 
        label="Auction Ended"
        color="warning"
        size="small"
        sx={{ borderRadius: '4px', fontWeight: 'bold' }}
      />
    );
  }
  
  return (
    <Chip 
      label={isHighestBidder ? "Highest Bidder" : "Outbid"}
      color={isHighestBidder ? "success" : "error"}
      size="small"
      sx={{ borderRadius: '4px', fontWeight: 'bold' }}
    />
  );
};

// Helper function to resolve IPFS URLs
const resolveImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/300?text=No+Image';
  
  if (url.startsWith('http')) return url;
  
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.substring(7)}`;
  }
  
  return url;
};

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdowns, setCountdowns] = useState({});
  const { account } = useContext(AccountContext);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const fetchMyBids = async () => {
    try {
      console.log("Fetching bids for account:", account);
      setError(null);
      setLoading(true);
      const web3 = await initWeb3();
      const { nftAuction, nftMinting } = await getContracts(web3);
      
      // Get total auction count
      const auctionCounter = await nftAuction.methods.auctionCounter().call();
      console.log("Total auctions:", auctionCounter);
      
      // Get all bids for the current user
      const myBids = [];
      const processedAuctions = new Set(); // To track unique auctions
      
      // For simplicity, we'll check all auctions
      for (let i = 1; i <= auctionCounter; i++) {
        try {
          const auction = await nftAuction.methods.auctions(i).call();
          
          // Check if user is the highest bidder or has bid on this auction
          const userIsBidder = auction.highestBidder.toLowerCase() === account.toLowerCase();
          
          // For this example, we're only tracking auctions where the user is the highest bidder
          // In a real app, you'd want to track all bids by the user
          if (!userIsBidder) {
            continue;
          }
          
          // Don't process the same auction twice
          if (processedAuctions.has(i)) {
            continue;
          }
          processedAuctions.add(i);
          
          console.log(`Processing auction #${i} where user has bid`);
          
          // Get NFT metadata
          const tokenAddress = auction.nftContract;
          
          // Default metadata
          let metadata = { 
            name: `NFT #${auction.tokenId}`, 
            image: 'https://via.placeholder.com/400x400?text=No+Image', 
            description: '' 
          };
          
          try {
            if (tokenAddress) {
              // Get token URI
              let tokenURI;
              
              if (tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
                tokenURI = await nftMinting.methods.tokenURI(auction.tokenId).call();
              } else {
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
              
              // Resolve and fetch metadata
              if (tokenURI) {
                // Handle IPFS URI
                let resolvedURI = tokenURI;
                if (tokenURI.startsWith('ipfs://')) {
                  resolvedURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
                }
                
                // Fetch metadata
                const response = await fetch(resolvedURI);
                if (response.ok) {
                  const data = await response.json();
                  
                  let imageUrl = data.image;
                  if (imageUrl && imageUrl.startsWith('ipfs://')) {
                    imageUrl = `https://ipfs.io/ipfs/${imageUrl.substring(7)}`;
                  }
                  
                  metadata = {
                    name: data.name || `NFT #${auction.tokenId}`,
                    image: imageUrl || 'https://via.placeholder.com/400x400?text=No+Image',
                    description: data.description || ''
                  };
                }
              }
            }
          } catch (metaErr) {
            console.error(`Metadata fetch error for auction #${i}:`, metaErr);
          }
          
          // Calculate auction status
          const endTimeMs = parseInt(auction.endTime, 10) * 1000;
          const now = Date.now();
          const hasEnded = now >= endTimeMs || auction.ended;
          const userIsHighestBidder = auction.highestBidder.toLowerCase() === account.toLowerCase();
          
          // Format auction data
          const bidData = {
            id: i,
            auctionId: i,
            tokenId: auction.tokenId,
            name: metadata.name,
            image: metadata.image,
            description: metadata.description,
            currentBid: web3.utils.fromWei(auction.highestBid, 'ether'),
            startPrice: web3.utils.fromWei(auction.startPrice, 'ether'),
            userIsHighestBidder,
            ended: auction.ended,
            hasEnded,
            endTime: endTimeMs,
            endTimeFormatted: new Date(endTimeMs).toLocaleString(),
            creator: auction.creator,
            creatorFormatted: `${auction.creator.substring(0, 6)}...${auction.creator.substring(38)}`
          };
          
          myBids.push(bidData);
        } catch (error) {
          console.error(`Error processing auction #${i}:`, error);
        }
      }
      
      // Sort bids: active auctions first, then by end time
      myBids.sort((a, b) => {
        if (a.hasEnded !== b.hasEnded) return a.hasEnded ? 1 : -1;
        return b.endTime - a.endTime;
      });
      
      console.log("Final bids list:", myBids);
      setBids(myBids);
    } catch (error) {
      console.error("Error loading bids:", error);
      setError(error.message || "Failed to load your bids");
      enqueueSnackbar("Failed to load your bids", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Set up countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns = {};
      bids.forEach((bid) => {
        if (!bid.hasEnded) {
          const remainingMs = bid.endTime - Date.now();
          if (remainingMs > 0) {
            const minutes = Math.floor((remainingMs / 1000 / 60) % 60);
            const seconds = Math.floor((remainingMs / 1000) % 60);
            newCountdowns[bid.id] = `${minutes}m ${seconds}s`;
          } else {
            newCountdowns[bid.id] = "00m 00s";
          }
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [bids]);

  // Fetch bids when account changes
  useEffect(() => {
    if (!account) {
      navigate('/connect-wallet', { state: { returnPath: '/my-bids' } });
      return;
    }
    fetchMyBids();
  }, [account, navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="600">
          Các lượt đặt của tôi
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
            onClick={fetchMyBids} 
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
      ) : bids.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" gutterBottom>
            You haven't placed any bids yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Start bidding on NFTs to see them listed here
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
          >
            Browse Auctions
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {bids.map((bid) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={bid.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                  },
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
                onClick={() => navigate(`/auctions/${bid.auctionId}`)}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={resolveImageUrl(bid.image)}
                    alt={bid.name}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      console.log("Image failed to load:", e.target.src);
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                    }}
                  />
                  
                  {/* Status Badge */}
                  <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                    {getStatusChip(bid, bid.userIsHighestBidder)}
                  </Box>
                  
                  {/* Countdown badge for active auctions */}
                  {!bid.hasEnded && (
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
                      <AccessTimeIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
                      <Typography variant="body2" fontWeight="medium">
                        {countdowns[bid.id] || "Loading..."}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Winner badge */}
                  {bid.hasEnded && bid.userIsHighestBidder && (
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: 'rgba(46, 125, 50, 0.85)', // Green background
                      color: 'white',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <EmojiEventsIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
                      <Typography variant="body2" fontWeight="medium">
                        You won this auction!
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap sx={{ fontWeight: 600 }}>
                    {bid.name}
                  </Typography>
                  
                  {bid.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        height: '2.5em'
                      }}
                    >
                      {bid.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* Price information section */}
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        <LocalOfferIcon sx={{ fontSize: '0.9rem', mr: 0.5, verticalAlign: 'text-bottom' }} />
                        Your Bid:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {bid.currentBid} ETH
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        <GavelIcon sx={{ fontSize: '0.9rem', mr: 0.5, verticalAlign: 'text-bottom' }} />
                        Status:
                      </Typography>
                      <Typography variant="body2">
                        {bid.userIsHighestBidder ? (
                          bid.hasEnded ? "Winner" : "Highest Bidder"
                        ) : (
                          "Outbid"
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 1, fontSize: '0.9rem', color: bid.hasEnded ? 'text.secondary' : 'success.main' }} />
                    <Typography variant="body2" color={bid.hasEnded ? 'text.secondary' : 'success.main'}>
                      {bid.hasEnded 
                        ? `Ended ${new Date(bid.endTime).toLocaleDateString()}`
                        : `Ends ${new Date(bid.endTime).toLocaleDateString()}`
                      }
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyBids;
