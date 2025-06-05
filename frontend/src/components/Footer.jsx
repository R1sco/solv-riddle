import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold">Solv-Riddle: The Demo</h2>
            <p className="text-gray-400 dark:text-gray-300 mt-1">Decentralized riddle platform.</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
            <a href="#" className="text-gray-300 hover:text-white transition-colors dark:text-gray-400 dark:hover:text-gray-200">About</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors dark:text-gray-400 dark:hover:text-gray-200">How to Play</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors dark:text-gray-400 dark:hover:text-gray-200">FAQ</a>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} Solv-Riddle. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
