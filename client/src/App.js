import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Auction from './pages/Auctions';
import MintNFT from './pages/Mint';
import MyAuction from './pages/MyAuctions';
import ConnectWallet from './pages/ConnectWallet';
import { AccountProvider } from './context/AccountContext';

import './css/styles.css';

function LayoutWithHeader() {
  const location = useLocation();
  
  // Ẩn Header nếu đang ở trang "/connect-wallet"
  const hideHeaderRoutes = ["/connect-wallet"];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <div className="App">
      {shouldShowHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions" element={<Auction />} />
        <Route path="/mint" element={<MintNFT />} />
        <Route path="/my-auctions" element={<MyAuction />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AccountProvider>
      <Router>
        <Routes>
          <Route path="/connect-wallet" element={<ConnectWallet />} />
          <Route path="*" element={<LayoutWithHeader />} />
        </Routes>
      </Router>
    </AccountProvider>
  );
}

export default App;
