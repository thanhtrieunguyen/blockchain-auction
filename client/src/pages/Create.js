import React from "react";
import "../css/Create.css";
import { Typography, Card, CardContent, Box, IconButton } from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ImageIcon from "@mui/icons-material/Image";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";

const NFTs = [
  {
    name: "Ztx Genesis Homes",
    author: "",
    price: "",
    image_background:
      "https://opensea.io/static/images/studio/ztx-genesis-homes.jpg",
    image: "",
  },
  {
    name: "Spring And Autumn",
    author: "Krisk",
    price: "",
    image_background:
      "https://opensea.io/static/images/studio/spring-and-autumn-by-krisk.avif",
    image: "",
  },
];

const CreateNFT = () => {

  const navigate = useNavigate();



  return (
    <div className="mint-nft-container">
      {/* Phần bên trái */}
      <div className="mint-nft-left">
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h2" className="mint-nft-title">Create</Typography>
        </Box>

        {/* Card: Drop */}
        <Card 
          className="mint-nft-card disabled-card" 
          // Remove the onClick if you don't want any click action.
          onClick={() => alert("Drop feature is currently disabled")} 
          style={{ cursor: "not-allowed", opacity: 0.6 }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <GridViewIcon fontSize="large" />
              <Box>
                <Typography variant="h6" className="card-title">Drop</Typography>
                <Typography variant="body2" className="card-text">
                  A drop is the release of a new project. This usually happens on a specified date and time.
                  Items will be revealed after they have been purchased.
                </Typography>
              </Box>
              <IconButton className="arrow-icon">
                <ArrowForwardIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>

        {/* Card: Collection or item */}
        <Card 
        className="mint-nft-card"
        onClick={() => navigate("/create-nft")} 
        style={{ cursor: "pointer" }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <ImageIcon fontSize="large" />
              <Box>
                <Typography variant="h6" className="card-title">Collection or item</Typography>
                <Typography variant="body2" className="card-text">
                  Create a new NFT collection or add an NFT to an existing one. Your items will display immediately.
                  List for sale when you're ready.
                </Typography>
              </Box>
              <IconButton className="arrow-icon">
                <ArrowForwardIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="body2" className="learn-more">
          Learn more about each option.
        </Typography>
      </div>

      {/* Phần bên phải: Swiper */}
      <div className="mint-nft-right">
        <Swiper
          modules={[Pagination, Autoplay]}
          autoplay={{ delay: 3000 }}
          pagination={{ clickable: true }}
          loop={true}
          className="nft-swiper"
        >
          {NFTs.map((nft, index) => (
            <SwiperSlide key={index} className="nft-slide">
                <img src={nft.image_background} alt="NFT Background" className="nft-background" />
                <div className="nft-info">
                  {nft.name}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default CreateNFT;
