import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    Container,
    Avatar,
    Button,
    Tooltip,
    MenuItem,
    useMediaQuery,
    useTheme,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Link } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';
import { formatAddress } from '../utils';
import HomeIcon from '@mui/icons-material/Home';
import ExploreIcon from '@mui/icons-material/Explore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const pages = [
    { name: 'Home', path: '/' },
    { name: 'Auctions', path: '/auctions' },
    { name: 'Create Auction', path: '/create-auction' },
];

const userSettings = [
    { name: 'My Auctions', path: '/my-auctions' },
    { name: 'My Bids', path: '/my-bids' },
    { name: 'My NFTs', path: '/my-nfts' },
    { name: 'Profile', path: '/profile' },
];

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: '0 8px',
  padding: '8px 16px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  color: '#04111d',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.05)',
    transform: 'translateY(-2px)',
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  background: 'linear-gradient(45deg, #2081e2, #0066ff)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  fontSize: '1.8rem',
}));

const ConnectButton = styled(Button)(({ theme }) => ({
  margin: '0 8px',
  padding: '8px 24px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  background: '#2081e2',
  color: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: '#1868b7',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(32, 129, 226, 0.3)',
  },
}));

const WalletButton = styled(Button)(({ theme }) => ({
  margin: '0 8px',
  padding: '8px 16px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '0.95rem',
  fontWeight: 600,
  background: 'rgba(32, 129, 226, 0.1)',
  color: '#2081e2',
  border: '2px solid rgba(32, 129, 226, 0.1)',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': {
    background: 'rgba(32, 129, 226, 0.15)',
    border: '2px solid #2081e2',
    transform: 'translateY(-2px)',
  },
}));

const Header = () => {
  const navigate = useNavigate();
  const { account, disconnectWallet } = useContext(AccountContext);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    handleClose();
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <StyledAppBar position="fixed">
      <Toolbar sx={{ padding: '12px 24px' }}>
        <LogoText variant="h6" style={{ flexGrow: 1 }}>
          NFT Auction
        </LogoText>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <StyledButton color="inherit" component={Link} to="/">
            Home
          </StyledButton>
          <StyledButton color="inherit" component={Link} to="/auctions">
            Explore
          </StyledButton>
          <StyledButton
            color="inherit"
            component={Link}
            to="/create-auction">
            Create Auction
          </StyledButton>
          {account ? (
            <>
              <WalletButton
                onClick={handleClick}
                startIcon={<AccountBalanceWalletIcon />}
              >
                {shortenAddress(account)}
              </WalletButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: '12px',
                    minWidth: '200px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <MenuItem 
                  component={Link} 
                  to="/my-auctions"
                  onClick={handleClose}
                  sx={{ py: 1.5 }}
                >
                  My Auctions
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/my-bids"
                  onClick={handleClose}
                  sx={{ py: 1.5 }}
                >
                  My Bids  
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/my-nfts"
                  onClick={handleClose}
                  sx={{ py: 1.5 }}
                >
                  My NFTs
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={handleDisconnect}
                  sx={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#FF3B30',
                    py: 1.5,
                    '&:hover': {
                      background: 'rgba(255, 59, 48, 0.1)',
                    }
                  }}
                >
                  Disconnect Wallet
                </MenuItem>
              </Menu>
            </>
          ) : (
            <ConnectButton
              startIcon={<AccountBalanceWalletIcon />}
              onClick={() => {
                navigate('/connect-wallet');
              }}
            >
              Connect Wallet
            </ConnectButton>
          )}
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;