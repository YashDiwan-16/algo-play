import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { consoleLogger } from "@algorandfoundation/algokit-utils/types/logging";
import { PublishRegistryFactory } from "../artifacts/publish_registry/PublishRegistryClient";

// Deploys the Ownership (PublishRegistry) application
export async function deploy() {
  consoleLogger.info("=== Deploying PublishRegistry (Ownership) ===");

  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  const factory = algorand.client.getTypedAppFactory(PublishRegistryFactory, {
    defaultSender: deployer.addr,
  });

  const { appClient, result } = await factory.deploy({
    onUpdate: "append",
    onSchemaBreak: "append",
  });

  if (["create", "replace"].includes(result.operationPerformed)) {
    // Fund app account with minimum balance for boxes / ops headroom if needed later
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    });
  }

  consoleLogger.info(
    `Deployed PublishRegistry: name=${appClient.appClient.appName} id=${appClient.appClient.appId} address=${appClient.appAddress}`
  );
  return {
    name: "publish_registry",
    appId: appClient.appClient.appId,
    appAddress: appClient.appAddress,
  };
}
