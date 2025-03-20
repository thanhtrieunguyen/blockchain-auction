import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Box, Typography, Button, 
  Card, CardContent, CardActionArea, CardMedia,
  IconButton, useTheme, Paper, CircularProgress, Alert, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExploreIcon from '@mui/icons-material/Explore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Import web3 functions for fetching real data
import { initWeb3, getContracts, getAllAuctions } from '../web3';

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
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
}));

const Home = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    // Fetch real auction data from blockchain
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const web3 = await initWeb3();
        if (!web3) {
          throw new Error('Failed to initialize Web3');
        }
        
        const { nftAuction, nftMinting } = await getContracts(web3);
        
        // Get all auctions from the smart contract
        const allAuctionsData = await getAllAuctions(web3, nftAuction, nftMinting);
        
        // Format the data for display and filter only active auctions
        const liveAuctions = allAuctionsData
          .filter(auction => {
            const currentTime = Date.now();
            const endTime = parseInt(auction.endTime) * 1000;
            return currentTime < endTime && !auction.ended;
          })
          .map(auction => {
            // Format price correctly
            let currentPrice = '0';
            try {
              if (auction.highestBid && auction.highestBid !== '0') {
                currentPrice = web3.utils.fromWei(auction.highestBid.toString(), 'ether');
              } else if (auction.startPrice) {
                currentPrice = web3.utils.fromWei(auction.startPrice.toString(), 'ether');
              }
            } catch (err) {
              console.warn(`Error converting price for auction ${auction.id}:`, err);
            }
            
            return {
              id: auction.id,
              title: auction.metadata?.name || `NFT #${auction.tokenId}`,
              image: auction.metadata?.image || 'https://via.placeholder.com/300?text=No+Image',
              price: `${currentPrice} ETH`
            };
          });
          
        // Take only 6 auctions at most for display
        setAuctions(liveAuctions.slice(0, 6));
        
      } catch (error) {
        console.error("Error fetching auctions:", error);
        setError("Failed to load auctions");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
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
                  Khám Phá & Đấu Giá NFT Độc Đáo
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: 4,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  Nền tảng đấu giá bộ sưu tập kỹ thuật số độc đáo với hoàn tiền đảm bảo dựa trên blockchain
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
                    Khám Phá Đấu Giá
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
                    Tạo Đấu Giá
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
              Đấu Giá Trực Tiếp
            </Typography>
            <Button
              component={Link}
              to="/auctions"
              variant="outlined"
              endIcon={<ChevronRightIcon />}
            >
              Xem Tất Cả
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
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ width: '100%', p: 2 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              ) : auctions.length === 0 ? (
                <Box sx={{ width: '100%', p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">Không tìm thấy phiên đấu giá nào</Typography>
                  <Button 
                    component={Link} 
                    to="/create-auction" 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    startIcon={<AddCircleOutlineIcon />}
                  >
                    Tạo Phiên Đấu Giá
                  </Button>
                </Box>
              ) : (
                auctions.map((auction) => (
                  <ItemCard key={auction.id}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={auction.image}
                        alt={auction.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                        }}
                      />
                      {/* Status Badge */}
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <Chip 
                          label="Live" 
                          size="small"
                          color="success"
                          sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                        />
                      </Box>
                    </Box>
                    <CardActionArea 
                      component={Link} 
                      to={`/auctions/${auction.id}`}
                      sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
                    >
                      <CardContent sx={{ p: 2, pb: 2, flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="div" sx={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {auction.title}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 1
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            <LocalOfferIcon sx={{ mr: 0.5, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                            Giá hiện tại:
                          </Typography>
                          <Typography variant="body1" color="primary.main" fontWeight="bold">
                            {auction.price}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          mt: 1,
                          color: 'success.main'
                        }}>
                          <AccessTimeIcon sx={{ mr: 0.5, fontSize: '0.9rem', verticalAlign: 'middle' }} />
                          <Typography variant="body2" fontSize="0.8rem">
                            Đang diễn ra
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </ItemCard>
                ))
              )}
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
                  Phiên Đấu Giá Hoạt Động
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard>
                <Typography variant="h3" color="primary" gutterBottom>
                  50+
                </Typography>
                <Typography variant="h6">
                  Bộ Sưu Tập NFT
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard>
                <Typography variant="h3" color="primary" gutterBottom>
                  500+
                </Typography>
                <Typography variant="h6">
                  Thành Viên Cộng Đồng
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
            Tại Sao Chọn Chúng Tôi?
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
                title: 'Giao Dịch An Toàn',
                description: 'Hoàn thành các giao dịch NFT một cách an toàn sử dụng công nghệ blockchain Ethereum'
              },
              {
                icon: <LocalOfferIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
                title: 'Đấu Giá Minh Bạch',
                description: 'Tham gia đấu giá NFT minh bạch với cập nhật theo thời gian thực và đảm bảo an toàn'
              },
              {
                icon: <ExploreIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
                title: 'Hoàn Tiền Đáng Tin Cậy',
                description: 'Hợp đồng thông minh của chúng tôi đảm bảo hoàn tiền tự động khi bị đấu giá cao hơn hoặc khi phiên đấu giá bị hủy'
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