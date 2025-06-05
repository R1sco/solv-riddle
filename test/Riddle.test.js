const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Kontrak Riddle", function () {
  let RiddleFactory;
  let riddleFactory;
  let owner;
  let user1;
  let user2;
  let riddleAddress;

  const testRiddleText = "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?";
  const testRiddleSolution = "A map";
  const wrongAnswer = "A globe";

  beforeEach(async function () {
    // Dapatkan signer akun
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy kontrak RiddleFactory
    const RiddleFactoryContractFactory = await ethers.getContractFactory("RiddleFactory");
    riddleFactory = await RiddleFactoryContractFactory.deploy();
    await riddleFactory.waitForDeployment();

    // Buat teka-teki baru
    const tx = await riddleFactory.createRiddle(testRiddleText, testRiddleSolution);
    const receipt = await tx.wait();
    
    // Ambil alamat kontrak Riddle dari event
    const event = receipt.logs.find(
      log => log.fragment && log.fragment.name === "RiddleCreated"
    );
    riddleAddress = event.args[0];
  });

  describe("Pembuatan dan Inisialisasi", function () {
    it("Seharusnya membuat teka-teki dengan teks yang benar", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      expect(await riddleContract.riddleText()).to.equal(testRiddleText);
    });

    it("Seharusnya menyetel reward awal ke 0", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      expect(await riddleContract.reward()).to.equal(0);
    });

    it("Seharusnya menyetel isSolved awal ke false", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      expect(await riddleContract.isSolved()).to.equal(false);
    });
  });

  describe("Penambahan Hadiah", function () {
    it("Seharusnya memungkinkan penambahan hadiah", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      await riddleContract.connect(user1).addReward({ value: ethers.parseEther("1.0") });
      expect(await riddleContract.reward()).to.equal(ethers.parseEther("1.0"));
    });

    it("Seharusnya memperbarui hadiah ketika beberapa pengguna menambahkan hadiah", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      await riddleContract.connect(user1).addReward({ value: ethers.parseEther("1.0") });
      await riddleContract.connect(user2).addReward({ value: ethers.parseEther("0.5") });
      
      expect(await riddleContract.reward()).to.equal(ethers.parseEther("1.5"));
    });
  });

  describe("Pemecahan Teka-teki", function () {
    beforeEach(async function () {
      // Tambahkan hadiah ke teka-teki
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      await riddleContract.connect(user1).addReward({ value: ethers.parseEther("1.0") });
    });

    it("Seharusnya gagal jika jawaban salah", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      await expect(riddleContract.connect(user2).solve(wrongAnswer))
        .to.be.revertedWith("Jawaban salah");
    });

    it("Seharusnya berhasil jika jawaban benar", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      
      // Dapatkan saldo user2 sebelum menjawab
      const initialBalance = await ethers.provider.getBalance(user2.address);
      
      // Jawab teka-teki
      const tx = await riddleContract.connect(user2).solve(testRiddleSolution);
      const receipt = await tx.wait();
      
      // Hitung gas yang digunakan
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Dapatkan saldo user2 setelah menjawab
      const finalBalance = await ethers.provider.getBalance(user2.address);
      
      // Periksa apakah user2 menerima hadiah (dikurangi biaya gas)
      expect(finalBalance + gasUsed - initialBalance).to.equal(ethers.parseEther("1.0"));
      
      // Periksa status teka-teki
      expect(await riddleContract.isSolved()).to.equal(true);
      expect(await riddleContract.solver()).to.equal(user2.address);
      expect(await riddleContract.reward()).to.equal(0); // Hadiah sudah ditransfer
    });

    it("Seharusnya mencegah pemecahan teka-teki yang sudah dipecahkan", async function () {
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      
      // Jawab teka-teki
      await riddleContract.connect(user2).solve(testRiddleSolution);
      
      // Coba jawab lagi
      await expect(riddleContract.connect(user1).solve(testRiddleSolution))
        .to.be.revertedWith("Teka-teki sudah terpecahkan");
    });
  });
});
