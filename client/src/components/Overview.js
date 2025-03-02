import React, { useState } from "react";
import "../css/Overview.css";

const Overview = () => {
  const [quantity, setQuantity] = useState(1);
  const maxSupply = 808;
  const minted = 587;
  const mintProgress = (minted / maxSupply) * 100;

  const handleIncrease = () => {
    if (quantity < 10) setQuantity(quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <div className="overview-container">
      {/* Hình ảnh NFT */}
      <div className="overview-left">
        <img
          src="https://i.seadn.io/s/raw/files/288ec0a6ad66be1bc71f03cb88e01c88.png?auto=format&dpr=1&w=256"
          alt="NFT Preview"
          className="nft-image"
        />
      </div>

      {/* Phần thông tin Mint */}
      <div className="overview-right">
        {/* Thanh tiến trình */}
        <div className="progress-bar">
          <span>{mintProgress.toFixed(1)}% minted</span>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${mintProgress}%` }}></div>
          </div>
          <span>{minted} / {maxSupply}</span>
        </div>

        {/* Hộp Mint */}
        <div className="mint-section">
          <h3>Public Stage</h3>
          <p className="mint-price">0.008 ETH <span className="usd-price">~$19.47</span></p>
          <div className="quantity-selector">
            <button onClick={handleDecrease}>-</button>
            <span>{quantity}</span>
            <button onClick={handleIncrease}>+</button>
          </div>
          <button className="mint-button">Mint</button>
        </div>


{/* Lich Mint */}
<div className="mint-schedule">
  <h3>Mint schedule</h3>

  <div className="schedule-item">
    <div>
      <strong>VIP</strong><br />
      February 25 at 11:00 PM GMT+7
      <div className="price">0.007 ETH</div>
    </div>
    <span className="status">Ended</span>
  </div>

  <div className="schedule-item">
    <div>
      <strong>Public Stage</strong><br />
      February 26 at 12:00 AM GMT+7
      <div className="price">0.008 ETH</div>
    </div>
  </div>
</div>

      </div>
    </div>
  );
};

export default Overview;
