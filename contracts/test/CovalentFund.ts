import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, network } from "hardhat";
import {
  CovalentFund,
  CovalentFund__factory,
  MockUSDT,
  MockUSDT__factory,
  ConfidentialUSDT,
  ConfidentialUSDT__factory,
} from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
  recipient: HardhatEthersSigner;
};

const MINT_AMOUNT = 1_000_000n * 10n ** 6n; // 1M USDT (6 decimals)
const DEFAULT_GOAL = 1_000n * 10n ** 6n;
const DEFAULT_TITLE = "Independent Journalism Fund";
const DEFAULT_DESCRIPTION = "Support reporters with private, verifiable donations.";
const DEFAULT_CATEGORY = "Media";

async function deployFixture(deployer: HardhatEthersSigner) {
  // Deploy MockUSDT
  const usdtFactory = (await ethers.getContractFactory("MockUSDT")) as MockUSDT__factory;
  const usdt = (await usdtFactory.deploy()) as MockUSDT;

  // Deploy ConfidentialUSDT Shieldping MockUSDT
  const cUsdtFactory = (await ethers.getContractFactory("ConfidentialUSDT")) as ConfidentialUSDT__factory;
  const cUsdt = (await cUsdtFactory.deploy(await usdt.getAddress())) as ConfidentialUSDT;

  // Deploy CovalentFund
  const fundFactory = (await ethers.getContractFactory("CovalentFund")) as CovalentFund__factory;
  const fund = (await fundFactory.deploy(deployer.address)) as CovalentFund;

  const fundAddress = await fund.getAddress();
  const cUsdtAddress = await cUsdt.getAddress();
  const usdtAddress = await usdt.getAddress();

  // Whitelist cUSDT on the fund contract
  await fund.whitelistToken(cUsdtAddress);

  return { fund, fundAddress, usdt, usdtAddress, cUsdt, cUsdtAddress };
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
    recipient,
    startTime: now + startOffset,
    endTime: now + endOffset,
    goalAmount: DEFAULT_GOAL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    category: DEFAULT_CATEGORY,
  });
  await tx.wait();
}

/**
 * Helper: mint USDT to a user, approve the cUSDT wrapper, then wrap to cUSDT.
 */
async function mintAndWrap(
  usdt: MockUSDT,
  cUsdt: ConfidentialUSDT,
  user: HardhatEthersSigner,
  amount: bigint,
) {
  const cUsdtAddress = await cUsdt.getAddress();
  await usdt.mint(user.address, amount);
  await usdt.connect(user).approve(cUsdtAddress, amount);
  await cUsdt.connect(user).wrap(user.address, amount);
}

async function increaseTime(seconds: number) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine", []);
}

async function publicDecryptHandle(handle: string) {
  const decrypted = await fhevm.publicDecrypt([handle]);
  const cleartext = decrypted.clearValues[handle];

  if (typeof cleartext !== "bigint") {
    throw new Error(`Unexpected cleartext type for handle ${handle}: ${typeof cleartext}`);
  }

  return {
    cleartext,
    decryptionProof: decrypted.decryptionProof,
  };
}

async function publicDecryptFundTotal(contract: CovalentFund, fundId: number, token: string) {
  const encryptedTotal = await contract.getEncryptedTotal(fundId, token);
  return publicDecryptHandle(encryptedTotal);
}

