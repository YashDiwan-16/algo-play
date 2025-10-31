import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { consoleLogger } from "@algorandfoundation/algokit-utils/types/logging";
import { AiPoolGameV2Factory } from "@/smart_contracts/artifacts/ai_pool_game_v2/AiPoolGameV2Client";

export async function deploy() {
  consoleLogger.info("=== Deploying AI Pool Game Contract ===");

  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  const factory = algorand.client.getTypedAppFactory(AiPoolGameV2Factory, {
    defaultSender: deployer.addr,
  });

  const { appClient, result } = await factory.deploy({
    onUpdate: "append",
    onSchemaBreak: "append",
    createParams: {
      method: "init",
      args: [],
    },
  });

  if (["create", "replace"].includes(result.operationPerformed)) {
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    });
  }

  consoleLogger.info(
    `Deployed AI Pool Game Contract: name=${appClient.appClient.appName} id=${appClient.appClient.appId} address=${appClient.appAddress}`
  );

  consoleLogger.info("AI Pool Game contract initialized successfully!");

  // Fund the pool with initial amount
  consoleLogger.info("Funding AI Pool with initial amount...");
  const initialPoolAmount = 80_000_000; // 80 ALGO initial pool
  const ALGO_TO_MICROALGO = 1_000_000;

  const composer = appClient.newGroup();

  composer.addTransaction(
    await algorand.createTransaction.payment({
      amount: (initialPoolAmount / ALGO_TO_MICROALGO).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    })
  );

  composer.fundPool({
    args: [BigInt(initialPoolAmount)],
  });

  const result2 = await composer.send();

  consoleLogger.info(
    `Successfully funded AI Pool with ${initialPoolAmount / ALGO_TO_MICROALGO} ALGO`
  );
  consoleLogger.info(`Transaction ID: ${result2.txIds[0]}`);

  // Display contract information
  const gameStatus = await appClient.getGameStatus();
  const totalPool = await appClient.getTotalPool();

  consoleLogger.info("Contract initialized with:");
  consoleLogger.info(`  Owner: ${deployer.addr}`);
  const MICROALGO_TO_ALGO = 1_000_000;
  consoleLogger.info(
    `  Total Pool: ${totalPool / BigInt(MICROALGO_TO_ALGO)} ALGO`
  );
  const WAITING_STATUS = 0;
  const ACTIVE_STATUS = 1;
  const FINISHED_STATUS = 2;
  consoleLogger.info(
    `  Game Status: ${gameStatus} (${WAITING_STATUS}=waiting, ${ACTIVE_STATUS}=active, ${FINISHED_STATUS}=finished)`
  );

  consoleLogger.info("\nSet this environment variable:");
  consoleLogger.info(
    `export NEXT_PUBLIC_AI_POOL_GAME_APP_ID="${appClient.appClient.appId}"`
  );

  consoleLogger.info("\nContract Methods Available:");
  consoleLogger.info("  - fundPool(poolAmount): Fund the AI pool (owner only)");
  consoleLogger.info(
    "  - joinGame(stakeAmount, botCount): Join game against bots"
  );
  consoleLogger.info("  - startGame(): Start the game (owner only)");
  consoleLogger.info(
    "  - endGame(humanWon): End game and declare winner (owner only)"
  );
  consoleLogger.info("  - claimRefund(): Claim refund if you lost");
  consoleLogger.info("  - resetGame(): Reset game for next round (owner only)");
  consoleLogger.info("  - getGameId(): Get game ID");
  consoleLogger.info("  - getGameStatus(): Get current game status");
  consoleLogger.info("  - getMinStake(): Get minimum stake amount");
  consoleLogger.info("  - getMaxBots(): Get maximum number of bots");
  consoleLogger.info("  - getTotalPool(): Get total pool amount");
  consoleLogger.info("  - getCurrentGamePool(): Get current game pool amount");
  consoleLogger.info("  - getHumanPlayer(): Get current human player");
  consoleLogger.info("  - getHumanStake(): Get human player stake");
  consoleLogger.info("  - getBotCount(): Get number of bots in current game");
  consoleLogger.info("  - getGameRound(): Get current game round number");
  consoleLogger.info("  - getWinner(): Get winner of last game");
  consoleLogger.info(
    "  - calculatePotentialWinnings(): Calculate potential winnings"
  );
  consoleLogger.info("  - calculateBotStakePerBot(): Calculate stake per bot");
  consoleLogger.info(
    "  - emergencyWithdraw(): Emergency withdraw (owner only)"
  );

  consoleLogger.info("\nGame Flow:");
  consoleLogger.info("  1. Owner funds the pool with ALGO");
  consoleLogger.info("  2. Human player joins game with stake and bot count");
  consoleLogger.info("  3. Owner starts the game");
  consoleLogger.info("  4. Game is played (off-chain)");
  consoleLogger.info("  5. Owner ends game with result (humanWon: 1 or 0)");
  consoleLogger.info("  6. If human won: gets stake + all bot stakes");
  consoleLogger.info("  7. If human lost: money goes back to pool");
  consoleLogger.info("  8. Owner resets game for next round");
  return {
    name: "ai_pool_game_v2",
    appId: appClient.appClient.appId,
    appAddress: appClient.appAddress,
  };
}
