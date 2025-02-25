import React, { useState, useEffect, useContext } from 'react';
import Web3 from 'web3';
import { Button, Typography, Container, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const ConnectWallet = () => {
  const [web3, setWeb3] = useState(null);
  const [error, setError] = useState('');
  const { setAccount, account } = useContext(AccountContext);
  const navigate = useNavigate();
  const location = useLocation();

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
    } else {
      setError('MetaMask is not installed. Please install it to use this app.');
    }

    if (account) {
      // Redirect to home page or previous page
      const returnPath = location.state?.returnPath || '/';
      navigate(returnPath, { replace: true });
    }
  }, [account, navigate, location.state]);

  const connectWallet = async () => {
    if (web3) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        navigate('/');
      } catch (err) {
        setError('Failed to connect to MetaMask.');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Typography
            variant="h4"
            sx={{
              marginBottom: '24px',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2081e2, #0066ff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            NFT Auction
          </Typography>

          {error ? (
            <>
              <Typography
                variant="h6"
                color="error"
                sx={{ marginBottom: '20px' }}
              >
                {error}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                href="https://metamask.io/download.html"
                target="_blank"
                sx={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1.1rem'
                }}
              >
                Install MetaMask
              </Button>
            </>
          ) : (
            <>
              <Typography
                variant="h6"
                sx={{
                  marginBottom: '24px',
                  color: '#666',
                  fontWeight: 400
                }}
              >
                Connect your wallet to get started
              </Typography>
              <Button
                variant="contained"
                onClick={connectWallet}
                startIcon={<AccountBalanceWalletIcon />}
                sx={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  background: '#2081e2',
                  '&:hover': {
                    background: '#1868b7',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(32, 129, 226, 0.3)',
                  }
                }}
              >
                Connect MetaMask
              </Button>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ConnectWallet;