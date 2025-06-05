import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import RiddleFactoryAbi from '../utils/RiddleFactory.json';
import RiddleAbi from '../utils/Riddle.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
console.log("Using VITE_CONTRACT_ADDRESS from env:", import.meta.env.VITE_CONTRACT_ADDRESS); // Log untuk debugging

const RiddleCard = ({ riddle }) => {
  const { address, text, reward, isSolved, solver } = riddle;

  return (
    <div className="card bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <div className="p-6 flex flex-col justify-between flex-grow">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">{text}</h3>
        <div className="flex justify-between items-start mt-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Reward: <span className="font-medium text-primary-600 dark:text-primary-400">{ethers.formatEther(reward)} ETH</span>
            </p>
            {isSolved ? (
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mt-1">
                <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Solved
              </div>
            ) : (
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 mt-1">
                <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-500" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Unsolved
              </div>
            )}
          </div>
          <Link 
            to={`/solve/${address}`} 
            className="btn btn-primary hover:bg-primary-600 transition-colors duration-200"
          >
            {isSolved ? 'View' : 'Solve'}
          </Link>
        </div>
        
        {isSolved && solver && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Solved by:</span> {`${solver.substring(0, 6)}...${solver.substring(solver.length - 4)}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Home = ({ provider, account }) => {
  const [riddles, setRiddles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchRiddles = async () => {
      if (!provider) {
        console.log("Provider not available yet");
        return;
      }
      
      try {
        console.log("Using contract address:", CONTRACT_ADDRESS);
        console.log("Provider ready:", provider);
        
        // Check if we're on the correct network (Sepolia)
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name, network.chainId);
        
        // Check if we can connect to the contract
        const factoryContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          RiddleFactoryAbi.abi,
          provider
        );
        
        console.log("Contract instance created");
        
        try {
          // Dapatkan jumlah teka-teki
          const riddleCount = await factoryContract.getRiddleCount();
          console.log("Riddle count:", riddleCount.toString());
          
          // Dapatkan semua alamat teka-teki
          const riddleAddresses = await factoryContract.getAllRiddles();
          console.log("Riddle addresses:", riddleAddresses);
          
          // Dapatkan data untuk setiap teka-teki
          const riddleData = await Promise.all(
            riddleAddresses.map(async (address) => {
              console.log("Processing riddle address:", address);
              const riddleInfo = await factoryContract.riddleInfo(address);
              
              // Buat instance kontrak Riddle
              const riddleContract = new ethers.Contract(
                address,
                RiddleAbi.abi,
                provider
              );
              
              // Dapatkan data dari kontrak Riddle
              const reward = await riddleContract.reward();
              const isSolved = await riddleContract.isSolved();
              const solver = await riddleContract.solver();
              
              return {
                address,
                text: riddleInfo.riddleText,
                reward,
                isSolved,
                solver: solver === "0x0000000000000000000000000000000000000000" ? null : solver,
              };
            })
          );
          
          console.log("Riddle data loaded:", riddleData);
          setRiddles(riddleData);
          setLoading(false);
        } catch (contractError) {
          console.error("Contract interaction error:", contractError);
          setError("Error interacting with the contract. Please check console for details.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching riddles:", err);
        setError("Failed to load riddles: " + (err.message || err));
        setLoading(false);
      }
    };

    fetchRiddles();
  }, [provider]);


  
  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Available Riddles</h1>
        
        <Link to="/create" className="btn btn-primary">
          Create Riddle
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading riddles...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6">
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
      ) : riddles.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-xl font-semibold mt-4">No Riddles Found</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">Failed to load riddles. Please try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {riddles.map((riddle) => (
            <RiddleCard 
              key={riddle.address} 
              riddle={riddle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
