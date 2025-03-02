import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import NFTHeader from "../components/NFTHeader";
import "../css/NFTDetail.css";
import Overview from "../components/Overview";

const NFTDetail = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className="p-6">
      <NFTHeader />
      <Box className="tabs-container">
        <Tabs value={value} onChange={handleChange} centered>
          <Tab label="Overview" className="custom-tab" />
          <Tab label="Items" className="custom-tab" />
          <Tab label="Offers" className="custom-tab" />
          <Tab label="Analytics" className="custom-tab" />
          <Tab label="Activity" className="custom-tab" />
        </Tabs>
      </Box>

      <div className="custom-tab-panel">
        {value === 0 && <Overview />}
        {value === 1 && <div>Items list will be displayed here...</div>}
        {value === 2 && <div>Offers content here...</div>}
        {value === 3 && <div>Analytics data here...</div>}
        {value === 4 && <div>Activity logs here...</div>}
      </div>
    </div>
  );
};

export default NFTDetail;
