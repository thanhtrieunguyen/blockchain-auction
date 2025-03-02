import { useState, useEffect } from 'react';
import { getContracts, initWeb3 } from '../web3';

const useContract = () => {
  const [contracts, setContracts] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await initWeb3();
        const accounts = await web3.eth.getAccounts();
        const contractInstances = await getContracts();
        
        setAccount(accounts[0]);
        setContracts(contractInstances);
        setLoading(false);

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
        });
      } catch (error) {
        console.error('Error initializing contracts:', error);
        setLoading(false);
      }
    };

    init();
  }, []);

  return { contracts, account, loading };
};

export default useContract;