import React, { useState, useEffect, useContext } from 'react';
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Container, Typography, TextField, Button, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Box } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { initWeb3, getContracts } from '../web3';
import { AccountContext } from '../context/AccountContext';
import { useSnackbar } from 'notistack';
import '../css/CreateNFT.css';

const CreateNFT = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [nftName, setNftName] = useState('');
  const [supply, setSupply] = useState(1);
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [openTraitModal, setOpenTraitModal] = useState(false);
  const [traitType, setTraitType] = useState('');
  const [traitName, setTraitName] = useState('');
  const [loading, setLoading] = useState(false);
  const { account } = useContext(AccountContext);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Check if user is admin (owner of the NFTMinting contract)
    const checkAdmin = async () => {
      if (!account) return;
      
      try {
        const web3 = await initWeb3();
        const { nftMinting } = await getContracts(web3);
        const owner = await nftMinting.methods.owner().call();
        setIsAdmin(account.toLowerCase() === owner.toLowerCase());
      } catch (err) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [account]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageFile(null);
  };

  // Upload image to IPFS or mock service
  const uploadImage = async () => {
    // In a real application, you would upload to IPFS
    // For now, we'll mock this by returning a URL
    return `https://i.seadn.io/s/raw/files/e60c8a0354030238be1ebfa59a530c23.png?auto=format&dpr=1&w=384`;
  };

  // Create NFT metadata and upload to IPFS or mock service
  const createMetadata = async (imageUrl) => {
    const metadata = {
      name: nftName,
      description: description,
      image: imageUrl,
      external_url: externalLink,
    };
    
    // In a real application, you would upload this to IPFS
    // For now, we'll mock by returning the object
    return JSON.stringify(metadata);
  };

  const handleCreateNFT = async () => {
    if (!isAdmin) {
      enqueueSnackbar("Only admin can create NFTs", { variant: "error" });
      return;
    }

    if (!nftName || !description || !image) {
      enqueueSnackbar("Please fill all required fields", { variant: "error" });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload image to IPFS (mock)
      const imageUrl = await uploadImage();
      
      // 2. Create metadata and upload to IPFS (mock)
      const tokenURI = await createMetadata(imageUrl);
      
      // 3. Call smart contract to create NFT
      const web3 = await initWeb3();
      const { nftMinting } = await getContracts(web3);
      
      // Use the fixed price for now - 0.1 ETH
      const price = web3.utils.toWei("0.1", "ether");
      
      // Call the createNFT function from the smart contract
      await nftMinting.methods.createNFT(tokenURI, price)
        .send({ from: account });

      enqueueSnackbar("NFT created successfully!", { variant: "success" });
      navigate('/mint');
    } catch (error) {
      console.error("Error creating NFT:", error);
      enqueueSnackbar(
        error.message || "Failed to create NFT. Please try again.",
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5">
            Please connect your wallet to create NFTs
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3 }}
            onClick={() => navigate('/connect-wallet')}
          >
            Connect Wallet
          </Button>
        </Box>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5">
            Only admin can create NFTs
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3 }}
            onClick={() => navigate('/')}
          >
            Go Home
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="container">
      {/* Nút Quay Lại */}
      <div className="back-button" onClick={() => navigate(-1)}>
        <FiArrowLeft size={28} />
      </div>

      <Typography variant="h4" className="title">Create an NFT</Typography>
      <Typography variant="body2" className="subtitle">
        Once your item is minted, you cannot change any information.
      </Typography>

      <Grid container spacing={4} className="nft-form">
        {/* Upload Ảnh */}
        <Grid item xs={12} md={6}>
          <div className="upload-container">
            <input
              accept="image/*"
              type="file"
              id="upload"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <label htmlFor="upload" className="upload-box-col">
              {image ? (
                <div className="preview-container">
                  <img src={image} alt="Preview" className="preview-image" />
                </div>
              ) : (
                <div className="upload-placeholder">
                  <AddPhotoAlternateIcon fontSize="large" />
                  <Typography>Drag and drop media</Typography>
                  <Typography variant="caption">Max size: 50MB (JPG, PNG, GIF, SVG, MP4)</Typography>
                </div>
              )}
            </label>
            {image && (
              <button className="delete-button" onClick={handleRemoveImage}>
                <FiTrash2 className="trash-icon" />
              </button>
            )}
          </div>
        </Grid>

        {/* Form Nhập Thông Tin */}
        <Grid item xs={12} md={6}>
          <Card className="form-card">
            <CardContent>
              <TextField label="Name" fullWidth margin="normal" value={nftName} onChange={(e) => setNftName(e.target.value)} required />
              <TextField label="Supply" type="number" fullWidth margin="normal" value={supply} onChange={(e) => setSupply(e.target.value)} required />
              <TextField label="Description" fullWidth margin="normal" multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              <TextField label="External link" fullWidth margin="normal" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} />
              <Typography variant="body2" className="traits-description">
                Traits describe attributes of your item.
              </Typography>
              <Button variant="text" startIcon={<AddIcon />} onClick={() => setOpenTraitModal(true)}>Add trait</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trait Modal */}
      <Dialog open={openTraitModal} onClose={() => setOpenTraitModal(false)}>
        <DialogTitle>
          Add trait
          <IconButton style={{ position: 'absolute', right: 10, top: 10 }} onClick={() => setOpenTraitModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Type" fullWidth placeholder="Ex. Size" value={traitType} onChange={(e) => setTraitType(e.target.value)} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Name" fullWidth placeholder="Ex. Large" value={traitName} onChange={(e) => setTraitName(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" fullWidth>Add</Button>
        </DialogActions>
      </Dialog>
      <Button 
        variant="contained" 
        color="primary" 
        size="large"
        onClick={handleCreateNFT}
        disabled={loading}
        sx={{ mt: 3 }}
        className="create-button"
      >
        {loading ? <CircularProgress size={24} /> : "Create NFT"}
      </Button>
    </Container>
  );
};

export default CreateNFT;