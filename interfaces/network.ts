import type { AlgoClientConfig } from "@algorandfoundation/algokit-utils/types/network-client";

// Define TokenHeader interface locally since the algosdk import path has changed
type TokenHeader = {
  [key: string]: string;
};

export interface AlgoViteClientConfig extends AlgoClientConfig {
  /** Base URL of the server e.g. http://localhost, https://testnet-api.algonode.cloud/, etc. */
  server: string;
  /** The port to use e.g. 4001, 443, etc. */
  port: string | number;
  /** The token to use for API authentication (or undefined if none needed) - can be a string, or an object with the header key => value */
  token: string | TokenHeader;
  /** String representing current Algorand Network type (testnet/mainnet and etc) */
  network: string;
}

export interface AlgoViteKMDConfig extends AlgoClientConfig {
  /** Base URL of the server e.g. http://localhost, https://testnet-api.algonode.cloud/, etc. */
  server: string;
  /** The port to use e.g. 4001, 443, etc. */
  port: string | number;
  /** The token to use for API authentication (or undefined if none needed) - can be a string, or an object with the header key => value */
  token: string | TokenHeader;
  /** KMD wallet name */
  wallet: string;
  /** KMD wallet password */
  password: string;
}
