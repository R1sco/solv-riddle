const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RiddleFactory Contract", function () {
  let riddleFactory;
  let owner;
  let user1;

  const testRiddleText = "What has an eye, but cannot see?";
  const testRiddleSolution = "A needle";

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const RiddleFactoryContractFactory = await ethers.getContractFactory("RiddleFactory");
    riddleFactory = await RiddleFactoryContractFactory.deploy();
    await riddleFactory.waitForDeployment();
  });

  describe("Pembuatan Teka-teki", function () {
    it("Seharusnya membuat teka-teki baru", async function () {
      const tx = await riddleFactory.connect(user1).createRiddle(testRiddleText, testRiddleSolution);
      const receipt = await tx.wait();
      
      // Ambil alamat kontrak Riddle dari event
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "RiddleCreated"
      );
      const riddleAddress = event.args[0];
      
      // Verifikasi bahwa teka-teki telah ditambahkan ke array
      expect(await riddleFactory.riddleExists(riddleAddress)).to.equal(true);
      
      // Verifikasi jumlah teka-teki
      expect(await riddleFactory.getRiddleCount()).to.equal(1);
    });

    it("Seharusnya menyimpan informasi teka-teki dengan benar", async function () {
      const tx = await riddleFactory.createRiddle(testRiddleText, testRiddleSolution);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "RiddleCreated"
      );
      const riddleAddress = event.args[0];
      
      const riddleInfo = await riddleFactory.riddleInfo(riddleAddress);
      
      expect(riddleInfo.riddleText).to.equal(testRiddleText);
      expect(riddleInfo.reward).to.equal(0);
      expect(riddleInfo.isSolved).to.equal(false);
      expect(riddleInfo.solver).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

  describe("Pengelolaan Teka-teki", function () {
    let riddleAddress;
    
    beforeEach(async function () {
      const tx = await riddleFactory.createRiddle(testRiddleText, testRiddleSolution);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "RiddleCreated"
      );
      riddleAddress = event.args[0];
    });

    it("Seharusnya dapat menambahkan hadiah ke teka-teki", async function () {
      await riddleFactory.connect(user1).addRewardToRiddle(riddleAddress, { value: ethers.parseEther("1.0") });
      
      const riddleInfo = await riddleFactory.riddleInfo(riddleAddress);
      expect(riddleInfo.reward).to.equal(ethers.parseEther("1.0"));
      
      // Verifikasi bahwa kontrak Riddle juga diperbarui
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      expect(await riddleContract.reward()).to.equal(ethers.parseEther("1.0"));
    });

    it("Seharusnya memperbarui informasi ketika teka-teki dipecahkan", async function () {
      // Tambahkan hadiah
      await riddleFactory.connect(user1).addRewardToRiddle(riddleAddress, { value: ethers.parseEther("1.0") });
      
      // Pecahkan teka-teki
      const riddleContract = await ethers.getContractAt("Riddle", riddleAddress);
      await riddleContract.connect(user1).solve(testRiddleSolution);
      
      // Perbarui info teka-teki
      await riddleFactory.updateRiddleInfo(riddleAddress);
      
      // Verifikasi bahwa info diperbarui
      const riddleInfo = await riddleFactory.riddleInfo(riddleAddress);
      expect(riddleInfo.isSolved).to.equal(true);
      expect(riddleInfo.solver).to.equal(user1.address);
      expect(riddleInfo.reward).to.equal(0); // Hadiah sudah diberikan
    });

    it("Seharusnya mendapatkan semua teka-teki", async function () {
      // Buat teka-teki kedua
      await riddleFactory.createRiddle("Another riddle", "Answer");
      
      const allRiddles = await riddleFactory.getAllRiddles();
      expect(allRiddles.length).to.equal(2);
      expect(allRiddles[0]).to.equal(riddleAddress);
    });
  });
});
