/**
 * Shortens a wallet address for display purposes
 * @param address - The full wallet address or null
 * @param width - Number of characters to show at start and end (default: 6)
 * @returns Shortened address like "ABC123...XYZ789" or empty string if null
 */
export function ellipseAddress(address: string | null, width = 6): string {
  return address ? `${address.slice(0, width)}...${address.slice(-width)}` : (address ?? '')
}
