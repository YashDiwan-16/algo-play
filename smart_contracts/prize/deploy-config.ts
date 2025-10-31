import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { consoleLogger } from "@algorandfoundation/algokit-utils/types/logging";
import { PrizeFactory } from "@/smart_contracts/artifacts/prize/PrizeClient";

export async function deploy() {
  consoleLogger.info("=== Deploying Prize Contract ===");

  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  const factory = algorand.client.getTypedAppFactory(PrizeFactory, {
    defaultSender: deployer.addr,
  });

  const { appClient, result } = await factory.deploy({
    onUpdate: "append",
    onSchemaBreak: "append",
  });

  if (["create", "replace"].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    });
  }

  consoleLogger.info(
    `Deployed Prize Contract: name=${appClient.appClient.appName} id=${appClient.appClient.appId} address=${appClient.appAddress}`
  );

  // Initialize the contract
  consoleLogger.info("Initializing Prize contract...");
  const gameCid = new TextEncoder().encode("sample-game-cid");
  const owner = deployer.addr.toString();
  const rewardPer100 = BigInt(10_000_000); // 10 ALGO per 100 plays

  await appClient.send.init({
    args: [gameCid, owner, rewardPer100],
  });
  consoleLogger.info("Prize contract initialized successfully!");

  // Fund the contract
  consoleLogger.info("Funding Prize contract...");
  const fundAmount = 100_000_000; // 100 ALGO
  const ALGO_TO_MICROALGO = 1_000_000;

  const composer = appClient.newGroup();

  composer.addTransaction(
    await algorand.createTransaction.payment({
      amount: (fundAmount / ALGO_TO_MICROALGO).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  );

  composer.fundPool({
    args: [BigInt(fundAmount)],
  });

  const result2 = await composer.send();

  consoleLogger.info(
    `Successfully funded Prize contract with ${fundAmount / ALGO_TO_MICROALGO} ALGO`
  );
  consoleLogger.info(`Transaction ID: ${result2.txIds[0]}`);
  consoleLogger.info("\nSet this environment variable:");
  consoleLogger.info(
    `export NEXT_PUBLIC_PRIZE_APP_ID="${appClient.appClient.appId}"`
  );
  return {
    name: "prize",
    appId: appClient.appClient.appId,
    appAddress: appClient.appAddress,
  };
}
