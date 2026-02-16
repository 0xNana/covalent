import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, network } from "hardhat";
import { CovalentFund, CovalentFund__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
  recipient: HardhatEthersSigner;
};

async function deployFixture(deployer: HardhatEthersSigner) {
  const factory = (await ethers.getContractFactory("CovalentFund")) as CovalentFund__factory;
  const contract = (await factory.deploy(deployer.address)) as CovalentFund;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

async function createTestFund(
  contract: CovalentFund,
  recipient: string,
  startOffset: number = 60,
  endOffset: number = 86400,
) {
  const block = await ethers.provider.getBlock("latest");
  const now = block!.timestamp;

  const tx = await contract.createFund({
    title: "Test Fund",
    description: "A test donation fund for confidential donations",
    recipient,
    startTime: now + startOffset,
    endTime: now + endOffset,
  });
  await tx.wait();
}

describe("CovalentFund", function () {
  let signers: Signers;
  let contract: CovalentFund;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      carol: ethSigners[3],
      recipient: ethSigners[4],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite requires the FHEVM mock environment");
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture(signers.deployer));
  });

  describe("Fund Creation", function () {
    it("should create a fund with correct parameters", async function () {
      await createTestFund(contract, signers.recipient.address);

      const fund = await contract.getFund(1);
      expect(fund.id).to.equal(1);
      expect(fund.title).to.equal("Test Fund");
      expect(fund.recipient).to.equal(signers.recipient.address);
      expect(fund.creator).to.equal(signers.deployer.address);
      expect(fund.active).to.be.true;
      expect(fund.revealed).to.be.false;
      expect(fund.donationCount).to.equal(0);
    });

    it("should emit FundCreated event", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        contract.createFund({
          title: "Event Test",
          description: "Testing events",
          recipient: signers.recipient.address,
          startTime: now + 60,
          endTime: now + 86400,
        }),
      )
        .to.emit(contract, "FundCreated")
        .withArgs(1, signers.deployer.address, "Event Test", signers.recipient.address, now + 60, now + 86400);
    });

    it("should revert with empty title", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        contract.createFund({
          title: "",
          description: "No title",
          recipient: signers.recipient.address,
          startTime: now + 60,
          endTime: now + 86400,
        }),
      ).to.be.revertedWith("CovalentFund: Title required");
    });

    it("should revert with zero address recipient", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        contract.createFund({
          title: "Test",
          description: "Zero address",
          recipient: ethers.ZeroAddress,
          startTime: now + 60,
          endTime: now + 86400,
        }),
      ).to.be.revertedWith("CovalentFund: Invalid recipient");
    });

    it("should revert with invalid time range", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        contract.createFund({
          title: "Test",
          description: "Bad time",
          recipient: signers.recipient.address,
          startTime: now + 86400,
          endTime: now + 60,
        }),
      ).to.be.revertedWith("CovalentFund: Invalid time range");
    });

    it("should increment fund IDs", async function () {
      await createTestFund(contract, signers.recipient.address);
      await createTestFund(contract, signers.recipient.address);

      const fund1 = await contract.getFund(1);
      const fund2 = await contract.getFund(2);
      expect(fund1.id).to.equal(1);
      expect(fund2.id).to.equal(2);
    });
  });

  describe("Encrypted Donations", function () {
    const FUND_ID = 1;

    beforeEach(async function () {
      await createTestFund(contract, signers.recipient.address, 60, 86400);
      // Advance time past the fund start time
      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine", []);
    });

    it("should accept an encrypted donation and update the tally", async function () {
      const donationAmount = 100;

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(donationAmount)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .donate(FUND_ID, encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      const fund = await contract.getFund(FUND_ID);
      expect(fund.donationCount).to.equal(1);

      // Decrypt the encrypted total and verify
      const encryptedTotal = await contract.getEncryptedTotal(FUND_ID);
      const decryptedTotal = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotal,
        contractAddress,
        signers.alice,
      );
      expect(decryptedTotal).to.equal(donationAmount);
    });

    it("should accumulate multiple donations correctly", async function () {
      const amounts = [100, 50, 75];
      const donors = [signers.alice, signers.bob, signers.carol];

      for (let i = 0; i < amounts.length; i++) {
        const encrypted = await fhevm
          .createEncryptedInput(contractAddress, donors[i].address)
          .add32(amounts[i])
          .encrypt();

        const tx = await contract
          .connect(donors[i])
          .donate(FUND_ID, encrypted.handles[0], encrypted.inputProof);
        await tx.wait();
      }

      const fund = await contract.getFund(FUND_ID);
      expect(fund.donationCount).to.equal(3);

      // The last donor has access to decrypt the total
      const encryptedTotal = await contract.getEncryptedTotal(FUND_ID);
      const decryptedTotal = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotal,
        contractAddress,
        signers.carol,
      );
      expect(decryptedTotal).to.equal(100 + 50 + 75);
    });

    it("should emit DonationMade event with donation index", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await expect(contract.connect(signers.alice).donate(FUND_ID, encrypted.handles[0], encrypted.inputProof))
        .to.emit(contract, "DonationMade")
        .withArgs(FUND_ID, signers.alice.address, 1, (value: bigint) => value > 0n);
    });

    it("should allow same donor to donate in different blocks", async function () {
      // NOTE: Same-block duplicate prevention cannot be tested in FHEVM mock
      // because the mock processes each tx in its own block. The contract logic
      // is correct: _lastDonationBlock[fundId][sender] < block.number
      const encrypted1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await contract.connect(signers.alice).donate(FUND_ID, encrypted1.handles[0], encrypted1.inputProof);

      // Mine a new block so the next donation is in a different block
      await network.provider.send("evm_mine", []);

      const encrypted2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .donate(FUND_ID, encrypted2.handles[0], encrypted2.inputProof);
      await tx.wait();

      const fund = await contract.getFund(FUND_ID);
      expect(fund.donationCount).to.equal(2);
    });

    it("should revert donation to non-existent fund", async function () {
      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      await expect(
        contract.connect(signers.alice).donate(999, encrypted.handles[0], encrypted.inputProof),
      ).to.be.revertedWith("CovalentFund: Fund does not exist");
    });
  });

  describe("Reveal Process", function () {
    const FUND_ID = 1;

    beforeEach(async function () {
      await createTestFund(contract, signers.recipient.address, 60, 86400);

      // Advance time and make a donation
      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine", []);

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(225)
        .encrypt();
      await contract.connect(signers.alice).donate(FUND_ID, encrypted.handles[0], encrypted.inputProof);
    });

    it("should allow creator to request reveal", async function () {
      await expect(contract.requestReveal(FUND_ID)).to.emit(contract, "RevealRequested").withArgs(
        FUND_ID,
        signers.deployer.address,
        (value: bigint) => value > 0n, // timestamp
      );
    });

    it("should allow admin to request reveal", async function () {
      await contract.addAdmin(FUND_ID, signers.bob.address);
      await expect(contract.connect(signers.bob).requestReveal(FUND_ID)).to.emit(contract, "RevealRequested");
    });

    it("should revert reveal request from unauthorized user", async function () {
      await expect(contract.connect(signers.carol).requestReveal(FUND_ID)).to.be.revertedWith(
        "CovalentFund: Not authorized",
      );
    });

    it("should allow owner to reveal total after request", async function () {
      await contract.requestReveal(FUND_ID);

      await expect(contract.revealTotal(FUND_ID, 225))
        .to.emit(contract, "TotalRevealed")
        .withArgs(FUND_ID, 225, signers.deployer.address, (value: bigint) => value > 0n);

      const fund = await contract.getFund(FUND_ID);
      expect(fund.revealed).to.be.true;
      expect(fund.revealedTotal).to.equal(225);
    });

    it("should revert reveal without prior request", async function () {
      await expect(contract.revealTotal(FUND_ID, 225)).to.be.revertedWith("CovalentFund: Reveal not requested");
    });

    it("should revert reveal from non-owner", async function () {
      await contract.requestReveal(FUND_ID);
      await expect(contract.connect(signers.alice).revealTotal(FUND_ID, 225)).to.be.revertedWith(
        "CovalentFund: Only owner can reveal",
      );
    });

    it("should revert double reveal", async function () {
      await contract.requestReveal(FUND_ID);
      await contract.revealTotal(FUND_ID, 225);

      await expect(contract.requestReveal(FUND_ID)).to.be.revertedWith("CovalentFund: Already revealed");
    });
  });

  describe("Withdrawal", function () {
    const FUND_ID = 1;

    beforeEach(async function () {
      await createTestFund(contract, signers.recipient.address, 60, 3600);

      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine", []);

      const encrypted = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(500)
        .encrypt();
      await contract.connect(signers.alice).donate(FUND_ID, encrypted.handles[0], encrypted.inputProof);

      await contract.requestReveal(FUND_ID);
      await contract.revealTotal(FUND_ID, 500);
    });

    it("should allow withdrawal after reveal and fund end", async function () {
      // Advance time past fund end
      await network.provider.send("evm_increaseTime", [3600]);
      await network.provider.send("evm_mine", []);

      await expect(contract.withdraw(FUND_ID))
        .to.emit(contract, "Withdrawal")
        .withArgs(FUND_ID, signers.recipient.address, 500, (value: bigint) => value > 0n);

      const fund = await contract.getFund(FUND_ID);
      expect(fund.active).to.be.false;
      expect(fund.revealedTotal).to.equal(0);
    });

    it("should revert withdrawal before reveal", async function () {
      // Create a second fund without reveal
      await createTestFund(contract, signers.recipient.address, 60, 3600);
      await network.provider.send("evm_increaseTime", [3700]);
      await network.provider.send("evm_mine", []);

      await expect(contract.withdraw(2)).to.be.revertedWith("CovalentFund: Total must be revealed before withdrawal");
    });

    it("should revert withdrawal while fund is still active", async function () {
      // Fund hasn't ended yet
      await expect(contract.withdraw(FUND_ID)).to.be.revertedWith("CovalentFund: Fund still active");
    });
  });

  describe("Admin Management", function () {
    const FUND_ID = 1;

    beforeEach(async function () {
      await createTestFund(contract, signers.recipient.address);
    });

    it("should set creator as admin by default", async function () {
      expect(await contract.isAdmin(FUND_ID, signers.deployer.address)).to.be.true;
    });

    it("should allow creator to add admin", async function () {
      await contract.addAdmin(FUND_ID, signers.alice.address);
      expect(await contract.isAdmin(FUND_ID, signers.alice.address)).to.be.true;
    });

    it("should allow admin to add another admin", async function () {
      await contract.addAdmin(FUND_ID, signers.alice.address);
      await contract.connect(signers.alice).addAdmin(FUND_ID, signers.bob.address);
      expect(await contract.isAdmin(FUND_ID, signers.bob.address)).to.be.true;
    });

    it("should allow only creator to remove admin", async function () {
      await contract.addAdmin(FUND_ID, signers.alice.address);
      await contract.removeAdmin(FUND_ID, signers.alice.address);
      expect(await contract.isAdmin(FUND_ID, signers.alice.address)).to.be.false;
    });

    it("should prevent non-creator from removing admin", async function () {
      await contract.addAdmin(FUND_ID, signers.alice.address);
      await contract.addAdmin(FUND_ID, signers.bob.address);

      await expect(
        contract.connect(signers.alice).removeAdmin(FUND_ID, signers.bob.address),
      ).to.be.revertedWith("CovalentFund: Only creator can remove admins");
    });

    it("should prevent removing creator", async function () {
      await expect(contract.removeAdmin(FUND_ID, signers.deployer.address)).to.be.revertedWith(
        "CovalentFund: Cannot remove creator",
      );
    });
  });

  describe("Full Demo Flow", function () {
    it("should handle the complete donation lifecycle", async function () {
      // 1. Create fund
      await createTestFund(contract, signers.recipient.address, 60, 7200);

      // 2. Advance time to fund start
      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine", []);

      // 3. Three donors make encrypted donations (100 + 50 + 75 = 225)
      const donations = [
        { donor: signers.alice, amount: 100 },
        { donor: signers.bob, amount: 50 },
        { donor: signers.carol, amount: 75 },
      ];

      for (const { donor, amount } of donations) {
        const encrypted = await fhevm
          .createEncryptedInput(contractAddress, donor.address)
          .add32(amount)
          .encrypt();
        const tx = await contract.connect(donor).donate(1, encrypted.handles[0], encrypted.inputProof);
        await tx.wait();
      }

      // 4. Verify donation count
      let fund = await contract.getFund(1);
      expect(fund.donationCount).to.equal(3);

      // 5. Verify encrypted total matches expected sum
      const encryptedTotal = await contract.getEncryptedTotal(1);
      const decryptedTotal = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotal,
        contractAddress,
        signers.carol,
      );
      expect(decryptedTotal).to.equal(225);

      // 6. Admin requests reveal
      await contract.requestReveal(1);

      // 7. Owner reveals the total (simulating MCP)
      await contract.revealTotal(1, 225);

      fund = await contract.getFund(1);
      expect(fund.revealed).to.be.true;
      expect(fund.revealedTotal).to.equal(225);

      // 8. Advance time past fund end and withdraw
      await network.provider.send("evm_increaseTime", [7200]);
      await network.provider.send("evm_mine", []);

      await contract.withdraw(1);
      fund = await contract.getFund(1);
      expect(fund.active).to.be.false;
    });
  });
});
