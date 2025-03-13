import React, { useState, useEffect } from 'react';
import { Container, Box, CircularProgress, Alert } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Banner from "../components/Banner";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import AuctionList from '../components/AuctionList';
import "../css/Auctions.css";
import { initWeb3, getContracts, getAllAuctions } from '../web3';

const dummyAuctions = [
  {
    id: 1,
    title: "Crypto Punk #1234",
    description: "Rare Crypto Punk NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/e60c8a0354030238be1ebfa59a530c23.png?auto=format&dpr=1&w=384",
    currentPrice: "2.5",
    endTime: "2h 45m",
    status: "live"
  },
  {
    id: 2,
    title: "Bored Ape #4567",
    description: "Bored Ape Yacht Club NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
    currentPrice: "3.5",
    endTime: "1d 5h",
    status: "live"
  },
  {
    id: 3,
    title: "Meebit #7890",
    description: "Meebit NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
    currentPrice: "1.5",
    endTime: "Ended",
    status: "ended"
  }

  // Add more dummy auctions...
];

const banners = [
  {
    name: "CryptoPunk #7804",
    author: "0x1234...5678",
    price: "Starting at 10 ETH",
    image_background:
      "https://i.seadn.io/s/primary-drops/0xa09bfff67fcd0b2c3ef238e5fb36f4666c81fea0/34314199:about:media:c98543de-e2c3-4913-bddf-31d3ce42bffb.png?auto=format&dpr=1&w=1920",
    image: "https://i.seadn.io/s/raw/files/288ec0a6ad66be1bc71f03cb88e01c88.png?auto=format&dpr=1&w=256",
  },
  {
    name: "Bored Ape #1234",
    author: "0x9876...4321",
    price: "Starting at 15 ETH",
    image_background:
      "https://i.seadn.io/s/primary-drops/0xd30114cf4de14f8ee7b2b38466932bc3f6792385/34379055:about:media:b4e1514c-c411-417f-834e-6e872e36a305.jpeg?auto=format&dpr=1&w=1920",
    image: "https://i.seadn.io/s/raw/files/d1dddb1d9b43e091a56c52d9210f7609.png?auto=format&dpr=1&w=1920",
  },
];

const Auctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const web3 = await initWeb3();
        const { nftAuction, nftMinting } = await getContracts(web3);
        
        const allAuctionsData = await getAllAuctions(web3, nftAuction, nftMinting);
        
        // Format the data for display
        const formattedAuctions = allAuctionsData.map(auction => {
          const currentTime = Date.now();
          const endTime = parseInt(auction.endTime) * 1000;
          const hasEnded = currentTime > endTime || auction.ended;

          // Format ETH values correctly
          let currentPrice = '0';
          let startPrice = '0';
          
          try {
            // Function to format ETH values correctly
            const formatEthValue = (weiValue) => {
              if (!weiValue || weiValue === '0') return '0';
              
              // Convert wei to ETH without rounding small values
              const ethValue = web3.utils.fromWei(weiValue.toString(), 'ether');
              
              // Parse the value as a float
              const num = parseFloat(ethValue);
              
              // For very small values like 0.0001, we want to preserve exact representation
              // without trailing zeros
              if (num < 0.001) {
                // Convert to string and remove trailing zeros
                return num.toString();
              }
              
              // For regular values, format with appropriate decimals (no trailing zeros)
              return num.toString();
            };
            
            // Apply formatting to prices
            if (auction.highestBid && auction.highestBid !== '0') {
              currentPrice = formatEthValue(auction.highestBid);
            } else if (auction.startPrice) {
              currentPrice = formatEthValue(auction.startPrice);
            }
            
            if (auction.startPrice) {
              startPrice = formatEthValue(auction.startPrice);
              console.log(`Auction ${auction.id} start price: ${auction.startPrice} Wei -> ${startPrice} ETH`);
            }
          } catch (err) {
            console.warn(`Error converting price for auction ${auction.id}:`, err);
          }

          // Format creator address for display
          const creatorAddress = auction.creator || '';
          const formattedCreator = creatorAddress 
            ? `${creatorAddress.substring(0, 6)}...${creatorAddress.substring(creatorAddress.length - 4)}` 
            : '';

          return {
            id: auction.id,
            title: auction.metadata?.name || `NFT #${auction.tokenId}`,
            description: auction.metadata?.description || 'No description available',
            imageUrl: auction.metadata?.image || 'https://via.placeholder.com/300?text=No+Image',
            currentPrice: currentPrice,
            startPrice: startPrice,
            endTime: endTime,
            status: hasEnded ? "ended" : "live",
            highestBidder: auction.highestBidder,
            creator: auction.creator,
            creatorFormatted: formattedCreator, // Add formatted creator address
            tokenId: auction.tokenId,
            ended: auction.ended,
            // Include the raw values for debugging
            rawStartPrice: auction.startPrice?.toString() || '0',
            rawHighestBid: auction.highestBid?.toString() || '0',
            attributes: auction.metadata?.attributes || []
          };
        });
        
        console.log("Formatted auctions:", formattedAuctions);
        setAuctions(formattedAuctions);
      } catch (error) {
        console.error("Error fetching auctions:", error);
        setError("Failed to load auctions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  const filteredAuctions =
    tabIndex === 0
      ? auctions.filter((auction) => auction.status === "live")
      : auctions.filter((auction) => auction.status === "ended");

  return (
    <>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Swiper
          spaceBetween={30}
          centeredSlides={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={true}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Autoplay, Pagination, Navigation]}
          className="banner-slider"
          style={{ width: '100vw' }}
        >
          {banners.map((banner, index) => (
            <SwiperSlide key={index}>
              <Banner banner={banner} />
            </SwiperSlide>
          ))}
        </Swiper>

        <Box sx={{
          width: '100%',
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Tabs
            value={tabIndex}
            onChange={(e, newValue) => setTabIndex(newValue)}
            aria-label="Auction Status Tabs"
            className="custom-tabs"
            sx={{
              // maxWidth: '100%',
              '& .MuiTabs-flexContainer': {
              }
            }}
          >
            <Tab label="Live Auctions" />
            <Tab label="Ended Auctions" />
          </Tabs>
        </Box>
      </Box>

      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          {/* <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 4,
              textAlign: 'left'
            }}
          >
            {tabIndex === 0 ? "Live Auctions" : "Ended Auctions"}
          </Typography> */}

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <AuctionList auctions={filteredAuctions} />
          )}
        </Box>
      </Container>
    </>
  );
};

export default Auctions;