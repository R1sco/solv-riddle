// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Riddle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RiddleFactory
 * @dev Kontrak untuk membuat dan mengelola teka-teki baru
 */
contract RiddleFactory is Ownable {
    // Array untuk menyimpan semua teka-teki yang dibuat
    address[] public riddles;
    
    // Mapping untuk menyimpan informasi teka-teki
    mapping(address => RiddleInfo) public riddleInfo;
    
    // Struktur untuk menyimpan informasi teka-teki
    struct RiddleInfo {
        string riddleText;
        uint256 reward;
        bool isSolved;
        address solver;
    }
    
    // Event yang dipancarkan ketika teka-teki baru dibuat
    event RiddleCreated(address indexed riddleAddress, string riddleText, address creator);
    
    /**
     * @dev Konstruktor untuk inisialisasi kontrak pabrik
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Fungsi untuk membuat teka-teki baru
     * @param _riddleText Teks teka-teki
     * @param _solution Jawaban teka-teki (akan dihash secara on-chain)
     * @return Alamat kontrak teka-teki baru
     */
    function createRiddle(string memory _riddleText, string memory _solution) external returns (address) {
        // Hash jawaban
        bytes32 solutionHash = keccak256(abi.encodePacked(_solution));
        
        // Buat instance kontrak teka-teki baru
        Riddle newRiddle = new Riddle(_riddleText, solutionHash, msg.sender);
        
        // Simpan alamat teka-teki baru
        address riddleAddress = address(newRiddle);
        riddles.push(riddleAddress);
        
        // Simpan informasi teka-teki
        riddleInfo[riddleAddress] = RiddleInfo({
            riddleText: _riddleText,
            reward: 0,
            isSolved: false,
            solver: address(0)
        });
        
        // Emit event
        emit RiddleCreated(riddleAddress, _riddleText, msg.sender);
        
        return riddleAddress;
    }
    
    /**
     * @dev Fungsi untuk menambah hadiah ke teka-teki
     * @param _riddleAddress Alamat kontrak teka-teki
     */
    function addRewardToRiddle(address _riddleAddress) external payable {
        require(riddleExists(_riddleAddress), "Teka-teki tidak ditemukan");
        
        // Perbarui informasi hadiah
        riddleInfo[_riddleAddress].reward += msg.value;
        
        // Tambahkan hadiah ke kontrak teka-teki
        Riddle(_riddleAddress).addReward{value: msg.value}();
    }
    
    /**
     * @dev Fungsi untuk memperbarui informasi status teka-teki
     * @param _riddleAddress Alamat kontrak teka-teki
     */
    function updateRiddleInfo(address _riddleAddress) external {
        require(riddleExists(_riddleAddress), "Teka-teki tidak ditemukan");
        
        Riddle riddle = Riddle(_riddleAddress);
        
        // Perbarui informasi teka-teki
        riddleInfo[_riddleAddress].isSolved = riddle.isSolved();
        riddleInfo[_riddleAddress].solver = riddle.solver();
        riddleInfo[_riddleAddress].reward = riddle.reward();
    }
    
    /**
     * @dev Fungsi untuk mendapatkan semua teka-teki
     * @return Array alamat semua kontrak teka-teki
     */
    function getAllRiddles() external view returns (address[] memory) {
        return riddles;
    }
    
    /**
     * @dev Fungsi untuk mendapatkan jumlah teka-teki
     * @return Jumlah teka-teki
     */
    function getRiddleCount() external view returns (uint256) {
        return riddles.length;
    }
    
    /**
     * @dev Fungsi untuk memeriksa apakah teka-teki ada
     * @param _riddleAddress Alamat kontrak teka-teki
     * @return Boolean yang menunjukkan apakah teka-teki ada
     */
    function riddleExists(address _riddleAddress) public view returns (bool) {
        for (uint i = 0; i < riddles.length; i++) {
            if (riddles[i] == _riddleAddress) {
                return true;
            }
        }
        return false;
    }
}
