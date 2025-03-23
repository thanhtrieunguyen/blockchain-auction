import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';
import { AccountContext } from '../../context/AccountContext';

const VerifierManagement = () => {
  const { account, contracts, isAdmin, loading: contextLoading } = useContext(AccountContext);
  const [verifiers, setVerifiers] = useState([]);
  const [newVerifier, setNewVerifier] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const initializeComponent = async () => {
      if (contracts?.nftVerifier && account) {
        try {
          setLoading(true);
          await checkOwner();
          await loadVerifiers();
        } catch (error) {
          console.error('Error initializing component:', error);
          setAlert({
            open: true,
            message: 'Lỗi khi khởi tạo: ' + (error.message || ''),
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    initializeComponent();
  }, [contracts?.nftVerifier, account]);

  const checkOwner = async () => {
    try {
      if (!contracts.nftVerifier || !contracts.nftVerifier.methods) {
        console.error("NFT Verifier contract không khả dụng");
        return false;
      }
      
      console.log("Đang kiểm tra chủ sở hữu, tài khoản:", account);
      const owner = await contracts.nftVerifier.methods.owner().call();
      console.log("Địa chỉ chủ sở hữu:", owner);
      
      // Đảm bảo so sánh không phân biệt chữ hoa/thường
      const isAccountOwner = owner.toLowerCase() === account.toLowerCase();
      console.log("Tài khoản có phải chủ sở hữu không:", isAccountOwner);
      
      setIsOwner(isAccountOwner);
      return isAccountOwner;
    } catch (error) {
      console.error('Lỗi khi kiểm tra chủ sở hữu:', error);
      console.error('Chi tiết lỗi:', error.message);
      return false;
    }
  };
  

const loadVerifiers = async () => {
  try {
    console.log("Loading verifiers...");
    if (!contracts.nftVerifier || !contracts.nftVerifier.methods) {
      console.error("NFT Verifier contract not available");
      return;
    }
    
    // Get the owner address
    const ownerAddress = await contracts.nftVerifier.methods.owner().call();
    let verifiersArray = [];
    
    // Check if owner is a verifier (they should be)
    const isOwnerVerifier = await contracts.nftVerifier.methods.verifiers(ownerAddress).call();
    if (isOwnerVerifier) {
      verifiersArray.push(ownerAddress);
    }
    
    // Check directly for newly added verifier address
    if (newVerifier && newVerifier !== ownerAddress) {
      try {
        const isNewVerifier = await contracts.nftVerifier.methods.verifiers(newVerifier).call();
        if (isNewVerifier && !verifiersArray.includes(newVerifier)) {
          verifiersArray.push(newVerifier);
        }
      } catch (error) {
        console.error("Error checking newVerifier:", error);
      }
    }
    
    // Approach 1: Check all known addresses
    // These will be the most commonly used Ethereum addresses stored in localStorage
    try {
      // If we have a accounts context or related accounts
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        // Check each account if it's a verifier
        for (const addr of accounts) {
          if (addr.toLowerCase() !== ownerAddress.toLowerCase()) {
            const isVerifier = await contracts.nftVerifier.methods.verifiers(addr).call();
            if (isVerifier && !verifiersArray.some(v => v.toLowerCase() === addr.toLowerCase())) {
              verifiersArray.push(addr);
              console.log(`Added connected account as verifier: ${addr}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking connected accounts:", error);
    }
    
    // Approach 2: Use the contract web3 context instead of window.web3
    // Extract web3 instance from the contract if available
    if (contracts.nftVerifier.web3) {
      console.log("Using contract's web3 instance");
      try {
        // Try to manually check known addresses
        const testAddresses = localStorage.getItem('verifierAddresses');
        if (testAddresses) {
          const addressList = JSON.parse(testAddresses);
          for (const addr of addressList) {
            try {
              const isVerifier = await contracts.nftVerifier.methods.verifiers(addr).call();
              if (isVerifier && !verifiersArray.some(v => v.toLowerCase() === addr.toLowerCase())) {
                verifiersArray.push(addr);
              }
            } catch (err) {
              console.error(`Error checking stored address ${addr}:`, err);
            }
          }
        }
      } catch (error) {
        console.error("Error checking stored addresses:", error);
      }
    }
    
    // Add the current account to verifiers list if it's a verifier
    if (account && !verifiersArray.some(addr => addr.toLowerCase() === account.toLowerCase())) {
      try {
        const isAccountVerifier = await contracts.nftVerifier.methods.verifiers(account).call();
        if (isAccountVerifier) {
          verifiersArray.push(account);
          console.log(`Added current account as verifier: ${account}`);
        }
      } catch (error) {
        console.error(`Error checking if ${account} is a verifier:`, error);
      }
    }
    
    // Store any new verifiers in localStorage for future reference
    try {
      localStorage.setItem('verifierAddresses', JSON.stringify(verifiersArray));
    } catch (e) {
      console.error("Error storing verifiers in localStorage:", e);
    }
    
    // Remove duplicates and normalize addresses
    verifiersArray = [...new Set(verifiersArray.map(addr => addr.toLowerCase()))];
    
    console.log("Final list of verifiers:", verifiersArray);
    setVerifiers(verifiersArray);
    
  } catch (error) {
    console.error('Error loading verifiers:', error);
    setAlert({
      open: true,
      message: 'Không thể tải danh sách người xác thực: ' + error.message,
      severity: 'error'
    });
  }
};

  const handleAddVerifier = async () => {
    // Function to validate an Ethereum address
    const isValidEthereumAddress = (address) => {
      // Use regex pattern checking
      return /^0x[0-9a-fA-F]{40}$/.test(address);
    };

    if (!newVerifier || !isValidEthereumAddress(newVerifier)) {
      setAlert({
        open: true,
        message: 'Địa chỉ không hợp lệ',
        severity: 'error'
      });
      return;
    }

    try {
      await contracts.nftVerifier.methods
        .addVerifier(newVerifier)
        .send({ from: account });
      
      // Store the new verifier address in localStorage
      try {
        const storedAddresses = localStorage.getItem('verifierAddresses');
        let addresses = storedAddresses ? JSON.parse(storedAddresses) : [];
        if (!addresses.includes(newVerifier)) {
          addresses.push(newVerifier);
          localStorage.setItem('verifierAddresses', JSON.stringify(addresses));
        }
      } catch (e) {
        console.error("Error storing in localStorage:", e);
      }
      
      // Update state and UI
      setNewVerifier('');
      loadVerifiers();
      
      setAlert({
        open: true,
        message: 'Đã thêm người xác thực thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding verifier:', error);
      setAlert({
        open: true,
        message: 'Không thể thêm người xác thực: ' + (error.message || ''),
        severity: 'error'
      });
    }
  };

  const handleRemoveVerifier = async (address) => {
    try {
      await contracts.nftVerifier.methods
        .removeVerifier(address)
        .send({ from: account });
      
      loadVerifiers();
      
      setAlert({
        open: true,
        message: 'Đã xóa người xác thực thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error removing verifier:', error);
      setAlert({
        open: true,
        message: 'Không thể xóa người xác thực: ' + (error.message || ''),
        severity: 'error'
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (contextLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          flexDirection: 'column', 
          p: 5, 
          minHeight: '50vh',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2
        }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" color="primary">
            Đang tải thông tin người xác thực...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!isOwner && !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Alert 
            severity="warning" 
            variant="filled"
            sx={{ 
              mb: 2,
              '& .MuiAlert-icon': { fontSize: '1.5rem' }
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium">
              Bạn không có quyền quản lý người xác thực. Chỉ chủ sở hữu mới có quyền này.
            </Typography>
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Paper elevation={3} sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon sx={{ fontSize: 28, mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" component="h1" fontWeight="500" color="primary.main">
              Quản lý người xác thực
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="body1" paragraph color="text.secondary">
            Thêm địa chỉ ví của người xác thực mới vào hệ thống.
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 2
          }}>
            <TextField
              label="Địa chỉ người xác thực"
              variant="outlined"
              fullWidth
              value={newVerifier}
              onChange={(e) => setNewVerifier(e.target.value)}
              placeholder="0x..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 1.5
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddVerifier}
              startIcon={<PersonAddIcon />}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 1.5,
                fontWeight: 'medium',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              Thêm người xác thực
            </Button>
          </Box>
        </Paper>

        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontWeight: 500 }}>
            Danh sách người xác thực
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {verifiers.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              <Typography>Không có người xác thực nào</Typography>
            </Alert>
          ) : (
            <List sx={{ 
              backgroundColor: '#f9f9f9', 
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              {verifiers.map((address) => (
                <ListItem 
                  key={address} 
                  divider 
                  sx={{ 
                    py: 1.5,
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontWeight: address.toLowerCase() === account.toLowerCase() ? 'bold' : 'normal',
                          color: address.toLowerCase() === account.toLowerCase() ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {address}
                      </Typography>
                    }
                    secondary={
                      address.toLowerCase() === account.toLowerCase()
                        ? <Typography variant="body2" color="primary">(Bạn)</Typography>
                        : null
                    }
                  />
                  {address.toLowerCase() !== account.toLowerCase() && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveVerifier(address)}
                        color="error"
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'rgba(211, 47, 47, 0.1)' 
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VerifierManagement;
