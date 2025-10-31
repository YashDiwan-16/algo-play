/**
 * PublishRegistry Smart Contract Deployment Configuration
 *
 * This module handles the deployment of the PublishRegistry contract,
 * which manages game ownership and publishing on the Algorand blockchain.
 *
 * @module smart_contracts/publish_registry/deploy-config
 */

import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { consoleLogger } from "@algorandfoundation/algokit-utils/types/logging";
import { PublishRegistryFactory } from "../artifacts/publish_registry/PublishRegistryClient";

/**
 * Deploys the PublishRegistry (Ownership) smart contract to Algorand
 *
 * This function:
 * 1. Initializes connection to Algorand network
 * 2. Creates/updates the PublishRegistry application
 * 3. Funds the contract account with 1 ALGO for operations
 * 4. Returns deployment details for reference
 *
 * @returns {Promise<Object>} Deployment details including appId and address
 * @throws {Error} If deployment fails or environment is not properly configured
 */
export async function deploy() {
  consoleLogger.info("=== Deploying PublishRegistry (Ownership) ===");

  // Initialize Algorand client from environment variables
  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  // Create typed application factory for type-safe interactions
  const factory = algorand.client.getTypedAppFactory(PublishRegistryFactory, {
    defaultSender: deployer.addr,
  });

  // Deploy with automatic update and schema migration handling
  const { appClient, result } = await factory.deploy({
    onUpdate: "append", // Append new approval program on update
    onSchemaBreak: "append", // Handle schema changes gracefully
  });

  // Fund the application account if newly created or replaced
  if (["create", "replace"].includes(result.operationPerformed)) {
    // Send 1 ALGO to cover minimum balance requirements for box storage
    // and provide operational headroom for future transactions
    await algorand.send.payment({
      amount: (1).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    });
  }

  consoleLogger.info(
    `Deployed PublishRegistry: name=${appClient.appClient.appName} id=${appClient.appClient.appId} address=${appClient.appAddress}`
  );

  // Return deployment metadata for storage and reference
  return {
    name: "publish_registry",
    appId: appClient.appClient.appId,
    appAddress: appClient.appAddress,
  };
}
