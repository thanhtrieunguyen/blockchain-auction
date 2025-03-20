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

const Auctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
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
            description: auction.metadata?.description || 'Không có mô tả',
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
            attributes: auction.metadata?.attributes || [],
            // Add these fields for the banner
            image_background: auction.metadata?.image || 'https://via.placeholder.com/1920x400?text=No+Background',
            image: auction.metadata?.image || 'https://via.placeholder.com/300?text=No+Image'
          };
        });
        
        console.log("Formatted auctions:", formattedAuctions);
        setAuctions(formattedAuctions);
        
        // Select featured auctions for the banner (active auctions with highest bids)
        const liveAuctions = formattedAuctions.filter(auction => auction.status === "live");
        
        // Sort by current price (highest first) and take up to 5 for the banner
        const featured = liveAuctions
          .sort((a, b) => parseFloat(b.currentPrice) - parseFloat(a.currentPrice))
          .slice(0, 5);
          
        setFeaturedAuctions(featured.length > 0 ? featured : liveAuctions.slice(0, 5));
      } catch (error) {
        console.error("Error fetching auctions:", error);
        setError("Không thể tải phiên đấu giá. Vui lòng thử lại sau.");
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
        {loading ? (
          <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : featuredAuctions.length > 0 ? (
          <Swiper
            spaceBetween={30}
            centeredSlides={true}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={featuredAuctions.length > 1}
            pagination={{ clickable: true }}
            navigation={featuredAuctions.length > 1}
            modules={[Autoplay, Pagination, Navigation]}
            className="banner-slider"
            style={{ width: '100vw' }}
          >
            {featuredAuctions.map((auction) => (
              <SwiperSlide key={auction.id}>
                <Banner auction={auction} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : null}

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
            <Tab label="Đấu Giá Đang Diễn Ra" />
            <Tab label="Đấu Giá Đã Kết Thúc" />
          </Tabs>
        </Box>
      </Box>

      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
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