import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { PrizeClient } from "@/smart_contracts/artifacts/prize/PrizeClient";

async function fundPrizeContract() {
  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  // Get the Prize contract app ID from environment
  const appIdEnv = process.env.NEXT_PUBLIC_PRIZE_APP_ID || "1044";
  if (!appIdEnv) {
    throw new Error("NEXT_PUBLIC_PRIZE_APP_ID not set");
  }

  const appClient = new PrizeClient({
    algorand,
    appId: BigInt(appIdEnv),
    defaultSender: deployer.addr,
    appName: "Prize",
  });

  // Check contract state and initialize if needed
  console.log("Checking Prize contract state...");

  try {
    // Try to get pool balance to check if initialized
    const balance = await appClient.send.getPoolBalance({ args: [] });
    console.log(
      `Contract is initialized. Current pool balance: ${balance.return} microAlgos`
    );
  } catch (error) {
    console.log("Contract not properly initialized, initializing now...");
    const gameCid = new TextEncoder().encode("sample-game-cid");
    const owner = deployer.addr.toString();
    const rewardPer100 = BigInt(10_000_000); // 10 ALGO per 100 plays

    await appClient.send.init({
      args: [gameCid, owner, rewardPer100],
    });
    console.log("Prize contract initialized successfully!");
  }

  // Amount to fund (in microAlgos) - 100 ALGO = 100,000,000 microAlgos
  const fundAmount = 100_000_000; // 100 ALGO
  const ALGO_TO_MICROALGO = 1_000_000;

  // Create transaction group: Payment + Application Call
  const composer = appClient.newGroup();

  // Add payment transaction
  composer.addTransaction(
    await algorand.createTransaction.payment({
      amount: (fundAmount / ALGO_TO_MICROALGO).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  );

  // Add fundPool application call
  composer.fundPool({
    args: [BigInt(fundAmount)],
  });

  const result = await composer.send();

  console.log(
    `Successfully funded Prize contract with ${fundAmount / ALGO_TO_MICROALGO} ALGO`
  );
  console.log(`Transaction ID: ${result.txIds[0]}`);
}

// Run the funding
fundPrizeContract().catch(console.error);
