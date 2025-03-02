import React, { useEffect, useState } from "react";
import { Container, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import "../css/Banner.css";

const Banner = ({ banner }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 0,
    minutes: 0,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds -= 1;
        } else if (minutes > 0) {
          minutes -= 1;
          seconds = 59;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days -= 1;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="banner" style={{ backgroundImage: `url(${banner.image_background})` }}>
      <div className="banner-overlay">
        <Container maxWidth="lg" className="banner-content">
          {/* image góc trái */}
          <div className="image-container">
            <img src={banner.image} alt="" className="banner-image" />
          </div>

          <div className="text-container">
            <Typography variant="h3" component="h1" className="banner-title">
              {banner.name}
            </Typography>
            <Typography variant="h6" component="p" className="banner-author">
              Current Bid by <span className="author-name">{banner.author}</span>
            </Typography>
            <Typography variant="body1" className="banner-price">
              Starting Price: {banner.price}
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
                to="/NFTDetail"
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
