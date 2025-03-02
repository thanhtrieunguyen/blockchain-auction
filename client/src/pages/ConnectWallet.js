import React, { useState, useEffect, useContext } from 'react';
import Web3 from 'web3';
import { Typography, Box, Chip, Alert, Paper, Fade } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import InfoIcon from '@mui/icons-material/Info';
import "../css/ConnectList.css";

const ConnectWallet = () => {
  const [web3, setWeb3] = useState(null);
  const [error, setError] = useState('');
  const { setAccount, account } = useContext(AccountContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    document.body.classList.add('connect-wallet-page');
    return () => {
      document.body.classList.remove('connect-wallet-page');
    };
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      setIsMetaMaskInstalled(true);
    } else {
      setIsMetaMaskInstalled(false);
    }

    if (account) {
      const returnPath = location.state?.returnPath || '/';
      navigate(returnPath, { replace: true });
    }
  }, [account, navigate, location.state]);

  const connectWallet = async () => {
    if (web3) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);

        // Dùng enqueueSnackbar thay cho toast.success
        enqueueSnackbar('🦊 Wallet connected successfully!', {
          variant: 'success',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          onClose: () => navigate('/'), // Chuyển hướng sau khi snackbar đóng
        });
      } catch (err) {
        enqueueSnackbar('Could not connect to MetaMask', {
          variant: 'error',
          autoHideDuration: 3000,
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
        });
        setError('Failed to connect wallet');
      }
    } else {
      enqueueSnackbar('Please install MetaMask first!', {
        variant: 'warning',
        autoHideDuration: 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
      });
      setError('MetaMask is not installed');
    }
  };

  return (
    <>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0c0c0c 0%, #2f364a 100%)',
          padding: '20px',
        }}
      >
        <Paper
          elevation={24}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            maxWidth: '1200px',
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Left Section */}
          <Box
            sx={{
              flex: { xs: '1', md: '0 0 40%' },
              position: 'relative',
              minHeight: { xs: '300px', md: 'auto' },
              background: 'linear-gradient(45deg, #2081e2 0%, #40a9ff 100%)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: 'white',
                  zIndex: 2,
                  width: '80%',
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: 3 }}>
                  Welcome to NFT Auction
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Connect your wallet to start trading unique digital assets
                </Typography>
              </Box>
            </motion.div>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(/images/nft-art.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.2,
              }}
            />
          </Box>

          {/* Right Section */}
          <Box
            sx={{
              flex: { xs: '1', md: '0 0 60%' },
              display: 'flex',
              flexDirection: 'column',
              padding: { xs: '24px', md: '48px' },
              position: 'relative',
            }}
          >
            {error && (
              <Fade in={true}>
                <Alert severity="error" sx={{ marginBottom: '24px', borderRadius: '12px' }}>
                  {error}
                </Alert>
              </Fade>
            )}

            <Typography variant="h4" sx={{ fontWeight: 800, marginBottom: '24px' }}>
              Connect Your Wallet
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, marginBottom: '32px', flexWrap: 'wrap' }}>
              <Chip
                label="Ethereum"
                sx={{
                  backgroundColor: '#627EEA',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#4C63BB' },
                }}
              />
              <Chip
                label="Polygon"
                sx={{
                  backgroundColor: '#8247E5',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#6B3BBB' },
                }}
              />
              <Chip
                label="Binance"
                sx={{
                  backgroundColor: '#F3BA2F',
                  color: 'black',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#D4A429' },
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }} className="connect-wallet-container">
              <button className="wallet-button" onClick={isMetaMaskInstalled ? connectWallet : () => window.open('https://metamask.io/download.html', '_blank')}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="wallet-icon" />
                {isMetaMaskInstalled ? "MetaMask" : "Install MetaMask"}
              </button>

              <button className="wallet-button">
                <img src="data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjMyIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Im0yMSAxMmMwIDQuOTcwNi00LjAyOTQgOS05IDktNC45NzA1NiAwLTktNC4wMjk0LTktOSAwLTQuOTcwNTYgNC4wMjk0NC05IDktOSA0Ljk3MDYgMCA5IDQuMDI5NDQgOSA5em0tMy43NSAwYzAgMi44OTk1LTIuMzUwNSA1LjI1LTUuMjUgNS4yNXMtNS4yNS0yLjM1MDUtNS4yNS01LjI1IDIuMzUwNS01LjI1IDUuMjUtNS4yNSA1LjI1IDIuMzUwNSA1LjI1IDUuMjV6bS01LjkzNzUtMS42ODc1Yy0uNTUyMyAwLTEgLjQ0NzctMSAxdjEuMzc1YzAgLjU1MjMuNDQ3NyAxIDEgMWgxLjM3NWMuNTUyMyAwIDEtLjQ0NzcgMS0xdi0xLjM3NWMwLS41NTIzLS40NDc3LTEtMS0xeiIgZmlsbD0iIzJkNjVmOCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+" alt="Coinbase Wallet" className="wallet-icon" />
                Coinbase Wallet
              </button>

              <button className="wallet-button">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzNCAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsdGVyPSJ1cmwoI2ZpbHRlcjBfZGRfMjQ5XzIzODQpIj4KPGNpcmNsZSBjeD0iMTciIGN5PSIxNCIgcj0iMTIiIGZpbGw9IiNFM0FGQkUiLz4KPC9nPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMjQ5XzIzODQpIj4KPHBhdGggZD0iTTE0LjM3ODggNi44NTM2M0wxMi4xMjE5IDguMTU2ODNDMTIuMDU2IDguMTk1MjUgMTIuMDM0MSA4LjI3ODkyIDEyLjA3MTEgOC4zNDQ3N0wxNC41MDUgMTIuNTYwM0g5LjYzNzJDOS41NjE3NCAxMi41NjAzIDkuNSAxMi42MjIgOS41IDEyLjY5NzVWMTUuMzAzOUM5LjUgMTUuMzc5MyA5LjU2MTc0IDE1LjQ0MSA5LjYzNzIgMTUuNDQxSDE0LjUwNUwxNS4zMzY1IDE0LjAwMDdMMTYuMTY3OSAxMi41NjAzTDE2Ljk5OTMgMTEuMTE5OUwxNC41NjY4IDYuOTA0MzlDMTQuNTI4NCA2LjgzODU0IDE0LjQ0NDcgNi44MTY2IDE0LjM3ODggNi44NTM2M1oiIGZpbGw9IiMxODE4MTgiLz4KPC9nPgo8L3N2Zz4K" alt="Passkeys" className="wallet-icon" />
                Passkeys
              </button>

              <button className="wallet-button">
                <img src="https://rarible.com/public/5c9d8ae955309975d491.svg" alt="WalletConnect" className="wallet-icon" />
                Wallet Connect
              </button>

              <button className="wallet-button">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzIwMjlfMzMwKSI+CjxyZWN0IHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiIgcng9IjE4IiBmaWxsPSIjNTRGRkY1Ii8+CjwvZz4KPC9zdmc+" alt="Bitget Wallet" className="wallet-icon" />
                Install Bitget Wallet
              </button>
            </Box>

            <Box sx={{ mt: 'auto', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <InfoIcon fontSize="small" />
                New to blockchain? Learn more about wallets
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default ConnectWallet;