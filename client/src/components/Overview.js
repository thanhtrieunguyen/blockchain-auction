import React from "react";
import "../css/Overview.css";

const Overview = ({ nftData }) => {
  // Truy cập dữ liệu NFT thông qua prop nftData
  return (
    <div className="overview-container">
      {/* Hiển thị thông tin chi tiết của NFT */}
      <div className="overview-section">
        <h3>Description</h3>
        <p>{nftData?.description || "No description available"}</p>
      </div>

      <div className="overview-section">
        <h3>Properties</h3>
        <div className="properties-grid">
          {nftData?.properties?.map((prop, index) => (
            <div className="property-item" key={index}>
              <span className="property-type">{prop.type}</span>
              <span className="property-value">{prop.value}</span>
            </div>
          )) || "No properties available"}
        </div>
      </div>

      {/* Các phần khác */}
    </div>
  );
};

export default Overview;