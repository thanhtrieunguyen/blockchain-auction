import React from 'react';
import { Grid, Box, Typography, Card, CardMedia, CardContent, Chip, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person'; // Add this import for creator icon
import { formatDistanceToNow } from 'date-fns';

// Helper function to resolve IPFS URLs if needed
const resolveImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/300?text=No+Image';
  
  // If already handled by our getAllAuctions function, we don't need to change it
  if (url.startsWith('http')) return url;
  
  // Handle IPFS URIs if they somehow weren't resolved earlier
  if (url.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${url.substring(7)}`;
  }
  
  return url;
};

const AuctionList = ({ auctions }) => {
  if (!auctions || auctions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">No auctions found</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {auctions.map((auction) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={auction.id}>
          <Link to={`/auctions/${auction.id}`} style={{ textDecoration: 'none' }}>
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
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  image={resolveImageUrl(auction.imageUrl)}
                  alt={auction.title}
                  sx={{ height: 200, objectFit: 'cover' }}
                  onError={(e) => {
                    console.log("Image failed to load:", e.target.src);
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                  }}
                />
                {/* Status Badge */}
                <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                  <Chip 
                    label={auction.status === 'live' ? 'Live' : 'Ended'} 
                    size="small"
                    color={auction.status === 'live' ? 'success' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
              
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap sx={{ fontWeight: 600 }}>
                  {auction.title}
                </Typography>
                
                {auction.description && (
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
                    {auction.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Created by: {auction.creatorFormatted || 'Unknown'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Price information section */}
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <LocalOfferIcon sx={{ fontSize: '0.9rem', mr: 0.5, verticalAlign: 'text-bottom' }} />
                      Current Price:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {auction.currentPrice} ETH
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <AccountBalanceWalletIcon sx={{ fontSize: '0.9rem', mr: 0.5, verticalAlign: 'text-bottom' }} />
                      Starting Price:
                    </Typography>
                    <Typography variant="body2">
                      {auction.startPrice} ETH
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 1, fontSize: '0.9rem', color: auction.status === 'live' ? 'success.main' : 'text.secondary' }} />
                  <Typography variant="body2" color={auction.status === 'live' ? 'success.main' : 'text.secondary'}>
                    {auction.status === 'live' 
                      ? `Ends ${formatDistanceToNow(new Date(auction.endTime), { addSuffix: true })}`
                      : 'Auction ended'
                    }
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Link>
        </Grid>
      ))}
    </Grid>
  );
};

export default AuctionList;