import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auctions from './pages/Auctions';
import ConnectWallet from './pages/ConnectWallet';
import AuctionDetail from './pages/AuctionDetail';
import MyAuctions from './pages/MyAuctions';
import CreateAuction from './pages/CreateAuction';
import MyBids from './pages/MyBids';
import RefundHistory from './pages/RefundHistory';
import MyNFTs from './pages/MyNFTs'; // Import the MyNFTs page
import UnauthenticatedRoute from './components/UnauthenticatedRoute';
import { AccountProvider } from './context/AccountContext';
import { Web3Provider } from './contexts/Web3Context';
import { Snackbar, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { SnackbarProvider } from 'notistack';
import SnackbarContent from './components/SnackbarContentWrapper';
import "./css/Toast.css";
import VerifierManagement from './components/verification/VerifierManagement';
// Import the new VerificationQueue page instead of the component
import VerificationQueue from './pages/VerificationQueue';

function LayoutWithHeader() {
  const location = useLocation();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (location.state && location.state.message) {
      setSnackbarMessage(location.state.message);
      setSnackbarOpen(true);
    }
  }, [location]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/auction/:id" element={<AuctionDetail />} />
            <Route path="/my-auctions" element={<MyAuctions />} />
            <Route path="/my-nfts" element={<MyNFTs />} /> {/* Add MyNFTs route */}
            <Route path="/create-auction" element={<CreateAuction />} />
            <Route path="/my-bids" element={<MyBids />} />
            <Route path="/refund-history" element={<RefundHistory />} />
            <Route path="/verifier-management" element={<VerifierManagement />} />
            <Route path="/verification-queue" element={<VerificationQueue />} />
            <Route
              path="/connect-wallet"
              element={
                <UnauthenticatedRoute>
                  <ConnectWallet />
                </UnauthenticatedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
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
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={5000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      Components={{
        success: SnackbarContent,
        error: SnackbarContent,
        warning: SnackbarContent,
        info: SnackbarContent
      }}
    >
      <AccountProvider>
        <Web3Provider>
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
        </Web3Provider>
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
    </SnackbarProvider>
  );
}

export default App;