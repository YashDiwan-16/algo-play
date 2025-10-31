import fs from "node:fs";
import path from "node:path";
import { Config } from "@algorandfoundation/algokit-utils";
import { consoleLogger } from "@algorandfoundation/algokit-utils/types/logging";
import { registerDebugEventHandlers } from "@algorandfoundation/algokit-utils-debug";

// Uncomment the traceAll option to enable auto generation of AVM Debugger compliant sourceMap and simulation trace file for all AVM calls.
// Learn more about using AlgoKit AVM Debugger to debug your TEAL source codes and inspect various kinds of Algorand transactions in atomic groups -> https://github.com/algorandfoundation/algokit-avm-vscode-Debugger

Config.configure({
  logger: consoleLogger,
  debug: true,
  //  traceAll: true,
});
registerDebugEventHandlers();

// base directory
const baseDir = path.resolve(__dirname);

// function to validate and dynamically import a module
async function importDeployerIfExists(dir: string) {
  const deployerPath = path.resolve(dir, "deploy-config");
  if (
    fs.existsSync(`${deployerPath}.ts`) ||
    fs.existsSync(`${deployerPath}.js`)
  ) {
    const deployer = await import(deployerPath);
    return { ...deployer, name: path.basename(dir) };
  }
  return null;
}

// JSON replacer to serialize BigInt values as strings
function bigintReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value as unknown;
}

// get a list of all deployers from the subdirectories
async function getDeployers() {
  const directories = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.resolve(baseDir, dirent.name));

  const deployers = await Promise.all(directories.map(importDeployerIfExists));
  return deployers.filter((deployer) => deployer !== null); // Filter out null values
}

// execute all the deployers
(async () => {
  const contractName = process.argv.length > 2 ? process.argv[2] : undefined;
  const contractDeployers = await getDeployers();

  const filteredDeployers = contractName
    ? contractDeployers.filter((deployer) => deployer.name === contractName)
    : contractDeployers;

  if (contractName && filteredDeployers.length === 0) {
    consoleLogger.warn(`No deployer found for contract name: ${contractName}`);
    return;
  }

  const results: Record<string, { appId: number | string }> = {};
  for (const deployer of filteredDeployers) {
    try {
      const res = await deployer.deploy?.();
      if (res?.appId) {
        results[deployer.name] = {
          appId: res.appId,
        };
      }
    } catch (e) {
      consoleLogger.error(`Error deploying ${deployer.name}:`, e);
    }
  }

  // Write/merge deployed.json in this directory
  const deployedPath = path.resolve(baseDir, "deployed.json");
  let existing: Record<string, { appId: number | string }> = {};
  if (fs.existsSync(deployedPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
    } catch {
      existing = {};
    }
  }
  const merged = { ...existing, ...results };
  fs.writeFileSync(deployedPath, JSON.stringify(merged, bigintReplacer, 2));
  consoleLogger.info(`Wrote deployed app IDs to ${deployedPath}`);
})();
