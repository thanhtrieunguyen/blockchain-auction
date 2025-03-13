import React from 'react';
import { Container, Typography, Button, Box, Grid, Paper } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ExploreIcon from '@mui/icons-material/Explore';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useEffect, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Card, CardMedia, CardContent, CardActionArea } from '@mui/material';

const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: '80vh',
  background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.1,
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: '12px 32px',
  borderRadius: '30px',
  fontSize: '1.1rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
  }
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  borderRadius: '20px',
  textAlign: 'center',
  transition: 'all 0.3s ease',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
  }
}));

const StatsSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 0),
  background: 'linear-gradient(45deg, #f3f4f6 0%, #fff 100%)',
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  borderRadius: '15px',
  background: 'white',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const ScrollSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(4, 0),
  '.scroll-container': {
    display: 'flex',
    overflowX: 'hidden',
    scrollBehavior: 'smooth',
    gap: theme.spacing(2),
    padding: theme.spacing(2, 0),
  },
  '.scroll-button': {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    '&.left': { left: -20 },
    '&.right': { right: -20 },
  }
}));

const ItemCard = styled(Card)(({ theme }) => ({
  width: 240,
  flexShrink: 0,
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  }
}));

const Home = () => {
  const [auctions, setAuctions] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    // Giả lập dữ liệu - thay thế bằng API call thực tế
    setAuctions([
      { id: 1, title: "Crypto Punk #1", image: "https://i.seadn.io/s/primary-drops/0x2f3f30dda2ee71375a02d30d8521b1cf13281338/34285054:about:preview_media:01b1f678-f9e6-4ad9-9e51-b67c8d1c4125.png?", price: "0.5 ETH" },
      { id: 2, title: "Bored Ape #123", image: "https://i.seadn.io/s/primary-drops/0x2f3f30dda2ee71375a02d30d8521b1cf13281338/34285054:about:preview_media:01b1f678-f9e6-4ad9-9e51-b67c8d1c4125.png?", price: "2.1 ETH" },
      { id: 3, title: "Doodle #456", image: "https://i.seadn.io/s/primary-drops/0x2f3f30dda2ee71375a02d30d8521b1cf13281338/34285054:about:preview_media:01b1f678-f9e6-4ad9-9e51-b67c8d1c4125.png?", price: "1.2 ETH" },
      { id: 4, title: "Azuki #789", image: "https://i.seadn.io/s/primary-drops/0x2f3f30dda2ee71375a02d30d8521b1cf13281338/34285054:about:preview_media:01b1f678-f9e6-4ad9-9e51-b67c8d1c4125.png?", price: "3.0 ETH" },
      { id: 5, title: "Art Block #234", image: "https://i.seadn.io/s/primary-drops/0x2f3f30dda2ee71375a02d30d8521b1cf13281338/34285054:about:preview_media:01b1f678-f9e6-4ad9-9e51-b67c8d1c4125.png?", price: "0.8 ETH" },
      { id: 6, title: "NFT World #567", image: "https://i.seadn.io/s/primary-drops/0x2f3f30dda2ee71375a02d30d8521b1cf13281338/34285054:about:preview_media:01b1f678-f9e6-4ad9-9e51-b67c8d1c4125.png?", price: "1.5 ETH" },
    ]);
  }, []);

  const scroll = (containerId, direction) => {
    const container = document.getElementById(containerId);
    const scrollAmount = 300;
    if (container) {
      container.scrollLeft += direction * scrollAmount;
    }
  };

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: 'white',
                    marginBottom: 3,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  Discover & Auction Extraordinary NFTs
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: 4,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  A blockchain-based platform for auctioning unique digital collectibles with secure refunds
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <StyledButton
                    variant="contained"
                    component={Link}
                    to="/auctions"
                    startIcon={<ExploreIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                    }}
                  >
                    Explore Auctions
                  </StyledButton>
                  <StyledButton
                    variant="outlined"
                    component={Link}
                    to="/create-auction"
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        background: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    Create Auction
                  </StyledButton>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg"
                alt="Hero NFT"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  transform: 'perspective(1000px) rotateY(-15deg)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'perspective(1000px) rotateY(-5deg) translateY(-10px)',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      <Box sx={{ py: 8, background: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Live Auctions
            </Typography>
            <Button
              component={Link}
              to="/auctions"
              variant="outlined"
              endIcon={<ChevronRightIcon />}
            >
              View All
            </Button>
          </Box>

          <ScrollSection>
            <IconButton
              className="scroll-button left"
              onClick={() => scroll('auctions-container', -1)}
            >
              <ChevronLeftIcon />
            </IconButton>

            <Box id="auctions-container" className="scroll-container">
              {auctions.map((auction) => (
                <ItemCard key={auction.id}>
                  <CardActionArea component={Link} to={`/auction/${auction.id}`}>
                    <CardMedia
                      component="img"
                      height="240"
                      image={auction.image}
                      alt={auction.title}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {auction.title}
                      </Typography>
                      <Typography variant="subtitle1" color="primary" fontWeight="bold">
                        {auction.price}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </ItemCard>
              ))}
            </Box>

            <IconButton
              className="scroll-button right"
              onClick={() => scroll('auctions-container', 1)}
            >
              <ChevronRightIcon />
            </IconButton>
          </ScrollSection>
        </Container>
      </Box>

      <StatsSection>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 8 }}>
            <Grid item xs={12} md={4}>
              <StatCard>
                <Typography variant="h3" color="primary" gutterBottom>
                  100+
                </Typography>
                <Typography variant="h6">
                  Active Auctions
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard>
                <Typography variant="h3" color="primary" gutterBottom>
                  50+
                </Typography>
                <Typography variant="h6">
                  NFT Collections
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard>
                <Typography variant="h3" color="primary" gutterBottom>
                  500+
                </Typography>
                <Typography variant="h6">
                  Community Members
                </Typography>
              </StatCard>
            </Grid>
          </Grid>

          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 6,
              background: 'linear-gradient(45deg, #1a237e, #0d47a1)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Why Choose Us?
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
                title: 'Secure Transactions',
                description: 'Complete your NFT transactions securely using Ethereum blockchain technology'
              },
              {
                icon: <LocalOfferIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
                title: 'Transparent Bidding',
                description: 'Participate in transparent NFT auctions with real-time updates and secure bidding'
              },
              {
                icon: <ExploreIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
                title: 'Reliable Refunds',
                description: 'Our smart contracts ensure automatic refunds when outbid or when auctions are cancelled'
              }
            ].map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCard>
                  {feature.icon}
                  <Typography variant="h5" sx={{ fontWeight: 600, my: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography color="textSecondary">
                    {feature.description}
                  </Typography>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </StatsSection>
    </Box>
  );
};

export default Home;