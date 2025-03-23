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
  Container,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageIcon from '@mui/icons-material/Image';
import { AccountContext } from '../context/AccountContext';
import { toSafeNumber, toSafeString, normalizeTokenId, toDate } from '../utils/bigIntUtils';

const VerificationQueue = () => {
  const { account, contracts, isVerifier } = useContext(AccountContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [verificationReason, setVerificationReason] = useState({});
  const [nftDetails, setNftDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [searchTokenId, setSearchTokenId] = useState('');

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
      
      // Lấy danh sách tokenId đang chờ xác minh
      let pendingTokenIds = [];
      try {
        pendingTokenIds = await contracts.nftVerifier.methods.getPendingTokens().call();
        console.log("Pending token IDs:", pendingTokenIds);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách token đang chờ:", error);
        setAlert({
          open: true,
          message: 'Không thể lấy danh sách token đang chờ xác thực: ' + error.message,
          severity: 'error'
        });
        setLoading(false);
        return;
      }

      // Chuyển đổi tất cả token ID sang string để tránh lỗi BigInt
      const normalizedIds = pendingTokenIds.map(id => id.toString());
      setPendingRequests(normalizedIds);

      // Load NFT details for each request
      const details = {};
      for (const tokenId of normalizedIds) {
        try {
          console.log("Đang tải thông tin cho token ID:", tokenId);
          // Kiểm tra xem nftMinting có sẵn không
          if (!contracts.nftMinting || !contracts.nftMinting.methods) {
            console.warn("Contract NFTMinting không khả dụng");
            details[tokenId] = { 
              name: `Token ID: ${tokenId}`, 
              image: '', 
              tokenId: tokenId,
              status: 'pending',
              isValid: false 
            };
            continue;
          }

          // Kiểm tra token có tồn tại không trước khi tiếp tục
          let tokenExists = false;
          try {
            // Cách kiểm tra nhẹ nhàng hơn: thử lấy tổng supply và kiểm tra tokenId có nhỏ hơn không
            const totalSupply = await contracts.nftMinting.methods.totalSupply().call();
            tokenExists = parseInt(tokenId) < parseInt(totalSupply);
            
            if (!tokenExists) {
              console.warn(`Token ID ${tokenId} không tồn tại hoặc vượt quá tổng số lượng`);
              details[tokenId] = { 
                name: `Token ID: ${tokenId} (Không tồn tại)`, 
                image: '', 
                tokenId: tokenId,
                status: 'pending',
                isValid: false 
              };
              continue;
            }
          } catch (existsError) {
            console.warn(`Không thể kiểm tra sự tồn tại của token ID ${tokenId}:`, existsError);
            // Tiếp tục và để các lỗi riêng lẻ xảy ra ở mỗi cuộc gọi
          }

          // Lấy thông tin yêu cầu xác thực - kiểm tra method tồn tại
          let requester = '';
          let requestTime = '';
          try {
            // Kiểm tra xem phương thức có tồn tại không
            if (typeof contracts.nftVerifier.methods.getVerificationRequest === 'function') {
              const request = await contracts.nftVerifier.methods.getVerificationRequest(tokenId).call();
              requester = request.requester;
              requestTime = toDate(request.requestTime).toLocaleString();
            } else {
              console.warn("Phương thức getVerificationRequest không tồn tại trong contract");
              
              // Thử sử dụng các phương thức thay thế
              if (typeof contracts.nftVerifier.methods.verificationRequests === 'function') {
                const request = await contracts.nftVerifier.methods.verificationRequests(tokenId).call();
                requester = request.requester;
                requestTime = toDate(request.requestTime).toLocaleString();
              } else {
                // Nếu không có phương thức nào tồn tại, sử dụng thông tin có sẵn
                requestTime = new Date().toLocaleString();
                
                // Thử lấy chủ sở hữu làm người yêu cầu
                try {
                  requester = await contracts.nftMinting.methods.ownerOf(tokenId).call();
                } catch (ownerError) {
                  console.warn(`Không thể lấy chủ sở hữu token ID ${tokenId}:`, ownerError);
                  requester = 'Không xác định';
                }
              }
            }
          } catch (requestError) {
            console.warn(`Không thể lấy thông tin yêu cầu xác thực cho token ID ${tokenId}:`, requestError);
            // Tiếp tục với giá trị mặc định
            requestTime = new Date().toLocaleString();
            requester = 'Không xác định';
          }
          
          // Lấy thông tin chủ sở hữu
          let owner = 'Không xác định';
          try {
            owner = await contracts.nftMinting.methods.ownerOf(tokenId).call();
          } catch (ownerError) {
            console.warn(`Không thể lấy chủ sở hữu cho token ID ${tokenId}:`, ownerError);
          }
          
          // Lấy thông tin bộ sưu tập
          let collectionName = 'NFT Collection';
          try {
            collectionName = await contracts.nftMinting.methods.name().call();
          } catch (nameError) {
            console.warn(`Không thể lấy tên bộ sưu tập:`, nameError);
          }
          
          // Địa chỉ hợp đồng
          const contractAddress = contracts.nftMinting._address || 'Không xác định';

          // Lấy tokenURI - Đảm bảo sử dụng string cho tokenId
          let tokenURI = '';
          let tokenMetadata = null;
          try {
            tokenURI = await contracts.nftMinting.methods.tokenURI(tokenId).call();
            console.log("Token URI:", tokenURI);
            
            // Fetch metadata
            try {
              const response = await fetch(tokenURI);
              tokenMetadata = await response.json();
              console.log("Metadata cho token ID", tokenId, ":", tokenMetadata);
            } catch (metadataError) {
              console.error(`Lỗi khi tải metadata cho token ${tokenId}:`, metadataError);
              tokenMetadata = null;
            }
          } catch (uriError) {
            console.warn(`Không thể lấy tokenURI cho token ID ${tokenId}:`, uriError);
            tokenURI = '';
            tokenMetadata = null;
          }

          // Tạo object thông tin chi tiết
          details[tokenId] = {
            name: tokenMetadata?.name || `Token ID: ${tokenId}`,
            description: tokenMetadata?.description || 'Không có mô tả',
            image: tokenMetadata?.image || '',
            requester: requester,
            requestTime: requestTime,
            owner: owner,
            collectionName: collectionName,
            contractAddress: contractAddress,
            tokenId: tokenId,
            status: 'pending',
            isValid: true
          };
        } catch (error) {
          console.error(`Lỗi khi tải thông tin cho token ${tokenId}:`, error);
          details[tokenId] = {
            name: `Token ID: ${tokenId}`,
            image: '',
            tokenId: tokenId,
            status: 'pending',
            isValid: false
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Container>
    );
  }

  if (!isVerifier) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Alert severity="warning" variant="filled" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Bạn không phải là người xác thực được ủy quyền
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Vui lòng liên hệ với quản trị viên để được cấp quyền.
            </Typography>
          </Alert>
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Địa chỉ tài khoản hiện tại: <Box component="span" sx={{ color: 'primary.main' }}>{account}</Box>
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, mb: 4 }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
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
                <Card elevation={3} sx={{ 
                  borderRadius: 2, 
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 8
                  }
                }}>
                  {nftDetails[tokenId]?.image ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={nftDetails[tokenId].image}
                      alt={nftDetails[tokenId]?.name || `Token ${toSafeString(tokenId)}`}
                      sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                      onError={(e) => {
                        // Xử lý lỗi khi hình ảnh không tải được
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.style.display = 'flex';
                        e.target.parentElement.style.alignItems = 'center';
                        e.target.parentElement.style.justifyContent = 'center';
                        e.target.parentElement.style.height = '200px';
                        e.target.parentElement.style.backgroundColor = '#f5f5f5';
                        const placeholder = document.createElement('div');
                        placeholder.style.display = 'flex';
                        placeholder.style.flexDirection = 'column';
                        placeholder.style.alignItems = 'center';
                        placeholder.style.justifyContent = 'center';
                        placeholder.innerHTML = `
                          <svg style="width:64px;height:64px;color:#bdbdbd;" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M19,19H5V5H19M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z" />
                          </svg>
                          <p style="margin-top:8px;color:#757575;">Không thể tải hình ảnh</p>
                        `;
                        e.target.parentElement.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <Box sx={{ 
                      height: 200, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      bgcolor: '#f5f5f5' 
                    }}>
                      <ImageIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Không có hình ảnh
                      </Typography>
                    </Box>
                  )}
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" noWrap>
                      {nftDetails[tokenId]?.name || `Token ID: ${toSafeString(tokenId)}`}
                    </Typography>

                    <Chip
                      icon={<PendingIcon />}
                      label="Đang chờ xác thực"
                      color="warning"
                      sx={{ mb: 2, fontWeight: 'medium' }}
                    />

                    <Box sx={{ mb: 2, bgcolor: 'background.neutral', p: 1.5, borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <Box component="span" fontWeight="medium">Token ID:</Box> {toSafeString(nftDetails[tokenId]?.tokenId || tokenId)}
                      </Typography>
                      
                      {nftDetails[tokenId]?.collectionName && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <Box component="span" fontWeight="medium">Bộ sưu tập:</Box> {nftDetails[tokenId].collectionName}
                        </Typography>
                      )}
                      
                      {nftDetails[tokenId]?.owner && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <Box component="span" fontWeight="medium">Chủ sở hữu:</Box> {
                            nftDetails[tokenId].owner.substring(0, 6) +
                            '...' +
                            nftDetails[tokenId].owner.substring(38)
                          }
                        </Typography>
                      )}
                      
                      {nftDetails[tokenId]?.requester && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <Box component="span" fontWeight="medium">Người yêu cầu:</Box> {
                            nftDetails[tokenId].requester.substring(0, 6) +
                            '...' +
                            nftDetails[tokenId].requester.substring(38)
                          }
                        </Typography>
                      )}

                      {nftDetails[tokenId]?.requestTime && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <Box component="span" fontWeight="medium">Thời gian yêu cầu:</Box> {toSafeString(nftDetails[tokenId].requestTime)}
                        </Typography>
                      )}
                      
                      {nftDetails[tokenId]?.contractAddress && (
                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" fontWeight="medium">Địa chỉ hợp đồng:</Box> {
                            nftDetails[tokenId].contractAddress.substring(0, 6) +
                            '...' +
                            nftDetails[tokenId].contractAddress.substring(38)
                          }
                        </Typography>
                      )}
                    </Box>

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
                      sx={{ mb: 3 }}
                      variant="outlined"
                    />

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<VerifiedIcon />}
                        onClick={() => handleVerify(tokenId)}
                        disabled={!verificationReason[tokenId]}
                        sx={{ 
                          flexGrow: 1, 
                          py: 1,
                          fontWeight: 'bold',
                          boxShadow: 2,
                          '&:hover': {
                            boxShadow: 4
                          }
                        }}
                      >
                        Xác thực
                      </Button>

                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReject(tokenId)}
                        disabled={!verificationReason[tokenId]}
                        sx={{ 
                          flexGrow: 1, 
                          py: 1,
                          fontWeight: 'bold',
                          boxShadow: 2,
                          '&:hover': {
                            boxShadow: 4
                          }
                        }}
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
    </Container>
  );
};

export default VerificationQueue;
