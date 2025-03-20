import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccountContext } from '../context/AccountContext';
import Web3 from 'web3';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const { account } = useContext(AccountContext);
    const [web3, setWeb3] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [networkId, setNetworkId] = useState(null);
    
    useEffect(() => {
        const initWeb3 = async () => {
            // Initialize Web3 with the current provider from Metamask
            if (window.ethereum) {
                try {
                    const web3Instance = new Web3(window.ethereum);
                    setWeb3(web3Instance);
                    
                    // Get connected accounts
                    const connectedAccounts = await web3Instance.eth.getAccounts();
                    setAccounts(connectedAccounts);
                    
                    // Get current network ID
                    const networkId = await web3Instance.eth.net.getId();
                    setNetworkId(networkId);
                    
                    // Setup listeners for account or network changes
                    window.ethereum.on('accountsChanged', (newAccounts) => {
                        setAccounts(newAccounts);
                    });
                    
                    window.ethereum.on('chainChanged', () => {
                        window.location.reload();
                    });
                } catch (error) {
                    console.error("Error initializing Web3:", error);
                }
            }
        };
        
        initWeb3();
        
        // If we have an account from AccountContext, make sure it's included in accounts
        if (account && !accounts.includes(account)) {
            setAccounts([account]);
        }
    }, [account]);
    
    return (
        <Web3Context.Provider value={{ web3, accounts, networkId }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => useContext(Web3Context);
