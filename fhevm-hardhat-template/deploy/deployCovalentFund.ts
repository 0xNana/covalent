import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute } = hre.deployments;

  // ── 1. Deploy MockUSDT ────────────────────────────────────────────────────
  const mockUsdt = await deploy("MockUSDT", {
    from: deployer,
    log: true,
  });
  console.log(`✓ MockUSDT deployed at: ${mockUsdt.address}`);

  // ── 2. Deploy ConfidentialUSDT (wraps MockUSDT) ───────────────────────────
  const cUsdt = await deploy("ConfidentialUSDT", {
    from: deployer,
    args: [mockUsdt.address],
    log: true,
  });
  console.log(`✓ ConfidentialUSDT (cUSDT) deployed at: ${cUsdt.address}`);

  // ── 3. Deploy CovalentFund (owner = deployer) ────────────────────────────
  const covalentFund = await deploy("CovalentFund", {
    from: deployer,
    args: [deployer],
    log: true,
  });
  console.log(`✓ CovalentFund deployed at: ${covalentFund.address}`);

  // ── 4. Whitelist cUSDT on CovalentFund ────────────────────────────────────
  try {
    await execute(
      "CovalentFund",
      { from: deployer, log: true },
      "whitelistToken",
      cUsdt.address,
    );
    console.log(`✓ cUSDT whitelisted on CovalentFund`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("TokenAlreadyWhitelisted")) {
      console.log(`ℹ cUSDT already whitelisted — skipping`);
    } else {
      throw err;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Deployment Summary");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  MockUSDT:          ${mockUsdt.address}`);
  console.log(`  ConfidentialUSDT:  ${cUsdt.address}`);
  console.log(`  CovalentFund:      ${covalentFund.address}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n  Update your .env.local with:");
  console.log(`  NEXT_PUBLIC_CONTRACT_ADDRESS=${covalentFund.address}`);
  console.log(`  NEXT_PUBLIC_CUSDT_ADDRESS=${cUsdt.address}`);
  console.log(`  NEXT_PUBLIC_USDT_ADDRESS=${mockUsdt.address}`);
  console.log("═══════════════════════════════════════════════════════════\n");
};

export default func;
func.id = "deploy_covalentFund";
func.tags = ["CovalentFund"];
