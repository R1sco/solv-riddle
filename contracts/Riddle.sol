// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Riddle
 * @dev Kontrak untuk teka-teki individual yang berisi pertanyaan dan jawaban terenkripsi
 */
contract Riddle is Ownable {
    // Teks teka-teki yang dapat dilihat publik
    string public riddleText;
    
    // Hash jawaban yang benar (tersembunyi)
    bytes32 private solutionHash;
    
    // Alamat pemecah teka-teki, awalnya kosong
    address public solver;
    
    // Jumlah hadiah yang dapat dimenangkan
    uint256 public reward;
    
    // Status teka-teki
    bool public isSolved;
    
    // Event yang dipancarkan ketika teka-teki terpecahkan
    event RiddleSolved(address indexed solver, uint256 reward, uint256 solvedAt);
    
    /**
     * @dev Konstruktor untuk membuat teka-teki baru
     * @param _riddleText Teks teka-teki
     * @param _solutionHash Hash dari jawaban yang benar
     * @param _owner Pemilik kontrak (biasanya RiddleFactory)
     */
    constructor(
        string memory _riddleText,
        bytes32 _solutionHash,
        address _owner
    ) Ownable(_owner) {
        riddleText = _riddleText;
        solutionHash = _solutionHash;
        reward = 0;
        isSolved = false;
    }
    
    /**
     * @dev Fungsi untuk menambah hadiah teka-teki
     */
    function addReward() external payable {
        require(!isSolved, "Teka-teki sudah terpecahkan");
        reward += msg.value;
    }
    
    /**
     * @dev Fungsi untuk mencoba memecahkan teka-teki
     * @param _answer Jawaban yang dimasukkan oleh pemain
     */
    function solve(string memory _answer) external {
        require(!isSolved, "Teka-teki sudah terpecahkan");
        require(reward > 0, "Tidak ada hadiah untuk teka-teki ini");
        
        // Hitung hash dari jawaban yang dimasukkan
        bytes32 answerHash = keccak256(abi.encodePacked(_answer));
        
        // Bandingkan dengan hash jawaban yang benar
        require(answerHash == solutionHash, "Jawaban salah");
        
        // Tandai teka-teki sebagai terpecahkan
        isSolved = true;
        solver = msg.sender;
        
        // Kirim hadiah ke pemecah teka-teki
        uint256 prizeAmount = reward;
        reward = 0;
        
        // Emit event
        emit RiddleSolved(msg.sender, prizeAmount, block.timestamp);
        
        // Transfer hadiah
        (bool sent, ) = payable(msg.sender).call{value: prizeAmount}("");
        require(sent, "Gagal mengirim hadiah");
    }
    
    /**
     * @dev Fungsi untuk memeriksa jawaban tanpa mengubah state (view function)
     * @param _answer Jawaban yang dimasukkan oleh pemain
     * @return Apakah jawaban benar
     */
    function checkAnswer(string memory _answer) external view returns (bool) {
        bytes32 answerHash = keccak256(abi.encodePacked(_answer));
        return answerHash == solutionHash;
    }
}
