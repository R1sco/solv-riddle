// Script untuk deploy kontrak Solv-Riddle
const hre = require("hardhat");

async function main() {
  console.log("Memulai proses deployment kontrak Solv-Riddle...");

  // Deploy kontrak RiddleFactory
  const RiddleFactory = await hre.ethers.getContractFactory("RiddleFactory");
  const riddleFactory = await RiddleFactory.deploy();

  await riddleFactory.waitForDeployment();
  
  const riddleFactoryAddress = await riddleFactory.getAddress();
  console.log(`RiddleFactory telah di-deploy ke alamat: ${riddleFactoryAddress}`);

  // Buat beberapa teka-teki contoh
  console.log("Membuat contoh teka-teki...");
  
  const riddle1 = await riddleFactory.createRiddle(
    "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    "A map"
  );
  await riddle1.wait();

  const riddle2 = await riddleFactory.createRiddle(
    "What has an eye, but cannot see?",
    "A needle"
  );
  await riddle2.wait();

  console.log("Contoh teka-teki berhasil dibuat!");
  
  console.log("Deployment dan inisialisasi selesai!");
  console.log("--------------------------------------------------");
  console.log("Simpan alamat kontrak berikut di frontend:");
  console.log(`RiddleFactory: ${riddleFactoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
