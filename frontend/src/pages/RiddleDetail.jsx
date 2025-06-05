import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import RiddleFactoryAbi from '../utils/RiddleFactory.json';
import RiddleAbi from '../utils/Riddle.json';

// Alamat kontrak RiddleFactory diambil dari environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
console.log("RiddleDetail.jsx - Using VITE_CONTRACT_ADDRESS from env:", import.meta.env.VITE_CONTRACT_ADDRESS); // Log untuk debugging

const RiddleDetail = ({ provider, account }) => {
  const { address } = useParams();
  const [riddle, setRiddle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('0.01');
  const [addingReward, setAddingReward] = useState(false);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  
  // State untuk fitur 1 IP 1 percobaan
  const [hasAttempted, setHasAttempted] = useState(false);
  const [attemptsMap, setAttemptsMap] = useState({});

  useEffect(() => {
    // Load stored attempts from localStorage
    const loadStoredAttempts = () => {
      try {
        const storedAttempts = localStorage.getItem('riddleAttempts');
        if (storedAttempts) {
          const parsedAttempts = JSON.parse(storedAttempts);
          setAttemptsMap(parsedAttempts);
          
          // Check if current riddle has been attempted
          if (parsedAttempts[address]) {
            setHasAttempted(true);
          }
        }
      } catch (err) {
        console.error("Error loading stored attempts:", err);
      }
    };

    loadStoredAttempts();
  }, [address]);

  useEffect(() => {
    const fetchRiddleDetails = async () => {
      if (!provider || !address) return;
      
      try {
        // Get factory contract instance
        const factoryContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          RiddleFactoryAbi.abi,
          provider
        );
        
        // Get riddle info from factory
        const riddleInfo = await factoryContract.riddleInfo(address);
        
        // Get riddle contract instance
        const riddleContract = new ethers.Contract(
          address,
          RiddleAbi.abi,
          provider
        );
        
        // Get riddle details
        const reward = await riddleContract.reward();
        const isSolved = await riddleContract.isSolved();
        const solver = await riddleContract.solver();
        
        // Get owner of the riddle
        const owner = await riddleContract.owner();
        console.log('Riddle owner:', owner);
        console.log('Current account:', account);
        
        // Check if current user is the owner
        if (account && owner.toLowerCase() === account.toLowerCase()) {
          setIsOwner(true);
          console.log('Current user is the owner of this riddle');
        } else {
          setIsOwner(false);
          console.log('Current user is not the owner of this riddle');
        }
        
        setRiddle({
          address,
          text: riddleInfo.riddleText,
          reward,
          isSolved,
          solver: solver === "0x0000000000000000000000000000000000000000" ? null : solver,
          owner: owner
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching riddle:", err);
        setLoading(false);
      }
    };
    
    fetchRiddleDetails();
  }, [provider, address, account]);
  
  // Record attempt in localStorage to enforce 1 IP 1 try rule
  const recordAttempt = () => {
    try {
      const newAttempts = { ...attemptsMap, [address]: true };
      localStorage.setItem('riddleAttempts', JSON.stringify(newAttempts));
      setAttemptsMap(newAttempts);
      setHasAttempted(true);
    } catch (err) {
      console.error("Error recording attempt:", err);
    }
  };
  
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    // Check if user has already attempted this riddle
    if (hasAttempted) {
      setError("You've already attempted to solve this riddle. Only one attempt per riddle is allowed.");
      return;
    }
    
    if (!answer.trim()) {
      setError("Please enter an answer");
      return;
    }
    
    if (!account || !provider) {
      setError("Please connect your wallet first");
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Record attempt immediately before sending transaction
      recordAttempt();
      
      const signer = await provider.getSigner();
      const riddleContract = new ethers.Contract(
        address,
        RiddleAbi.abi,
        signer
      );
      
      const tx = await riddleContract.solve(answer);
      await tx.wait();
      
      // Reload riddle data
      const isSolved = await riddleContract.isSolved();
      const solver = await riddleContract.solver();
      
      setRiddle({
        ...riddle,
        isSolved,
        solver: solver === "0x0000000000000000000000000000000000000000" ? null : solver
      });
      
      setAnswer('');
      setSubmitting(false);
    } catch (err) {
      console.error("Error solving riddle:", err);
      
      // Still mark as attempted even if wrong answer
      setError("Error: " + (err.message || "Failed to solve the riddle. Your attempt has been recorded."));
      setSubmitting(false);
    }
  };
  
  const handleAddReward = async (e) => {
    e.preventDefault();
    
    if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
      setError("Please enter a valid reward amount");
      return;
    }
    
    if (!account || !provider) {
      setError("Please connect your wallet first");
      return;
    }
    
    setAddingReward(true);
    setError('');
    
    try {
      const signer = await provider.getSigner();
      const riddleContract = new ethers.Contract(
        address,
        RiddleAbi.abi,
        signer
      );
      
      const amountInWei = ethers.parseEther(rewardAmount.toString());
      const tx = await riddleContract.addReward({ value: amountInWei });
      await tx.wait();
      
      // Update reward amount
      const newReward = await riddleContract.reward();
      
      setRiddle({
        ...riddle,
        reward: newReward
      });
      
      setRewardAmount('0.01');
      setAddingReward(false);
    } catch (err) {
      console.error("Error adding reward:", err);
      setError("Error: " + (err.message || "Failed to add reward"));
      setAddingReward(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4">Loading riddle...</p>
      </div>
    );
  }
  
  if (!riddle) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Riddle not found</h2>
        <Link to="/" className="btn btn-primary inline-block mt-4">
          Back to Home
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <Link to="/" className="flex items-center text-primary-600 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Riddles
      </Link>
      
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Riddle</h1>
        
        <div className="p-4 bg-gray-100 rounded-lg mb-6">
          <p className="text-lg font-medium">{riddle.text}</p>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-600">Reward:</p>
            <p className="font-mono text-2xl font-bold">{ethers.formatEther(riddle.reward)} ETH</p>
          </div>
          
          {riddle.isSolved ? (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-lg">
              Solved
            </div>
          ) : (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-lg">
              Not Solved
            </div>
          )}
        </div>
        
        {riddle.isSolved && riddle.solver && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-gray-700">This riddle has been solved by:</p>
            <p className="font-mono font-medium">{riddle.solver}</p>
          </div>
        )}
        
        {!riddle.isSolved && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Solve Riddle</h2>
              
              {hasAttempted ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    You've already attempted to solve this riddle. Only one attempt per riddle is allowed.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAnswer}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Your Answer:
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter your answer"
                      disabled={submitting || !account || hasAttempted}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={submitting || !account || hasAttempted}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Answer'
                    )}
                  </button>
                  
                  {!account && (
                    <p className="text-sm text-gray-600 mt-2">
                      Connect wallet first to submit an answer.
                    </p>
                  )}
                </form>
              )}
            </div>
            
            {isOwner && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Add Reward</h2>
                
                <form onSubmit={handleAddReward}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Amount (ETH):
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      className="input w-full"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      placeholder="0.01"
                      disabled={addingReward || !account}
                      required
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-secondary w-full"
                    disabled={addingReward || !account}
                  >
                    {addingReward ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      'Add Reward'
                    )}
                  </button>
                  
                  {!account && (
                    <p className="text-sm text-gray-600 mt-2">
                      Connect wallet first to add reward.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiddleDetail;
