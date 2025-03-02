import React, { useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
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
import { initWeb3, getContracts } from '../web3';

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
  },
  {
    id: 4,
    title: "Crypto Punk #1234",
    description: "Rare Crypto Punk NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/e7718d18d665f88ca4630cdb63aef37a.png?auto=format&dpr=1&h=500",
    currentPrice: "2.5",
    endTime: "2h 45m",
    status: "live"
  },
  {
    id: 5,
    title: "Bored Ape #4567",
    description: "Bored Ape Yacht Club NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/b0766b15573c9c2958008cb5dc31e39d.gif?auto=format&dpr=1&w=400",
    currentPrice: "3.5",
    endTime: "1d 5h",
    status: "live"
  },
  {
    id: 6,
    title: "Meebit #7890",
    description: "Meebit NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/63f784206e6ae31d6e2b521907ee2ea9.gif?auto=format&dpr=1&w=400",
    currentPrice: "1.5",
    endTime: "Ended",
    status: "ended"
  },
  {
    id: 7,
    title: "Crypto Punk #1234",
    description: "Rare Crypto Punk NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/83b044366d327dd0a4c882c52088154d.gif?auto=format&dpr=1&w=400",
    currentPrice: "2.5",
    endTime: "2h 45m",
    status: "live"
  },
  {
    id: 8,
    title: "Bored Ape #4567",
    description: "Bored Ape Yacht Club NFT",
    imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
    currentPrice: "3.5",
    endTime: "1d 5h",
    status: "live"
  },
  {
    id: 9,
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
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const web3 = await initWeb3();
        const { nftAuction } = await getContracts(web3);
        
        const auctionCount = await nftAuction.methods.getAuctionsCount().call();
        const allAuctions = [];

        for(let i = 1; i <= auctionCount; i++) {
          const auctionData = await nftAuction.methods.auctions(i).call();
          const nftData = await nftAuction.methods.getNFTDetails(i).call();
          
          allAuctions.push({
            id: i,
            title: nftData.name,
            description: nftData.description,
            imageUrl: nftData.image,
            currentPrice: web3.utils.fromWei(auctionData.highestBid),
            endTime: new Date(auctionData.endTime * 1000).toLocaleString(),
            status: Date.now() < auctionData.endTime * 1000 ? 'live' : 'ended'
          });
        }

        setAuctions(allAuctions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching auctions:", error);
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  const filteredAuctions =
    tabIndex === 0
      ? dummyAuctions.filter((auction) => auction.status === "live")
      : dummyAuctions.filter((auction) => auction.status === "ended");

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
            <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>
          ) : (
            <AuctionList auctions={filteredAuctions} />
          )}
        </Box>
      </Container>
    </>
  );
};

export default Auctions;