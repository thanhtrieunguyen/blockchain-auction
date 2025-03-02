import React, { useState, useEffect, useContext } from 'react';
import { Container, Box, TextField, MenuItem, Grid } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import InputAdornment from '@mui/material/InputAdornment';
import MintNFTList from '../components/MintNFTList';
import { AccountContext } from '../context/AccountContext';
import { useSnackbar } from 'notistack';
import { initWeb3, getContracts } from '../web3';

const Mint = () => {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { account } = useContext(AccountContext);
    const { enqueueSnackbar } = useSnackbar();
    const [filteredNfts, setFilteredNfts] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        collection: 'all',
        priceRange: 'all'
    });

    // Định nghĩa các khoảng giá
    const priceRanges = [
        { value: 'all', label: 'All Prices' },
        { value: '0-0.1', label: '0 - 0.1 ETH' },
        { value: '0.1-0.2', label: '0.1 - 0.2 ETH' },
        { value: '0.2+', label: 'Above 0.2 ETH' }
    ];

    // Lấy danh sách collections từ NFTs
    const collections = [...new Set(nfts.map(nft => nft.collection))];

    useEffect(() => {
        const fetchAvailableNFTs = async () => {
            if (!account) return;
            
            try {
                const web3 = await initWeb3();
                const { nftMinting } = await getContracts(web3);
                
                // Get available NFTs for minting
                const availableNFTIds = await nftMinting.methods.getAvailableNFTs().call();
                
                const nftData = await Promise.all(
                    availableNFTIds.map(async (id) => {
                        const tokenURI = await nftMinting.methods.tokenURI(id).call();
                        const price = await nftMinting.methods.getMintPrice(id).call();
                        
                        // Parse the tokenURI - in a real app, you'd fetch from IPFS
                        // For the mock, we'll assume tokenURI is already a JSON string
                        let metadata;
                        try {
                            metadata = JSON.parse(tokenURI);
                        } catch {
                            // If parsing fails, use default data
                            metadata = {
                                name: `NFT #${id}`,
                                description: "No description available",
                                image: "https://i.seadn.io/s/raw/files/e60c8a0354030238be1ebfa59a530c23.png?auto=format&dpr=1&w=384"
                            };
                        }
                        
                        return {
                            id: id,
                            title: metadata.name,
                            description: metadata.description,
                            imageUrl: metadata.image,
                            price: web3.utils.fromWei(price, 'ether'),
                            collection: "MyNFT Collection"
                        };
                    })
                );
                
                setNfts(nftData);
                setFilteredNfts(nftData);
            } catch (error) {
                console.error("Error fetching NFTs:", error);

            } finally {
                setLoading(false);
            }
        };
        
        fetchAvailableNFTs();
    }, [account]);

    useEffect(() => {
        let results = [...nfts];

        // Filter by search
        if (filters.search) {
            results = results.filter(nft => 
                nft.title.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Filter by collection
        if (filters.collection !== 'all') {
            results = results.filter(nft => nft.collection === filters.collection);
        }

        // Filter by price range
        if (filters.priceRange !== 'all') {
            const [min, max] = filters.priceRange.split('-');
            results = results.filter(nft => {
                const price = parseFloat(nft.price);
                if (max === '+') return price > parseFloat(min);
                return price >= parseFloat(min) && price <= parseFloat(max);
            });
        }

        setFilteredNfts(results);
    }, [filters, nfts]);

    const handleMintNFT = async (nftId) => {
        if (!account) {
            enqueueSnackbar("Please connect your wallet to mint NFTs", { variant: "warning" });
            return;
        }
        
        setLoading(true);
        try {
            const web3 = await initWeb3();
            const { nftMinting } = await getContracts(web3);
            
            // Get the price of the NFT
            const price = await nftMinting.methods.getMintPrice(nftId).call();
            
            // Mint the NFT
            await nftMinting.methods.mintNFT(nftId).send({ 
                from: account, 
                value: price 
            });
            
            enqueueSnackbar("NFT minted successfully!", { variant: "success" });
            
            // Refresh the list of available NFTs
            const availableNFTIds = await nftMinting.methods.getAvailableNFTs().call();
            const updatedNfts = nfts.filter(nft => availableNFTIds.includes(nft.id));
            setNfts(updatedNfts);
            setFilteredNfts(updatedNfts);
            
        } catch (error) {
            console.error("Error minting NFT:", error);
            enqueueSnackbar(
                error.message || "Failed to mint NFT. Please try again.",
                { variant: "error" }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>

                {/* Filters Section */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search NFTs"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            select
                            fullWidth
                            label="Collection"
                            value={filters.collection}
                            onChange={(e) => setFilters({ ...filters, collection: e.target.value })}
                        >
                            <MenuItem value="all">All Collections</MenuItem>
                            {collections.map((collection) => (
                                <MenuItem key={collection} value={collection}>
                                    {collection}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            select
                            fullWidth
                            label="Price Range"
                            value={filters.priceRange}
                            onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                        >
                            {priceRanges.map((range) => (
                                <MenuItem key={range.value} value={range.value}>
                                    {range.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>

                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>
                ) : (
                    <MintNFTList 
                        nfts={filteredNfts} 
                        handleMintNFT={handleMintNFT}
                    />
                )}
            </Box>
        </Container>
    );
};

export default Mint;