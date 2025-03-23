import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Paper,
  Chip,
  Divider,
  CardMedia,
  CircularProgress,
  IconButton,
  Container,
  Tooltip,
  Avatar
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import { AccountContext } from '../context/AccountContext';
import { toSafeNumber, toSafeString, normalizeTokenId, toDate } from '../utils/bigIntUtils';
import { resolveIPFSUri, resolveIPFSMetadata } from '../utils/ipfsUtils';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import List from '@mui/material/List';

const VerificationQueue = () => {
  const { account, contracts, isVerifier } = useContext(AccountContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [verificationReason, setVerificationReason] = useState({});
  const [nftDetails, setNftDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [searchTokenId, setSearchTokenId] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);

  useEffect(() => {
    if (contracts?.nftVerifier && account) {
      loadPendingRequests();
    }
  }, [contracts, account]);

  const loadPendingRequests = async () => {
      try {
        setLoading(true);
        console.log("Đang tải yêu cầu xác thực đang chờ...");
    
        // Kiểm tra xem contract có sẵn không
        if (!contracts.nftVerifier || !contracts.nftVerifier.methods) {
          console.error("Contract NFTVerifier không khả dụng");
          throw new Error("Contract NFTVerifier không khả dụng");
        }
    
        // Gọi hàm getPendingRequests
        console.log("Gọi hàm getPendingRequests...");
        const requests = await contracts.nftVerifier.methods.getPendingTokens().call();
        console.log("Yêu cầu xác thực đang chờ:", requests);
    
        // Chuyển đổi tất cả token ID sang string để tránh lỗi BigInt
        const requestsNormalized = requests.map(tokenId => normalizeTokenId(tokenId));
        setPendingRequests(requestsNormalized);
    
        // Load NFT details for each request
        const details = {};
        for (const tokenId of requestsNormalized) {
          try {
            console.log("Đang tải thông tin cho token ID:", tokenId);
            // Kiểm tra xem nftMinting có sẵn không
            if (!contracts.nftMinting || !contracts.nftMinting.methods) {
              console.warn("Contract NFTMinting không khả dụng");
              details[tokenId] = { name: `Token ID: ${tokenId}`, image: '' };
              continue;
            }
    
            // Lấy thông tin yêu cầu xác thực
            const request = await contracts.nftVerifier.methods.getVerificationRequest(tokenId).call();
            console.log("Yêu cầu xác thực cho token ID", tokenId, ":", request);
            // Lấy tokenURI - Đảm bảo sử dụng string cho tokenId
            let tokenURI;
            try {
              tokenURI = await contracts.nftMinting.methods.tokenURI(tokenId).call();
              console.log("Token URI:", tokenURI);
            } catch (uriError) {
              console.warn(`Không thể lấy tokenURI cho token ID ${tokenId}:`, uriError);
              details[tokenId] = { 
                name: `Token ID: ${tokenId}`, 
                image: '',
                requester: request.requester,
                requestTime: toDate(request.requestTime).toLocaleString()
              };
              continue;
            }
    
            if (!tokenURI) {
              console.warn("Không có tokenURI cho token ID:", tokenId);
              details[tokenId] = { 
                name: `Token ID: ${tokenId}`, 
                image: '',
                requester: request.requester,
                requestTime: toDate(request.requestTime).toLocaleString()
              };
              continue;
            }
    
            // Fetch metadata
            try {
              const response = await fetch(tokenURI);
              const metadata = await response.json();
              console.log("Metadata cho token ID", tokenId, ":", metadata);
    
              details[tokenId] = {
                ...metadata,
                requester: request.requester,
                requestTime: toDate(request.requestTime).toLocaleString()
              };
            } catch (metadataError) {
              console.error(`Lỗi khi tải metadata cho token ${tokenId}:`, metadataError);
              details[tokenId] = { 
                name: `Token ID: ${tokenId}`, 
                image: '',
                requester: request.requester,
                requestTime: toDate(request.requestTime).toLocaleString()
              };
            }
          } catch (error) {
            console.error(`Lỗi khi tải thông tin cho token ${tokenId}:`, error);
            details[tokenId] = { 
              name: `Token ID: ${tokenId}`, 
              image: '' 
            };
          }
        }
    
        setNftDetails(details);
      } catch (error) {
        console.error('Lỗi khi tải yêu cầu xác thực đang chờ:', error);
        setAlert({
          open: true,
          message: 'Không thể tải yêu cầu xác thực: ' + error.message,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }; 

  const handleVerify = async (tokenId) => {
    if (!verificationReason[tokenId]) {
      setAlert({
        open: true,
        message: 'Vui lòng nhập lý do xác thực',
        severity: 'warning'
      });
      return;
    }

    try {
      // Đảm bảo tokenId là string khi gọi contract
      const tokenIdNormalized = normalizeTokenId(tokenId);

      await contracts.nftVerifier.methods
        .verifyNFT(tokenIdNormalized, verificationReason[tokenId])
        .send({ from: account });

      loadPendingRequests();
      setAlert({
        open: true,
        message: 'Xác thực NFT thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error verifying NFT:', error);
      setAlert({
        open: true,
        message: 'Lỗi khi xác thực: ' + (error.message || ''),
        severity: 'error'
      });
    }
  };

  const handleReject = async (tokenId) => {
    if (!verificationReason[tokenId]) {
      setAlert({
        open: true,
        message: 'Vui lòng nhập lý do từ chối',
        severity: 'warning'
      });
      return;
    }

    try {
      // Đảm bảo tokenId là string khi gọi contract
      const tokenIdNormalized = normalizeTokenId(tokenId);

      await contracts.nftVerifier.methods
        .rejectNFT(tokenIdNormalized, verificationReason[tokenId])
        .send({ from: account });

      loadPendingRequests();
      setAlert({
        open: true,
        message: 'Đã từ chối NFT thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error rejecting NFT:', error);
      setAlert({
        open: true,
        message: 'Lỗi khi từ chối: ' + (error.message || ''),
        severity: 'error'
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };
  
  const openDetailModal = (tokenId) => {
    setSelectedNft(nftDetails[tokenId]);
    setDetailModalOpen(true);
  };

  const formatAddress = (address) => {
    if (!address || address === 'Unknown' || address === 'Không xác định') return 'Không xác định';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  if (!isVerifier) {
    return (
      <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="warning" variant="filled" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Bạn không phải là người xác thực được ủy quyền
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Vui lòng liên hệ với quản trị viên để được cấp quyền.
          </Typography>
        </Alert>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Địa chỉ tài khoản hiện tại: <Box component="span" sx={{ color: 'primary.main' }}>{account}</Box>
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" color="primary.main" gutterBottom>
            Yêu cầu xác thực đang chờ xử lý
          </Typography>
          
          <Box sx={{ display: 'flex', mt: { xs: 2, sm: 0 } }}>
            <Tooltip title="Làm mới danh sách">
              <IconButton onClick={loadPendingRequests} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : pendingRequests.length === 0 ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
            <Typography variant="body1">Không có yêu cầu xác thực nào đang chờ xử lý</Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {pendingRequests.map((tokenId) => (
              <Grid item xs={12} sm={6} md={4} key={tokenId}>
                <Card elevation={2} sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}>
                  <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: '#f5f5f5' }}>
                    {nftDetails[tokenId]?.image ? (
                      <CardMedia
                        component="img"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                        image={nftDetails[tokenId].image}
                        alt={nftDetails[tokenId]?.name || `Token ${toSafeString(tokenId)}`}
                        onError={(e) => {
                          // Xử lý lỗi khi hình ảnh không tải được
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;flex-direction:column;">
                              <svg style="width:64px;height:64px;color:#bdbdbd;" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z" />
                              </svg>
                              <p style="margin-top:8px;color:#757575;">Không thể tải hình ảnh</p>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}>
                        <ImageIcon sx={{ fontSize: 64, color: '#cccccc' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Không có hình ảnh
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                      fontSize: '0.75rem'
                    }}>
                      ID: {tokenId}
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 500, 
                        fontSize: '1.1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '80%'
                      }}>
                        {nftDetails[tokenId]?.name || `Token ID: ${toSafeString(tokenId)}`}
                      </Typography>
                      <Tooltip title="Xem chi tiết NFT">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => openDetailModal(tokenId)}
                          sx={{ ml: 1 }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Chip
                      icon={<PendingIcon />}
                      label="Đang chờ xác thực"
                      color="warning"
                      size="small"
                      sx={{ mb: 2, fontSize: '0.75rem' }}
                    />
                    
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: '0.8rem', 
                        mb: 0.5
                      }}>
                        <strong style={{ minWidth: '80px' }}>Người yêu cầu:</strong> 
                        <Tooltip title={nftDetails[tokenId]?.requester || 'Unknown'}>
                          <span>{formatAddress(nftDetails[tokenId]?.requester)}</span>
                        </Tooltip>
                      </Typography>
                      
                      {nftDetails[tokenId]?.owner && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          fontSize: '0.8rem', 
                          mb: 0.5
                        }}>
                          <strong style={{ minWidth: '80px' }}>Chủ sở hữu:</strong> 
                          <Tooltip title={nftDetails[tokenId]?.owner}>
                            <span>{formatAddress(nftDetails[tokenId]?.owner)}</span>
                          </Tooltip>
                        </Typography>
                      )}
                      
                      {nftDetails[tokenId]?.requestTime && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          fontSize: '0.8rem',
                          mb: 0.5
                        }}>
                          <strong style={{ minWidth: '80px' }}>Thời gian yêu cầu:</strong> 
                          <span>{toSafeString(nftDetails[tokenId].requestTime)}</span>
                        </Typography>
                      )}
                      
                      {nftDetails[tokenId]?.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mt: 1.5, 
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          <strong>Mô tả:</strong> {nftDetails[tokenId].description}
                        </Typography>
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <TextField
                      fullWidth
                      label="Lý do xác thực/từ chối"
                      multiline
                      rows={2}
                      value={verificationReason[tokenId] || ''}
                      onChange={(e) => setVerificationReason({
                        ...verificationReason,
                        [tokenId]: e.target.value
                      })}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                      placeholder="Nhập lý do xác thực hoặc từ chối NFT này..."
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<VerifiedIcon />}
                        onClick={() => handleVerify(tokenId)}
                        disabled={!verificationReason[tokenId]}
                        sx={{ borderRadius: 1.5, flex: 1, mr: 1, fontWeight: 'bold' }}
                      >
                        Xác thực
                      </Button>
                      
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReject(tokenId)}
                        disabled={!verificationReason[tokenId]}
                        sx={{ borderRadius: 1.5, flex: 1, ml: 1, fontWeight: 'bold' }}
                      >
                        Từ chối
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedNft && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedNft.name || `Token #${selectedNft.tokenId}`}</Typography>
                <Chip 
                  icon={<PendingIcon />} 
                  label="Đang chờ xác thực" 
                  color="warning" 
                  size="small" 
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    width: '100%', 
                    pt: '100%', 
                    position: 'relative',
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid #eaeaea'
                  }}>
                    {selectedNft.image ? (
                      <Box 
                        component="img"
                        src={selectedNft.image}
                        alt={selectedNft.name}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;flex-direction:column;">
                              <svg style="width:64px;height:64px;color:#bdbdbd;" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z" />
                              </svg>
                              <p style="margin-top:8px;color:#757575;">Không thể tải hình ảnh</p>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ImageIcon sx={{ fontSize: 80, color: '#cccccc' }} />
                      </Box>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <List disablePadding>
                    <ListItem divider>
                      <ListItemText 
                        primary="ID Token" 
                        secondary={selectedNft.tokenId}
                        primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    
                    <ListItem divider>
                      <ListItemText 
                        primary="Bộ sưu tập" 
                        secondary={selectedNft.collection || 'Không có thông tin'}
                        primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    
                    <ListItem divider>
                      <ListItemText 
                        primary="Chủ sở hữu" 
                        secondary={selectedNft.owner ? formatAddress(selectedNft.owner) : 'Không xác định'}
                        primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    
                    <ListItem divider>
                      <ListItemText 
                        primary="Người yêu cầu xác thực" 
                        secondary={selectedNft.requester ? formatAddress(selectedNft.requester) : 'Không xác định'}
                        primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    
                    <ListItem divider>
                      <ListItemText 
                        primary="Thời gian yêu cầu" 
                        secondary={selectedNft.requestTime || 'Không xác định'}
                        primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    
                    <ListItem divider>
                      <ListItemText 
                        primary="Địa chỉ hợp đồng" 
                        secondary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace', 
                              wordBreak: 'break-all',
                              fontSize: '0.75rem'
                            }}
                          >
                            {selectedNft.contractAddress || 'Không xác định'}
                          </Typography>
                        }
                        primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      />
                    </ListItem>
                  </List>
                  
                  {selectedNft.description && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Mô tả</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                        {selectedNft.description}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Thuộc tính
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        {selectedNft.attributes.map((attr, index) => (
                          <Grid item xs={6} key={index}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1,
                                bgcolor: '#f5f5f5',
                                borderRadius: 1,
                                border: '1px solid #e0e0e0',
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                {attr.trait_type || 'Thuộc tính'}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                {attr.value || '-'}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                variant="outlined" 
                onClick={() => setDetailModalOpen(false)}
              >
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VerificationQueue;
