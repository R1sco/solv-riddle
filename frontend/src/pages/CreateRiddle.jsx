import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import RiddleFactoryAbi from '../utils/RiddleFactory.json';

// Alamat kontrak RiddleFactory diambil dari environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
console.log("CreateRiddle.jsx - Using VITE_CONTRACT_ADDRESS from env:", import.meta.env.VITE_CONTRACT_ADDRESS); // Log untuk debugging

const CreateRiddle = ({ provider, account }) => {
  const navigate = useNavigate();
  const [riddleText, setRiddleText] = useState('');
  const [riddleSolution, setRiddleSolution] = useState('');
  const [initialReward, setInitialReward] = useState('0.01');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account || !provider) {
      setError("Silakan hubungkan wallet Anda terlebih dahulu");
      return;
    }
    
    if (!riddleText.trim() || !riddleSolution.trim() || !initialReward) {
      setError("Semua bidang harus diisi");
      return;
    }
    
    if (parseFloat(initialReward) <= 0) {
      setError("Reward harus lebih besar dari 0 ETH");
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      // Dapatkan signer dari provider
      const signer = await provider.getSigner();
      
      // Dapatkan instance kontrak
      const factoryContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        RiddleFactoryAbi.abi,
        signer
      );
      
      // Konversi reward ke wei
      const rewardInWei = ethers.parseEther(initialReward);
      
      console.log("Creating riddle with initial reward:", initialReward, "ETH");
      
      // Buat teka-teki baru dengan mengirim ETH sebagai reward awal
      const tx = await factoryContract.createRiddle(
        riddleText,
        riddleSolution,
        { value: rewardInWei }
      );
      
      // Tunggu transaksi dikonfirmasi
      await tx.wait();
      
      console.log("Riddle created successfully!");
      
      // Arahkan pengguna kembali ke halaman utama
      navigate("/");
    } catch (err) {
      console.error("Error creating riddle:", err);
      setError(`Error: ${err.message || "Gagal membuat teka-teki"}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <Link to="/" className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Riddle</h1>
        </div>
      
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="riddle-text">
              Riddle Text
            </label>
            <textarea
              id="riddle-text"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition duration-200 h-32"
              value={riddleText}
              onChange={(e) => setRiddleText(e.target.value)}
              placeholder="Enter riddle text here..."
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 mt-6" htmlFor="solution">
              Solution (case-sensitive)
            </label>
            <input
              type="text"
              id="solution"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition duration-200"
              value={riddleSolution}
              onChange={(e) => setRiddleSolution(e.target.value)}
              placeholder="Enter riddle solution here..."
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2 mt-6" htmlFor="reward">
              Initial Reward (ETH)
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">Ξ</span>
              </div>
              <input
                type="number"
                id="reward"
                step="0.001"
                min="0.001"
                className="block w-full pl-7 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition duration-200"
              value={initialReward}
              onChange={(e) => setInitialReward(e.target.value)}
              placeholder="0.01"
              required
            />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              This is the initial reward for solving the riddle. You can add more rewards later.
            </p>
          </div>
          
          {error && (
            <div className="mt-6 mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex items-center justify-between">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isCreating || !account}
            >
              {isCreating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Riddle'
              )}
            </button>
          </div>
          
          {!account && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
              Connect your wallet to create a riddle.
            </p>
          )}
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRiddle;