describe("CovalentFund (ERC-7984)", function () {
  let signers: Signers;
  let fund: CovalentFund;
  let fundAddress: string;
  let usdt: MockUSDT;
  let usdtAddress: string;
  let cUsdt: ConfidentialUSDT;
  let cUsdtAddress: string;

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

    ({ fund, fundAddress, usdt, usdtAddress, cUsdt, cUsdtAddress } = await deployFixture(signers.deployer));
  });

  // ===========================================================================
  //  Token Wrapping
  // ===========================================================================

  describe("Token Wrapping", function () {
    it("should wrap USDT into cUSDT", async function () {
      const amount = 1000n * 10n ** 6n; // 1000 USDT
      await mintAndWrap(usdt, cUsdt, signers.alice, amount);

      // Underlying USDT should have moved to the wrapper
      const wrapperBalance = await usdt.balanceOf(cUsdtAddress);
      expect(wrapperBalance).to.equal(amount);
    });

    it("should report cUSDT as the underlying token", async function () {
      expect(await cUsdt.underlying()).to.equal(usdtAddress);
    });
  });

  // ===========================================================================
  //  Fund Creation
  // ===========================================================================

  describe("Fund Creation", function () {
    it("should create a fund with correct parameters", async function () {
      await createTestFund(fund, signers.recipient.address);

      const f = await fund.getFund(1);
      expect(f.id).to.equal(1);
      expect(f.recipient).to.equal(signers.recipient.address);
      expect(f.creator).to.equal(signers.deployer.address);
      expect(f.active).to.be.true;
      expect(f.donationCount).to.equal(0);
      expect(f.goalAmount).to.equal(DEFAULT_GOAL);
      expect(f.title).to.equal(DEFAULT_TITLE);
      expect(f.description).to.equal(DEFAULT_DESCRIPTION);
      expect(f.category).to.equal(DEFAULT_CATEGORY);
    });

    it("should emit FundCreated event", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        fund.createFund({
          recipient: signers.recipient.address,
          startTime: now + 60,
          endTime: now + 86400,
          goalAmount: DEFAULT_GOAL,
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          category: DEFAULT_CATEGORY,
        }),
      )
        .to.emit(fund, "FundCreated")
        .withArgs(1, signers.deployer.address, signers.recipient.address, now + 60, now + 86400);
    });

    it("should revert with zero address recipient", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        fund.createFund({
          recipient: ethers.ZeroAddress,
          startTime: now + 60,
          endTime: now + 86400,
          goalAmount: DEFAULT_GOAL,
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          category: DEFAULT_CATEGORY,
        }),
      ).to.be.revertedWithCustomError(fund, "InvalidRecipient");
    });

    it("should revert with invalid time range", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        fund.createFund({
          recipient: signers.recipient.address,
          startTime: now + 86400,
          endTime: now + 60,
          goalAmount: DEFAULT_GOAL,
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          category: DEFAULT_CATEGORY,
        }),
      ).to.be.revertedWithCustomError(fund, "InvalidTimeRange");
    });

    it("should increment fund IDs", async function () {
      await createTestFund(fund, signers.recipient.address);
      await createTestFund(fund, signers.recipient.address);

      const fund1 = await fund.getFund(1);
      const fund2 = await fund.getFund(2);
      expect(fund1.id).to.equal(1);
      expect(fund2.id).to.equal(2);
      expect(await fund.getFundCount()).to.equal(2);
    });

    it("should require a non-empty title", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        fund.createFund({
          recipient: signers.recipient.address,
          startTime: now + 60,
          endTime: now + 86400,
          goalAmount: DEFAULT_GOAL,
          title: "",
          description: DEFAULT_DESCRIPTION,
          category: DEFAULT_CATEGORY,
        }),
      ).to.be.revertedWithCustomError(fund, "EmptyTitle");
    });

    it("should require a non-zero goal amount", async function () {
      const block = await ethers.provider.getBlock("latest");
      const now = block!.timestamp;

      await expect(
        fund.createFund({
          recipient: signers.recipient.address,
          startTime: now + 60,
          endTime: now + 86400,
          goalAmount: 0,
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          category: DEFAULT_CATEGORY,
        }),
      ).to.be.revertedWithCustomError(fund, "InvalidGoalAmount");
    });
  });

  // ===========================================================================
  //  Token Whitelist
  // ===========================================================================

  describe("Token Whitelist", function () {
    it("should whitelist a token", async function () {
      // cUSDT already whitelisted in fixture
      expect(await fund.isWhitelisted(cUsdtAddress)).to.be.true;
    });

    it("should emit TokenWhitelisted event", async function () {
      const fakeToken = signers.carol.address;
      await expect(fund.whitelistToken(fakeToken))
        .to.emit(fund, "TokenWhitelisted")
        .withArgs(fakeToken);
    });

    it("should revert whitelisting zero address", async function () {
      await expect(fund.whitelistToken(ethers.ZeroAddress)).to.be.revertedWithCustomError(fund, "InvalidToken");
    });

    it("should revert whitelisting duplicate token", async function () {
      await expect(fund.whitelistToken(cUsdtAddress)).to.be.revertedWithCustomError(fund, "TokenAlreadyWhitelisted");
    });

    it("should remove a whitelisted token", async function () {
      await fund.removeWhitelistedToken(cUsdtAddress);
      expect(await fund.isWhitelisted(cUsdtAddress)).to.be.false;
    });

    it("should revert removing non-whitelisted token", async function () {
      await expect(fund.removeWhitelistedToken(signers.alice.address)).to.be.revertedWithCustomError(
        fund,
        "TokenNotWhitelisted",
      );
    });

    it("should only allow owner to whitelist", async function () {
      await expect(fund.connect(signers.alice).whitelistToken(signers.bob.address)).to.be.reverted;
    });
  });

  // ===========================================================================
  //  Donations via confidentialTransferAndCall
  // ===========================================================================

  describe("Confidential Donations", function () {
    const FUND_ID = 1;

    beforeEach(async function () {
      await createTestFund(fund, signers.recipient.address, 60, 86400);

      // Advance time past fund start
      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine", []);
    });

    it("should accept a donation via confidentialTransferAndCall", async function () {
      const donationAmount = 100n * 10n ** 6n; // 100 USDT worth
      await mintAndWrap(usdt, cUsdt, signers.alice, donationAmount);

      // Encrypt the amount and donate via confidentialTransferAndCall
      const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [FUND_ID]);

      const encrypted = await fhevm
        .createEncryptedInput(cUsdtAddress, signers.alice.address)
        .add64(donationAmount)
        .encrypt();

      await cUsdt
        .connect(signers.alice)
        ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
          fundAddress,
          encrypted.handles[0],
          encrypted.inputProof,
          encodedFundId,
        );

      const f = await fund.getFund(FUND_ID);
      expect(f.donationCount).to.equal(1);
    });

    it("should emit DonationReceived event", async function () {
      const donationAmount = 50n * 10n ** 6n;
      await mintAndWrap(usdt, cUsdt, signers.alice, donationAmount);

      const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [FUND_ID]);
      const encrypted = await fhevm
        .createEncryptedInput(cUsdtAddress, signers.alice.address)
        .add64(donationAmount)
        .encrypt();

      await expect(
        cUsdt
          .connect(signers.alice)
          ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
            fundAddress,
            encrypted.handles[0],
            encrypted.inputProof,
            encodedFundId,
          ),
      ).to.emit(fund, "DonationReceived");
    });

    it("should track the token in getFundTokens", async function () {
      const donationAmount = 25n * 10n ** 6n;
      await mintAndWrap(usdt, cUsdt, signers.alice, donationAmount);

      const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [FUND_ID]);
      const encrypted = await fhevm
        .createEncryptedInput(cUsdtAddress, signers.alice.address)
        .add64(donationAmount)
        .encrypt();

      await cUsdt
        .connect(signers.alice)
        ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
          fundAddress,
          encrypted.handles[0],
          encrypted.inputProof,
          encodedFundId,
        );

      const tokens = await fund.getFundTokens(FUND_ID);
      expect(tokens).to.include(cUsdtAddress);
      expect(tokens.length).to.equal(1);
    });

    it("should accumulate multiple donations", async function () {
      const donors = [signers.alice, signers.bob, signers.carol];
      const amounts = [100n * 10n ** 6n, 50n * 10n ** 6n, 75n * 10n ** 6n];

      for (let i = 0; i < donors.length; i++) {
        await mintAndWrap(usdt, cUsdt, donors[i], amounts[i]);

        const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [FUND_ID]);
        const encrypted = await fhevm
          .createEncryptedInput(cUsdtAddress, donors[i].address)
          .add64(amounts[i])
          .encrypt();

        await cUsdt
          .connect(donors[i])
          ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
            fundAddress,
            encrypted.handles[0],
            encrypted.inputProof,
            encodedFundId,
          );
      }

      const f = await fund.getFund(FUND_ID);
      expect(f.donationCount).to.equal(3);
    });

    it("should revert donation to non-existent fund", async function () {
      const donationAmount = 100n * 10n ** 6n;
      await mintAndWrap(usdt, cUsdt, signers.alice, donationAmount);

      const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [999]);
      const encrypted = await fhevm
        .createEncryptedInput(cUsdtAddress, signers.alice.address)
        .add64(donationAmount)
        .encrypt();

      await expect(
        cUsdt
          .connect(signers.alice)
          ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
            fundAddress,
            encrypted.handles[0],
            encrypted.inputProof,
            encodedFundId,
          ),
      ).to.be.reverted;
    });
  });

  // ===========================================================================
  //  Reveal Process (per-token)
  // ===========================================================================

  describe("Reveal Process", function () {
    const FUND_ID = 1;
    const DONATION_AMOUNT = 225n * 10n ** 6n;

    beforeEach(async function () {
      await createTestFund(fund, signers.recipient.address, 60, 3600);

      await increaseTime(120);

      // Make a donation
      await mintAndWrap(usdt, cUsdt, signers.alice, DONATION_AMOUNT);

      const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [FUND_ID]);
      const encrypted = await fhevm
        .createEncryptedInput(cUsdtAddress, signers.alice.address)
        .add64(DONATION_AMOUNT)
        .encrypt();

      await cUsdt
        .connect(signers.alice)
        ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
          fundAddress,
          encrypted.handles[0],
          encrypted.inputProof,
          encodedFundId,
        );
    });

    it("should not allow reveal requests before the fund ends", async function () {
      await expect(fund.requestReveal(FUND_ID, cUsdtAddress)).to.be.revertedWithCustomError(fund, "FundStillActive");
    });

    it("should allow creator to request reveal for a token", async function () {
      await increaseTime(3600);

      await expect(fund.requestReveal(FUND_ID, cUsdtAddress))
        .to.emit(fund, "RevealRequested")
        .withArgs(FUND_ID, cUsdtAddress, signers.deployer.address, (value: bigint) => value > 0n);

      expect(await fund.isRevealRequested(FUND_ID, cUsdtAddress)).to.equal(true);
    });

    it("should allow admin to request reveal", async function () {
      await fund.addAdmin(FUND_ID, signers.bob.address);
      await increaseTime(3600);

      await expect(fund.connect(signers.bob).requestReveal(FUND_ID, cUsdtAddress)).to.emit(fund, "RevealRequested");
    });

    it("should revert reveal request from unauthorized user", async function () {
      await increaseTime(3600);

      await expect(
        fund.connect(signers.carol).requestReveal(FUND_ID, cUsdtAddress),
      ).to.be.revertedWithCustomError(fund, "NotAuthorized");
    });

    it("should revert reveal requests when no encrypted total exists", async function () {
      await createTestFund(fund, signers.recipient.address, 60, 3600);
      await increaseTime(3600);

      await expect(fund.requestReveal(2, cUsdtAddress)).to.be.revertedWithCustomError(fund, "NoFundsToReveal");
    });

    it("should allow owner to reveal total after request with a valid proof", async function () {
      await increaseTime(3600);
      await fund.requestReveal(FUND_ID, cUsdtAddress);
      expect(await fund.isRevealRequested(FUND_ID, cUsdtAddress)).to.equal(true);
      const { cleartext, decryptionProof } = await publicDecryptFundTotal(fund, FUND_ID, cUsdtAddress);

      await expect(fund.revealTotal(FUND_ID, cUsdtAddress, cleartext, decryptionProof))
        .to.emit(fund, "TotalRevealed")
        .withArgs(FUND_ID, cUsdtAddress, cleartext, signers.deployer.address, (value: bigint) => value > 0n);

      expect(await fund.isTokenRevealed(FUND_ID, cUsdtAddress)).to.be.true;
      expect(await fund.isRevealRequested(FUND_ID, cUsdtAddress)).to.equal(false);
      expect(await fund.getRevealedTotal(FUND_ID, cUsdtAddress)).to.equal(cleartext);
    });

    it("should revert reveal without prior request", async function () {
      await increaseTime(3600);

      await expect(
        fund.revealTotal(FUND_ID, cUsdtAddress, DONATION_AMOUNT, "0x"),
      ).to.be.revertedWithCustomError(fund, "RevealNotRequested");
    });

    it("should revert reveal from non-owner", async function () {
      await increaseTime(3600);
      await fund.requestReveal(FUND_ID, cUsdtAddress);
      const { cleartext, decryptionProof } = await publicDecryptFundTotal(fund, FUND_ID, cUsdtAddress);

      await expect(
        fund.connect(signers.alice).revealTotal(FUND_ID, cUsdtAddress, cleartext, decryptionProof),
      ).to.be.revertedWithCustomError(fund, "OnlyOwnerCanReveal");
    });

    it("should revert double reveal", async function () {
      await increaseTime(3600);
      await fund.requestReveal(FUND_ID, cUsdtAddress);
      const { cleartext, decryptionProof } = await publicDecryptFundTotal(fund, FUND_ID, cUsdtAddress);
      await fund.revealTotal(FUND_ID, cUsdtAddress, cleartext, decryptionProof);

      await expect(
        fund.requestReveal(FUND_ID, cUsdtAddress),
      ).to.be.revertedWithCustomError(fund, "AlreadyRevealed");
    });

    it("should revert when the cleartext does not match the verified decryption proof", async function () {
      await increaseTime(3600);
      await fund.requestReveal(FUND_ID, cUsdtAddress);
      const { cleartext, decryptionProof } = await publicDecryptFundTotal(fund, FUND_ID, cUsdtAddress);

      await expect(fund.revealTotal(FUND_ID, cUsdtAddress, cleartext - 1n, decryptionProof)).to.be.reverted;
    });

    it("should revert when the proof payload is malformed after a valid reveal request", async function () {
      await increaseTime(3600);
      await fund.requestReveal(FUND_ID, cUsdtAddress);
      const { cleartext } = await publicDecryptFundTotal(fund, FUND_ID, cUsdtAddress);

      await expect(fund.revealTotal(FUND_ID, cUsdtAddress, cleartext, "0x1234")).to.be.reverted;
    });

    it("should not let donors decrypt the running aggregate before reveal is requested", async function () {
      const encryptedTotal = await fund.getEncryptedTotal(FUND_ID, cUsdtAddress);

      let decryptionFailed = false;
      try {
        await fhevm.userDecryptEuint(FhevmType.euint64, encryptedTotal, fundAddress, signers.alice);
      } catch {
        decryptionFailed = true;
      }

      expect(decryptionFailed).to.equal(true);
    });
  });

  // ===========================================================================
  //  Withdrawal
  // ===========================================================================

  describe("Withdrawal", function () {
    const FUND_ID = 1;
    const DONATION_AMOUNT = 500n * 10n ** 6n;

    beforeEach(async function () {
      await createTestFund(fund, signers.recipient.address, 60, 3600);

      await increaseTime(120);

      // Make a donation
      await mintAndWrap(usdt, cUsdt, signers.alice, DONATION_AMOUNT);

      const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [FUND_ID]);
      const encrypted = await fhevm
        .createEncryptedInput(cUsdtAddress, signers.alice.address)
        .add64(DONATION_AMOUNT)
        .encrypt();

      await cUsdt
        .connect(signers.alice)
        ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
          fundAddress,
          encrypted.handles[0],
          encrypted.inputProof,
          encodedFundId,
        );
    });

    it("should allow withdrawal after reveal and fund end", async function () {
      await increaseTime(3600);
      await fund.requestReveal(FUND_ID, cUsdtAddress);
      const { cleartext, decryptionProof } = await publicDecryptFundTotal(fund, FUND_ID, cUsdtAddress);
      await fund.revealTotal(FUND_ID, cUsdtAddress, cleartext, decryptionProof);

      await expect(fund.withdraw(FUND_ID, cUsdtAddress))
        .to.emit(fund, "Withdrawal")
        .withArgs(FUND_ID, cUsdtAddress, signers.recipient.address, DONATION_AMOUNT, (value: bigint) => value > 0n);

      const f = await fund.getFund(FUND_ID);
      expect(f.active).to.be.false;
      expect(await fund.getRevealedTotal(FUND_ID, cUsdtAddress)).to.equal(0);
    });

    it("should revert withdrawal before reveal", async function () {
      // Create a second fund without reveal
      await createTestFund(fund, signers.recipient.address, 60, 3600);
      await increaseTime(3700);

      await expect(fund.withdraw(2, cUsdtAddress)).to.be.revertedWithCustomError(fund, "TotalMustBeRevealed");
    });

    it("should revert withdrawal while fund is still active", async function () {
      await expect(fund.withdraw(FUND_ID, cUsdtAddress)).to.be.revertedWithCustomError(fund, "FundStillActive");
    });
  });

  // ===========================================================================
  //  Admin Management
  // ===========================================================================

  describe("Admin Management", function () {
    const FUND_ID = 1;

    beforeEach(async function () {
      await createTestFund(fund, signers.recipient.address);
    });

    it("should set creator as admin by default", async function () {
      expect(await fund.isAdmin(FUND_ID, signers.deployer.address)).to.be.true;
    });

    it("should allow creator to add admin and emit event", async function () {
      await expect(fund.addAdmin(FUND_ID, signers.alice.address))
        .to.emit(fund, "AdminAdded")
        .withArgs(FUND_ID, signers.alice.address, signers.deployer.address);
      expect(await fund.isAdmin(FUND_ID, signers.alice.address)).to.be.true;
    });

    it("should revert adding zero address as admin", async function () {
      await expect(fund.addAdmin(FUND_ID, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        fund,
        "InvalidAdminAddress",
      );
    });

    it("should revert adding duplicate admin", async function () {
      await fund.addAdmin(FUND_ID, signers.alice.address);
      await expect(fund.addAdmin(FUND_ID, signers.alice.address)).to.be.revertedWithCustomError(
        fund,
        "AlreadyAdmin",
      );
    });

    it("should prevent non-creator admin from adding another admin", async function () {
      await fund.addAdmin(FUND_ID, signers.alice.address);
      await expect(
        fund.connect(signers.alice).addAdmin(FUND_ID, signers.bob.address),
      ).to.be.revertedWithCustomError(fund, "NotAuthorized");
    });

    it("should allow only creator to remove admin and emit event", async function () {
      await fund.addAdmin(FUND_ID, signers.alice.address);
      await expect(fund.removeAdmin(FUND_ID, signers.alice.address))
        .to.emit(fund, "AdminRemoved")
        .withArgs(FUND_ID, signers.alice.address, signers.deployer.address);
      expect(await fund.isAdmin(FUND_ID, signers.alice.address)).to.be.false;
    });

    it("should revert removing a non-admin", async function () {
      await expect(fund.removeAdmin(FUND_ID, signers.carol.address)).to.be.revertedWithCustomError(
        fund,
        "NotAnAdmin",
      );
    });

    it("should prevent non-creator from removing admin", async function () {
      await fund.addAdmin(FUND_ID, signers.alice.address);
      await fund.addAdmin(FUND_ID, signers.bob.address);

      await expect(
        fund.connect(signers.alice).removeAdmin(FUND_ID, signers.bob.address),
      ).to.be.revertedWithCustomError(fund, "NotAuthorized");
    });

    it("should prevent removing creator", async function () {
      await expect(fund.removeAdmin(FUND_ID, signers.deployer.address)).to.be.revertedWithCustomError(
        fund,
        "CannotRemoveCreator",
      );
    });
  });

  // ===========================================================================
  //  Edge Cases
  // ===========================================================================

  describe("Edge Cases", function () {
    it("should reject direct ETH transfers", async function () {
      await expect(
        signers.deployer.sendTransaction({
          to: fundAddress,
          value: ethers.parseEther("1"),
        }),
      ).to.be.revertedWithCustomError(fund, "NoDirectETH");
    });

    it("should revert getFund for non-existent fund", async function () {
      await expect(fund.getFund(999)).to.be.revertedWithCustomError(fund, "FundDoesNotExist");
    });
  });

  // ===========================================================================
  //  Full Demo Flow
  // ===========================================================================

  describe("Full Demo Flow", function () {
    it("should handle the complete donation lifecycle with ERC-7984 tokens", async function () {
      // 1. Create fund
      await createTestFund(fund, signers.recipient.address, 60, 7200);

      // 2. Advance time to fund start
      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine", []);

      // 3. Three donors wrap USDT → cUSDT and donate
      const donations = [
        { donor: signers.alice, amount: 100n * 10n ** 6n },
        { donor: signers.bob, amount: 50n * 10n ** 6n },
        { donor: signers.carol, amount: 75n * 10n ** 6n },
      ];

      for (const { donor, amount } of donations) {
        await mintAndWrap(usdt, cUsdt, donor, amount);

        const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
        const encrypted = await fhevm
          .createEncryptedInput(cUsdtAddress, donor.address)
          .add64(amount)
          .encrypt();

        await cUsdt
          .connect(donor)
          ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
            fundAddress,
            encrypted.handles[0],
            encrypted.inputProof,
            encodedFundId,
          );
      }

      // 4. Verify donation count
      let f = await fund.getFund(1);
      expect(f.donationCount).to.equal(3);

      // 5. Verify the token is tracked
      const tokens = await fund.getFundTokens(1);
      expect(tokens).to.include(cUsdtAddress);

      // 6. Advance time past fund end and request reveal
      await increaseTime(7200);
      await fund.requestReveal(1, cUsdtAddress);

      // 7. Owner reveals the total with a verified decryption proof
      const { cleartext, decryptionProof } = await publicDecryptFundTotal(fund, 1, cUsdtAddress);
      await fund.revealTotal(1, cUsdtAddress, cleartext, decryptionProof);
      expect(await fund.isTokenRevealed(1, cUsdtAddress)).to.be.true;
      expect(await fund.getRevealedTotal(1, cUsdtAddress)).to.equal(cleartext);

      // 8. Withdraw the revealed total to the fund recipient
      await fund.withdraw(1, cUsdtAddress);
      f = await fund.getFund(1);
      expect(f.active).to.be.false;
    });
  });
});
