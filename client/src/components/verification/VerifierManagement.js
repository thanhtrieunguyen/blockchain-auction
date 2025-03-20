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
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
      if (!contracts.nftVerifier || !contracts.nftVerifier.methods) {
        console.error("NFT Verifier contract not available");
        return;
      }
      
      // Try to get all verifiers if function exists
      if (contracts.nftVerifier.methods.getAllVerifiers) {
        try {
          const result = await contracts.nftVerifier.methods.getAllVerifiers().call();
          console.log("Verifiers loaded:", result);
          setVerifiers(result || []);
        } catch (error) {
          console.error("Error calling getAllVerifiers:", error);
          // Fallback to manual checking if function fails
          const accounts = await window.web3.eth.getAccounts();
          const verifiersArray = [];
          
          for (let i = 0; i < accounts.length; i++) {
            const isVerifier = await contracts.nftVerifier.methods.verifiers(accounts[i]).call();
            if (isVerifier) {
              verifiersArray.push(accounts[i]);
            }
          }
          
          setVerifiers(verifiersArray);
        }
      } 
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
    if (!newVerifier || !window.web3.utils.isAddress(newVerifier)) {
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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin người xác thực...</Typography>
      </Box>
    );
  }

  if (!isOwner && !isAdmin) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Alert severity="warning">
          Bạn không có quyền quản lý người xác thực. Chỉ chủ sở hữu mới có quyền này.
        </Alert>
        <Typography sx={{ mt: 2 }}>
          Địa chỉ tài khoản hiện tại: {account}
        </Typography>
      </Box>
    );
  }

  // Rest of the component remains unchanged
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quản lý người xác thực NFT
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Địa chỉ người xác thực"
            placeholder="0x..."
            value={newVerifier}
            onChange={(e) => setNewVerifier(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddVerifier}
          >
            Thêm người xác thực
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Danh sách người xác thực
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {verifiers.length === 0 ? (
          <Typography>Không có người xác thực nào</Typography>
        ) : (
          <List>
            {verifiers.map((address) => (
              <ListItem key={address} divider>
                <ListItemText
                  primary={address}
                  secondary={
                    address.toLowerCase() === account.toLowerCase()
                      ? '(Bạn)'
                      : null
                  }
                />
                {address.toLowerCase() !== account.toLowerCase() && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemoveVerifier(address)}
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

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VerifierManagement;
