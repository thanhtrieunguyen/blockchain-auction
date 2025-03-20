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
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import VerifiedIcon from '@mui/icons-material/Verified';
import { AccountContext } from '../context/AccountContext';
import { truncateAddress } from '../utils/addressUtils';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
}));

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Auctions', path: '/auctions' },
  { name: 'My Auctions', path: '/my-auctions', auth: true },
  { name: 'My NFTs', path: '/my-nfts', auth: true }, // Add this line
  { name: 'My Bids', path: '/my-bids', auth: true },
  { name: 'Create Auction', path: '/create-auction', auth: true }
];

// Admin/Verifier nav links that are only shown to users with proper permissions
const adminLinks = [
  { name: 'Manage Verifiers', path: '/verifier-management', admin: true },
  { name: 'Verification Queue', path: '/verification-queue', verifier: true }
];

const Header = () => {
  const navigate = useNavigate();
  const { account, isConnected, isAdmin, isVerifier } = useContext(AccountContext);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElVerification, setAnchorElVerification] = useState(null);

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
    <StyledAppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
          onClick={handleOpenNavMenu}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            mr: 2,
            fontWeight: 700,
            color: 'white',
            textDecoration: 'none',
          }}
        >
          NFT Auction
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Button
            onClick={() => navigateTo('/auctions')}
            sx={{ my: 2, color: 'white', display: 'block' }}
          >
            Phiên đấu giá
          </Button>
          {isConnected && (
            <>
              <Button
                onClick={() => navigateTo('/my-auctions')}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Đấu giá của tôi
              </Button>
              <Button
                onClick={() => navigateTo('/create-auction')}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Tạo đấu giá
              </Button>
              <Button
                onClick={() => navigateTo('/my-bids')}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Lịch sử đấu giá
              </Button>
            </>
          )}
        </Box>

        {isConnected && (isAdmin || isVerifier) && (
          <Tooltip title="Quản lý xác thực">
            <IconButton 
              color="inherit" 
              onClick={handleOpenVerificationMenu}
              sx={{ mr: 1 }}
            >
              <Badge color="secondary">
                <VerifiedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        {isConnected ? (
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Tài khoản">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="User Avatar">
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem disabled>
                <Typography textAlign="center">
                  {truncateAddress(account)}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => navigateTo('/my-auctions')}>
                <Typography textAlign="center">Đấu giá của tôi</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigateTo('/my-bids')}>
                <Typography textAlign="center">Lịch sử đấu giá</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigateTo('/create-auction')}>
                <Typography textAlign="center">Tạo đấu giá</Typography>
              </MenuItem>
            </Menu>

            {/* Verification Menu */}
            <Menu
              sx={{ mt: '45px' }}
              id="verification-menu"
              anchorEl={anchorElVerification}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElVerification)}
              onClose={handleCloseVerificationMenu}
            >
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
            </Menu>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigateTo('/connect-wallet')}
          >
            Kết nối ví
          </Button>
        )}

        {/* Mobile menu */}
        <Menu
          id="menu-appbar-mobile"
          anchorEl={anchorElNav}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={Boolean(anchorElNav)}
          onClose={handleCloseNavMenu}
          sx={{
            display: { xs: 'block', md: 'none' },
          }}
        >
          <MenuItem onClick={() => navigateTo('/auctions')}>
            <Typography textAlign="center">Phiên đấu giá</Typography>
          </MenuItem>
          {isConnected && (
            <>
              <MenuItem onClick={() => navigateTo('/my-auctions')}>
                <Typography textAlign="center">Đấu giá của tôi</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigateTo('/create-auction')}>
                <Typography textAlign="center">Tạo đấu giá</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigateTo('/my-bids')}>
                <Typography textAlign="center">Lịch sử đấu giá</Typography>
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
            </>
          )}
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;