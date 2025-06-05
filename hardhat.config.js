require("@nomicfoundation/hardhat-toolbox");
const toml = require('@iarna/toml');
const fs = require('fs');

// Baca konfigurasi dari file TOML
let config;
try {
  config = toml.parse(fs.readFileSync('./config.toml', 'utf8'));
} catch (e) {
  console.error('Error saat membaca file config.toml:', e.message);
  config = {};
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    // Menambahkan konfigurasi jaringan Sepolia testnet dari config.toml
    sepolia: {
      url: config.networks?.sepolia?.url || "",
      accounts: config.credentials?.privateKey ? [config.credentials.privateKey] : [],
    },
  },
  paths: {
    artifacts: './frontend/src/artifacts',
  },
};
