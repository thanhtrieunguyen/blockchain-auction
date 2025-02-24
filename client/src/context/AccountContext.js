import React, { createContext, useState, useEffect } from 'react';

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
    const [account, setAccount] = useState(() => {
        return localStorage.getItem('walletAddress') || null;
    });

    useEffect(() => {
        if (account) {
            localStorage.setItem('walletAddress', account);
        } else {
            localStorage.removeItem('walletAddress');
        }
    }, [account]);

    const disconnectWallet = () => {
        setAccount(null);
        localStorage.removeItem('walletAddress');
    };

    return (
        <AccountContext.Provider value={{ account, setAccount, disconnectWallet }}>
            {children}
        </AccountContext.Provider>
    );
};