import React, { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Divider,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AccountContext } from '../context/AccountContext';
import { truncateAddress } from '../utils/addressUtils';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GavelIcon from '@mui/icons-material/Gavel';
import VerifiedIcon from '@mui/icons-material/Verified';

const navLinks = [
  { name: 'Auctions', path: '/auctions' },
  { name: 'My Auctions', path: '/my-auctions', auth: true },
  { name: 'My NFTs', path: '/my-nfts', auth: true },
  { name: 'My Bids', path: '/my-bids', auth: true },
  { name: 'Create Auction', path: '/create-auction', auth: true }
];

// Admin/Verifier nav links that are only shown to users with proper permissions
const adminLinks = [
  { name: 'Manage Verifiers', path: '/verifier-management', admin: true },
  { name: 'Verification Queue', path: '/verification-queue', verifier: true }
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
  '& .address-text': {
    fontFamily: 'monospace',
    fontWeight: 600,
  }
}));

const Header = () => {
  const navigate = useNavigate();
  const { account, isConnected, isAdmin, isVerifier, disconnectWallet} = useContext(AccountContext);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElVerification, setAnchorElVerification] = useState(null);
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
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenVerificationMenu = (event) => {
    setAnchorElVerification(event.currentTarget);
  };

  const handleCloseVerificationMenu = () => {
    setAnchorElVerification(null);
  };

  const navigateTo = (path) => {
    navigate(path);
    handleCloseNavMenu();
    handleCloseUserMenu();
    handleCloseVerificationMenu();
  };

  return (
    <StyledAppBar position="fixed">
      <Toolbar sx={{ padding: '12px 24px' }}>
        <LogoText variant="h6" style={{ flexGrow: 1 }} component={RouterLink} to="/">
          Đấu Giá NFT
        </LogoText>
        
        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
          <StyledButton color="inherit" onClick={() => navigateTo('/')}>
            Trang Chủ
          </StyledButton>
          <StyledButton color="inherit" onClick={() => navigateTo('/auctions')}>
            Khám Phá
          </StyledButton>
          
          {isConnected && (
            <>
              <StyledButton color="inherit" onClick={() => navigateTo('/create-auction')}>
                Tạo Đấu Giá
              </StyledButton>
              <StyledButton color="inherit" onClick={() => navigateTo('/refund-history')}>
                Lịch sử hoàn tiền
              </StyledButton>
            </>
          )}

          {/* Verification Button for Admins/Verifiers */}
          {isConnected && (isAdmin || isVerifier) && (
            <Tooltip title="Quản lý xác thực">
              <IconButton 
                color="black" 
                onClick={handleOpenVerificationMenu}
                sx={{ mr: 1 }}
              >
                <Badge color="secondary">
                  <VerifiedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          {/* Wallet Button or Connect Button */}
          {isConnected ? (
            <WalletButton
              onClick={handleOpenUserMenu}
              startIcon={<AccountBalanceWalletIcon />}
            >
              <span className="address-text">{truncateAddress(account)}</span>
            </WalletButton>
          ) : (
            <ConnectButton
              startIcon={<AccountBalanceWalletIcon />}
              onClick={() => navigateTo('/connect-wallet')}
            >
              Kết Nối Ví
            </ConnectButton>
          )}

          {/* User Menu */}
          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
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
              onClick={() => navigateTo('/my-auctions')}
              sx={{ py: 1.5 }}
            >
              Đấu Giá Của Tôi
            </MenuItem>
            <MenuItem 
              onClick={() => navigateTo('/my-bids')}
              sx={{ py: 1.5 }}
            >
              Lượt Đấu Giá Của Tôi  
            </MenuItem>
            <MenuItem 
              onClick={() => navigateTo('/my-nfts')}
              sx={{ py: 1.5 }}
            >
              NFT Của Tôi  
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
              Ngắt Kết Nối Ví
            </MenuItem>
          </Menu>

          {/* Verification Menu */}
          <Menu
            anchorEl={anchorElVerification}
            open={Boolean(anchorElVerification)}
            onClose={handleCloseVerificationMenu}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            {isAdmin && (
              <MenuItem 
                onClick={() => navigateTo('/verifier-management')}
                sx={{ py: 1.5 }}
              >
                Quản lý người xác thực
              </MenuItem>
            )}
            {isVerifier && (
              <MenuItem 
                onClick={() => navigateTo('/verification-queue')}
                sx={{ py: 1.5 }}
              >
                Duyệt yêu cầu xác thực
              </MenuItem>
            )}
          </Menu>
        </Box>

        {/* Mobile Menu Icon */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
          <IconButton
            size="large"
            color="inherit"
            aria-label="menu"
            onClick={handleOpenNavMenu}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Mobile Menu */}
        <Menu
          id="menu-appbar-mobile"
          anchorEl={anchorElNav}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElNav)}
          onClose={handleCloseNavMenu}
          sx={{
            display: { xs: 'block', md: 'none' },
          }}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              minWidth: '200px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <MenuItem onClick={() => navigateTo('/')}>
            <Typography textAlign="center">Trang Chủ</Typography>
          </MenuItem>
          <MenuItem onClick={() => navigateTo('/auctions')}>
            <Typography textAlign="center">Khám Phá</Typography>
          </MenuItem>
          {isConnected && (
            <>
              <MenuItem onClick={() => navigateTo('/create-auction')}>
                <Typography textAlign="center">Tạo Đấu Giá</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigateTo('/my-auctions')}>
                <Typography textAlign="center">Đấu Giá Của Tôi</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigateTo('/my-bids')}>
                <Typography textAlign="center">Lượt Đấu Giá Của Tôi</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigateTo('/refund-history')}>
                <Typography textAlign="center">Lịch sử hoàn tiền</Typography>
              </MenuItem>
              {(isAdmin || isVerifier) && <Divider />}
              {isAdmin && (
                <MenuItem onClick={() => navigateTo('/verifier-management')}>
                  <Typography textAlign="center">Quản lý người xác thực</Typography>
                </MenuItem>
              )}
              {isVerifier && (
                <MenuItem onClick={() => navigateTo('/verification-queue')}>
                  <Typography textAlign="center">Duyệt yêu cầu xác thực</Typography>
                </MenuItem>
              )}
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
                <Typography textAlign="center" color="inherit">Ngắt Kết Nối Ví</Typography>
              </MenuItem>
            </>
          )}
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );

};

export default Header;