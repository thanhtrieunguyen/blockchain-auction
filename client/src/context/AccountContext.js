import React, { createContext, useState, useEffect } from 'react';
import { initWeb3, getContracts } from '../web3';

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
    const [account, setAccount] = useState(() => {
        return localStorage.getItem('walletAddress') || null;
    });
    const [isConnected, setIsConnected] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVerifier, setIsVerifier] = useState(false);
    const [contracts, setContracts] = useState({
        nftAuction: null,
        nftMinting: null,
        nftVerifier: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Chỉ khởi tạo contracts khi có account
    useEffect(() => {
        let isMounted = true;
        
        if (account) {
            localStorage.setItem('walletAddress', account);
            setIsConnected(true);
            
            // 
            
            const loadContracts = async () => {
                try {
                  setLoading(true);
                  console.log("Đang khởi tạo Web3...");
                  const web3 = await initWeb3();
                  console.log("Web3 đã khởi tạo thành công");
                  
                  console.log("Đang tải các contract...");
                  const contractInstances = await getContracts(web3);
                  
                  // Kiểm tra xem nftVerifier có được tải không
                  if (!contractInstances.nftVerifier) {
                    throw new Error("Contract NFTVerifier không được tải");
                  }
                  
                  console.log("Địa chỉ NFTVerifier contract:", contractInstances.nftVerifier._address);
              
                  if (isMounted) {
                    setContracts({
                      nftAuction: contractInstances.nftAuction,
                      nftMinting: contractInstances.nftMinting,
                      nftVerifier: contractInstances.nftVerifier
                    });
                    
                    console.log("Tải contract thành công");
                    setLoading(false);
                  }
                } catch (error) {
                  console.error('Lỗi khởi tạo contract:', error);
                  if (isMounted) {
                    setError(error.message);
                    setLoading(false);
                  }
                }
              };
              
            
            loadContracts();
        } else {
            localStorage.removeItem('walletAddress');
            setIsConnected(false);
            setIsAdmin(false);
            setIsVerifier(false);
            setLoading(false);
        }
        
        return () => {
            isMounted = false;
        };
    }, [account]);

    // Kiểm tra quyền khi contracts đã được tải xong
    useEffect(() => {
        let isMounted = true;
        
        const checkUserRoles = async () => {
            if (!contracts.nftVerifier || !account) return;
            
            try {
                console.log("Bắt đầu kiểm tra vai trò cho account:", account);
                
                // Kiểm tra xem contract có method owner không
                if (!contracts.nftVerifier.methods.owner) {
                    console.error("Method owner không tồn tại trong contract NFTVerifier");
                    return;
                }
                
                // Gọi hàm owner() từ contract với xử lý lỗi
                try {
                    const owner = await contracts.nftVerifier.methods.owner().call();
                    console.log("Địa chỉ chủ sở hữu contract:", owner);
                    
                    // So sánh không phân biệt chữ hoa/thường
                    const isUserAdmin = owner.toLowerCase() === account.toLowerCase();
                    console.log("Kết quả kiểm tra admin:", isUserAdmin);
                    
                    if (isMounted) {
                        setIsAdmin(isUserAdmin);
                    }
                } catch (ownerError) {
                    console.error('Lỗi khi kiểm tra chủ sở hữu:', ownerError);
                }
                
                // Kiểm tra xem contract có method verifiers không
                if (!contracts.nftVerifier.methods.verifiers) {
                    console.error("Method verifiers không tồn tại trong contract NFTVerifier");
                    return;
                }
                
                // Gọi hàm verifiers() từ contract với xử lý lỗi riêng biệt
                try {
                    const isUserVerifier = await contracts.nftVerifier.methods.verifiers(account).call();
                    console.log("Kết quả kiểm tra verifier:", isUserVerifier);
                    
                    if (isMounted) {
                        setIsVerifier(isUserVerifier);
                        console.log(`Tài khoản ${account} có vai trò: Admin=${isAdmin}, Verifier=${isUserVerifier}`);
                    }
                } catch (verifierError) {
                    console.error('Lỗi khi kiểm tra vai trò verifier:', verifierError);
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra vai trò:', error);
            }
        };

        checkUserRoles();
        
        return () => {
            isMounted = false;
        };
    }, [contracts.nftVerifier, account, isAdmin]);

    useEffect(() => {
        let isMounted = true;
        
        const checkConnectedAccount = async () => {
            if (window.ethereum) {
                try {
                    // Kiểm tra xem người dùng đã disconnect chưa
                    const userDisconnected = localStorage.getItem('userDisconnected') === 'true';
                    
                    // Chỉ kiểm tra tài khoản nếu người dùng chưa disconnect
                    if (!userDisconnected) {
                        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                        if (accounts.length > 0) {
                            setAccount(accounts[0]);
                        }
                    }
                } catch (error) {
                    console.error('Error checking accounts:', error);
                }
            }
        };

        checkConnectedAccount();

        // Set up event listeners for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    setAccount(null);
                    localStorage.removeItem('walletAddress');
                    localStorage.setItem('userDisconnected', 'true');
                } else {
                    setAccount(accounts[0]);
                    localStorage.setItem('userDisconnected', 'false');
                }
            });
        }

        return () => {
            isMounted = false;
        };
    }, []);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                });
                
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    localStorage.setItem('userDisconnected', 'false');
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error connecting wallet:', error);
                return false;
            }
        } else {
            alert('Please install MetaMask to connect your wallet');
            return false;
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        localStorage.removeItem('walletAddress');
        // Đánh dấu rằng người dùng đã chủ động ngắt kết nối
        localStorage.setItem('userDisconnected', 'true');
    };

    return (
        <AccountContext.Provider value={{ 
            account, 
            isConnected,
            isAdmin,
            isVerifier,
            contracts,
            loading,
            error,
            setAccount, 
            connectWallet,
            disconnectWallet 
        }}>
            {children}
        </AccountContext.Provider>
    );
};