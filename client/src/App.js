import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auctions from './pages/Auctions';
import Mint from './pages/Mint';
import ConnectWallet from './pages/ConnectWallet';
import AuctionDetail from './pages/AuctionDetail';
import MyAuctions from './pages/MyAuctions';
import CreateAuction from './pages/CreateAuction';
import UnauthenticatedRoute from './components/UnauthenticatedRoute';
import { AccountProvider } from './context/AccountContext';
import { Snackbar, Alert } from '@mui/material';
import { useState, useEffect } from 'react';

function LayoutWithHeader() {
  const location = useLocation();
  const hideHeaderRoutes = ["/connect-wallet"];
  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {shouldShowHeader && <Header />}
      <div style={{ flex: 1, minHeight: 'calc(180vh - 64px - 400px)' }}> {/* 64px là Header height, 400px là Footer height */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/my-auctions" element={<MyAuctions />} />
          <Route path="/create-auction" element={<CreateAuction />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const location = window.location;
    if (location.state?.message) {
      setSnackbar({
        open: true,
        message: location.state.message,
        severity: 'warning'
      });
      // Clear the message from history state
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <AccountProvider>
        <Router>
          <Routes>
            <Route
              path="/connect-wallet"
              element={
                <UnauthenticatedRoute>
                  <ConnectWallet />
                </UnauthenticatedRoute>
              }
            />
            <Route path="/*" element={<LayoutWithHeader />} />
          </Routes>
        </Router>
      </AccountProvider>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;