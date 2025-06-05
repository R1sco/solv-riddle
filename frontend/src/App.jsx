import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Home from './pages/Home';
import RiddleDetail from './pages/RiddleDetail';
import CreateRiddle from './pages/CreateRiddle';
import SolveRiddle from './pages/SolveRiddle';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function AppContent() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const initializeEthers = async () => {
      // Check if MetaMask is installed
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          // Get accounts
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
              setAccount(accounts[0]);
            } else {
              // Disconnected
              setAccount('');
            }
          });
          
          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
          
        } catch (error) {
          console.error("Error initializing ethers:", error);
        }
      } else {
        alert('MetaMask not detected! Please install MetaMask to use this application.');
      }
    };

    initializeEthers();
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);
  
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected! Please install MetaMask to use this application.');
      return;
    }
    
    try {
      setIsConnecting(true);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        // Initialize provider again to ensure we have the latest state
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        setAccount(accounts[0]);
      }
      
      setIsConnecting(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert(`Error connecting wallet: ${error.message || "Unknown error"}`);
      setIsConnecting(false);
    }
  };
  
  const disconnectWallet = async () => {
    // Note: MetaMask doesn't support programmatic disconnection in the same way as connection
    // So we just clear our local state
    setAccount('');
    
    // Display feedback to the user
    alert('Wallet disconnected from the application. Note that MetaMask still maintains the connection, but the app no longer has access.');
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar 
        account={account} 
        connectWallet={connectWallet} 
        disconnectWallet={disconnectWallet} 
        isConnecting={isConnecting}
      />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Routes>
          <Route path="/" element={<Home provider={provider} account={account} />} />
          <Route path="/riddle/:address" element={<RiddleDetail provider={provider} account={account} />} />
          <Route path="/create" element={<CreateRiddle provider={provider} account={account} />} />
          <Route path="/solve/:address" element={<SolveRiddle provider={provider} account={account} />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
