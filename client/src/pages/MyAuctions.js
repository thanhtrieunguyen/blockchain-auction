import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Divider,
  CircularProgress, 
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';
import { initWeb3, getContracts } from '../web3';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import GavelIcon from '@mui/icons-material/Gavel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { format } from 'date-fns';

function MyAuctions() {
  const { account } = useContext(AccountContext);
  const navigate = useNavigate();
  const timerRefs = useRef({});
  
  const [loading, setLoading] = useState(true);
  const [myAuctions, setMyAuctions] = useState([]);
  const [error, setError] = useState('');
  const [countdowns, setCountdowns] = useState({});
  
  useEffect(() => {
    if (account) {
      fetchMyAuctions();
    }
    
    return () => {
      // Clear any running timers when component unmounts
      Object.values(timerRefs.current).forEach(timer => {
        if (timer) clearInterval(timer);
      });
    };
  }, [account]);
  
  // Format time remaining
  const formatTimeRemaining = (timeInMs) => {
    if (timeInMs <= 0) return "Expired";
    
    const seconds = Math.floor((timeInMs / 1000) % 60);
    const minutes = Math.floor((timeInMs / (1000 * 60)) % 60);
    const hours = Math.floor((timeInMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeInMs / (1000 * 60 * 60 * 24));
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return parts.join(' ');
  };
  
  const startCountdown = (auctionId, endTimeMs) => {
    // Clear existing timer if any
    if (timerRefs.current[auctionId]) {
      clearInterval(timerRefs.current[auctionId]);
    }
    
    // Don't start if already ended
    if (endTimeMs <= Date.now()) {
      setCountdowns(prev => ({...prev, [auctionId]: "Expired"}));
      return;
    }
    
    // Initial countdown value
    setCountdowns(prev => ({
      ...prev, 
      [auctionId]: formatTimeRemaining(endTimeMs - Date.now())
    }));
    
    // Start interval
    timerRefs.current[auctionId] = setInterval(() => {
      const remaining = endTimeMs - Date.now();
      
      if (remaining <= 0) {
        clearInterval(timerRefs.current[auctionId]);
        setCountdowns(prev => ({...prev, [auctionId]: "Expired"}));
        
        // Refresh auctions to update status
        fetchMyAuctions();
      } else {
        setCountdowns(prev => ({
          ...prev, 
          [auctionId]: formatTimeRemaining(remaining)
        }));
      }
    }, 1000);
  };
  
  const fetchMyAuctions = async () => {
    if (!account) return;
    
    setLoading(true);
    setError('');
    
    try {
      const web3 = await initWeb3();
      const { nftAuction, nftMinting } = await getContracts(web3);
      
      // Get auction counter
      const auctionCounter = await nftAuction.methods.auctionCounter().call();
      
      let userAuctions = [];
      
      // Fetch all auctions
      for (let i = 1; i <= auctionCounter; i++) {
        try {
          const auction = await nftAuction.methods.auctions(i).call();
          
          // Check if user is the auction creator
          if (auction.creator.toLowerCase() === account.toLowerCase()) {
            // Get NFT metadata
            let metadata = { name: `NFT #${auction.tokenId}`, image: '' };
            
            try {
              const tokenURI = await nftMinting.methods.tokenURI(auction.tokenId).call();
              if (tokenURI.startsWith('http')) {
                const response = await fetch(tokenURI);
                const data = await response.json();
                if (data) {
                  metadata = data;
                }
              }
            } catch (err) {
              console.warn("Could not fetch NFT metadata", err);
            }
            
            // Calculate auction status
            const endTimeMs = parseInt(auction.endTime) * 1000;
            const now = Date.now();
            const hasEnded = auction.ended || now > endTimeMs;
            const hasBids = auction.highestBidder !== '0x0000000000000000000000000000000000000000';
            
            // Add to user auctions
            userAuctions.push({
              id: i,
              tokenId: auction.tokenId,
              startPrice: web3.utils.fromWei(auction.startPrice, 'ether'),
              highestBid: web3.utils.fromWei(auction.highestBid, 'ether'),
              endTime: endTimeMs,
              endTimeFormatted: format(new Date(endTimeMs), 'MMM dd, yyyy HH:mm'),
              creator: auction.creator,
              highestBidder: auction.highestBidder,
              ended: hasEnded,
              hasBids: hasBids,
              name: metadata.name || `NFT #${auction.tokenId}`,
              description: metadata.description || '',
              image: metadata.image || "https://i.seadn.io/s/raw/files/e7718d18d665f88ca4630cdb63aef37a.png?auto=format&dpr=1&h=500"
            });
            
            // Start countdown for active auctions
            if (!hasEnded) {
              startCountdown(i, endTimeMs);
            }
          }
        } catch (err) {
          console.error(`Error fetching auction #${i}:`, err);
        }
      }
      
      // Sort by active auctions first, then by end time (newest first)
      userAuctions.sort((a, b) => {
        if (a.ended !== b.ended) return a.ended ? 1 : -1;
        return b.endTime - a.endTime;
      });
      
      setMyAuctions(userAuctions);
      
    } catch (err) {
      console.error("Error fetching auctions:", err);
      setError('Could not load auctions. Please try again.');
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
      
      alert('Auction finalized successfully!');
      fetchMyAuctions();
    } catch (err) {
      console.error("Error finalizing auction:", err);
      alert(`Error finalizing auction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAuction = async (auctionId) => {
    try {
      if (!window.confirm('Are you sure you want to cancel this auction?')) {
        return;
      }
      
      setLoading(true);
      const web3 = await initWeb3();
      const { nftAuction } = await getContracts(web3);
      
      await nftAuction.methods.cancelAuction(auctionId).send({ from: account });
      
      alert('Auction cancelled successfully!');
      fetchMyAuctions();
    } catch (err) {
      console.error("Error cancelling auction:", err);
      alert(`Error cancelling auction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusChip = (auction) => {
    if (auction.ended) {
      if (auction.hasBids) {
        return <Chip 
          label="Completed" 
          color="success" 
          size="small" 
          sx={{ fontWeight: 500, borderRadius: '4px' }}
        />;
      } else {
        return <Chip 
          label="Ended (No bids)" 
          color="warning" 
          size="small" 
          sx={{ fontWeight: 500, borderRadius: '4px' }}
        />;
      }
    } else {
      if (auction.endTime < Date.now()) {
        return <Chip 
          label="Ready to finalize" 
          color="primary" 
          size="small" 
          sx={{ fontWeight: 500, borderRadius: '4px' }}
        />;
      } else {
        return <Chip 
          label="Active" 
          color="info" 
          size="small" 
          sx={{ fontWeight: 500, borderRadius: '4px' }}
        />;
      }
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="600">
          My Auctions
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchMyAuctions} 
          disabled={loading}
        >
          Refresh
        </Button>
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
      ) : myAuctions.length === 0 ? (
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
          {myAuctions.map((auction) => (
            <Grid item xs={12} md={6} lg={4} key={auction.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: 2,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={auction.image}
                    alt={auction.name}
                    sx={{ objectFit: 'cover' }}
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
                
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
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
                      <Typography variant="body2" color="text.secondary">
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
                      <Typography variant="body2" color="text.secondary">
                        Bids:
                      </Typography>
                    </Box>
                    <Typography variant="body2">
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
                    </Typography>
                  </Box>
                  
                  {/* Action buttons */}
                  <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      fullWidth
                      onClick={() => navigate(`/auctions/${auction.id}`)}
                      sx={{ 
                        borderRadius: '4px',
                        textTransform: 'none'
                      }}
                    >
                      View Details
                    </Button>
                    
                    {!auction.ended && auction.endTime < Date.now() && (
                      <Button 
                        variant="contained" 
                        color="primary"
                        size="small"
                        fullWidth
                        onClick={() => handleFinalizeAuction(auction.id)}
                        sx={{ 
                          borderRadius: '4px',
                          textTransform: 'none'
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
                          borderRadius: '4px',
                          textTransform: 'none'
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Button 
          variant="contained"
          onClick={() => navigate('/create-auction')}
          sx={{ 
            px: 4,
            py: 1,
            borderRadius: '4px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Create New Auction
        </Button>
      </Box>
    </Container>
  );
}

export default MyAuctions;