import React, { useEffect, useState } from "react";
import { Container, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import "../css/Banner.css";

// Updated Banner component to work with auction data
const Banner = ({ auction }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Calculate time remaining based on auction end time
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = auction.endTime;
      const timeRemaining = Math.max(0, endTime - now);
      
      // Convert to days, hours, minutes, seconds
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      return { days, hours, minutes, seconds };
    };

    // Initial calculation
    setTimeLeft(calculateTimeRemaining());
    
    // Update countdown every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.endTime]);

  // Get the highest bidder display name (shortened address)
  const highestBidder = auction.highestBidder && 
    auction.highestBidder !== '0x0000000000000000000000000000000000000000' ? 
    `${auction.highestBidder.substring(0, 6)}...${auction.highestBidder.substring(auction.highestBidder.length - 4)}` : 
    'No bids yet';

  // Determine if there are active bids
  const hasBids = auction.highestBidder && 
    auction.highestBidder !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="banner" style={{ backgroundImage: `url(${auction.image_background})` }}>
      <div className="banner-overlay">
        <Container maxWidth="lg" className="banner-content">
          {/* NFT image */}
          <div className="image-container">
            <img src={auction.imageUrl} alt={auction.title} className="banner-image" />
          </div>

          <div className="text-container">
            <Typography variant="h3" component="h1" className="banner-title">
              {auction.title}
            </Typography>
            <Typography variant="h6" component="p" className="banner-author">
              {hasBids ? (
                <>Current Bid by <span className="author-name">{highestBidder}</span></>
              ) : (
                <>Created by <span className="author-name">{auction.creatorFormatted}</span></>
              )}
            </Typography>
            <Typography variant="body1" className="banner-price">
              {hasBids ? `Current Price: ${auction.currentPrice} ETH` : `Starting Price: ${auction.startPrice} ETH`}
            </Typography>

            <div className="countdown">
              <div className="time-box">
                {timeLeft.days} <span>days</span>
              </div>
              <div className="time-box">
                {timeLeft.hours} <span>hrs</span>
              </div>
              <div className="time-box">
                {timeLeft.minutes} <span>mins</span>
              </div>
              <div className="time-box">
                {timeLeft.seconds} <span>secs</span>
              </div>
            </div>

            <div className="btn-container">
              <Button
                variant="contained"
                className="view-drop-btn"
                component={Link}
                to={`/auctions/${auction.id}`}
              >
                Place Bid
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default Banner;
