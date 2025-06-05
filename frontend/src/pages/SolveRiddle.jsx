import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import RiddleFactoryAbi from '../utils/RiddleFactory.json';
import RiddleAbi from '../utils/Riddle.json';

// Alamat kontrak RiddleFactory
const CONTRACT_ADDRESS = "0x9C447574116BD6a99Ed4d025331ba2a6DE5E8B61"; // Ganti dengan alamat kontrak Anda

const SolveRiddle = ({ provider, account }) => {
  const { address } = useParams();
  const [riddle, setRiddle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [attemptsMap, setAttemptsMap] = useState({});

  useEffect(() => {
    const loadStoredAttempts = () => {
      try {
        const storedAttempts = localStorage.getItem('riddleAttempts');
        if (storedAttempts) {
          const parsedAttempts = JSON.parse(storedAttempts);
          setAttemptsMap(parsedAttempts);
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
      setLoading(true);
      try {
        const factoryContract = new ethers.Contract(CONTRACT_ADDRESS, RiddleFactoryAbi.abi, provider);
        const riddleInfo = await factoryContract.riddleInfo(address);
        const riddleContract = new ethers.Contract(address, RiddleAbi.abi, provider);
        const reward = await riddleContract.reward();
        const isSolved = await riddleContract.isSolved();
        const solver = await riddleContract.solver();
        
        setRiddle({
          address,
          text: riddleInfo.riddleText,
          reward,
          isSolved,
          solver: solver === "0x0000000000000000000000000000000000000000" ? null : solver,
        });
      } catch (err) {
        console.error("Error fetching riddle:", err);
        setError("Failed to load riddle details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchRiddleDetails();
  }, [provider, address]);

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
    if (hasAttempted) {
      setError("Anda sudah mencoba menyelesaikan teka-teki ini. Hanya satu percobaan per teka-teki yang diperbolehkan.");
      return;
    }
    if (!answer.trim()) {
      setError("Harap masukkan jawaban.");
      return;
    }
    if (!account || !provider) {
      setError("Silakan hubungkan wallet Anda terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      recordAttempt(); // Record attempt before sending transaction
      const signer = await provider.getSigner();
      const riddleContract = new ethers.Contract(address, RiddleAbi.abi, signer);
      const tx = await riddleContract.solve(answer);
      await tx.wait();

      // Reload riddle data
      const updatedIsSolved = await riddleContract.isSolved();
      const updatedSolver = await riddleContract.solver();
      setRiddle(prevRiddle => ({
        ...prevRiddle,
        isSolved: updatedIsSolved,
        solver: updatedSolver === "0x0000000000000000000000000000000000000000" ? null : updatedSolver,
      }));
      setAnswer('');
    } catch (err) {
      console.error("Error solving riddle:", err);
      let userMessage = "Gagal menyelesaikan teka-teki.";
      if (err.reason) {
        userMessage += ` Penyebab: ${err.reason}.`;
      } else if (err.data && err.data.message) {
         userMessage += ` Penyebab: ${err.data.message}.`;
      } else if (err.message) {
        userMessage += ` Penyebab: ${err.message}.`;
      }
      setError(`${userMessage} Percobaan Anda telah dicatat.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading riddle details...</p>
        </div>
      </div>
    );
  }

  if (!riddle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-xl text-red-600 dark:text-red-400">Riddle not found or failed to load.</p>
        <Link to="/" className="text-primary-600 dark:text-primary-400 hover:underline mt-4 block">
          Back to riddle list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link 
          to="/" 
          className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors mb-8 group"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Back to riddle list
        </Link>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Solve the Riddle</h1>
            
            <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6 shadow-md">
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 break-words">{riddle.text}</p>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Reward:</p>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                {ethers.formatEther(riddle.reward)} ETH
              </p>
              <p className={`text-sm mt-1 font-semibold ${riddle.isSolved ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                Status: {riddle.isSolved ? 'Solved' : 'Unsolved'}
              </p>
            </div>
            
            {riddle.isSolved && riddle.solver && (
              <div className="p-4 bg-green-50 dark:bg-green-700/20 border-l-4 border-green-500 dark:border-green-400 rounded-md mb-6">
                <p className="text-green-700 dark:text-green-300 font-semibold">This riddle has been solved!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Solved by: <span className="font-mono break-all">{riddle.solver}</span>
                </p>
              </div>
            )}
            
            {!riddle.isSolved && (
              <div className="mt-8">
                {hasAttempted ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-700/20 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          You have already attempted this riddle. Only one attempt per riddle is allowed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAnswer}>
                    <div className="mb-6">
                      <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Your Answer
                      </label>
                      <input
                        type="text"
                        id="answer"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition duration-150"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Enter your answer here..."
                        disabled={submitting || !account}
                        required
                      />
                    </div>
                    
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 dark:bg-red-700/20 border-l-4 border-red-500 dark:border-red-400 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500 dark:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      className="w-full btn btn-primary disabled:opacity-50 transition duration-150"
                      disabled={submitting || !account}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : 'Submit Answer'}
                    </button>
                    
                    {!account && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                        Connect your wallet to submit an answer.
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolveRiddle;
