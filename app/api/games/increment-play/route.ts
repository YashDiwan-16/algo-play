/**
 * Increment Play Count API Route
 *
 * Handles tracking game plays with anti-spam measures and blockchain integration.
 * Implements rate limiting, play duration validation, content verification,
 * and records plays both off-chain (MongoDB) and on-chain (Prize contract).
 *
 * Security features:
 * - IP-based rate limiting (3 plays per minute)
 * - Minimum play duration validation (5 seconds)
 * - Game content hash verification
 * - Graceful degradation if on-chain recording fails
 *
 * @module api/games/increment-play
 */

import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { type NextRequest, NextResponse } from "next/server";
import { gameService } from "@/lib/game-service";
import { PrizeClient } from "@/smart_contracts/artifacts/prize/PrizeClient";

// Rate limiting configuration
/** In-memory store for tracking play attempts per IP address */
const playAttempts = new Map<string, { count: number; lastReset: number }>();
/** Rate limit window duration (1 minute) */
const RATE_LIMIT_WINDOW = 60 * 1000;
/** Maximum plays allowed per window per IP */
const MAX_PLAYS_PER_WINDOW = 3;

/**
 * Extract client IP address from request headers
 *
 * Checks x-forwarded-for and x-real-ip headers to handle proxies.
 *
 * @param request - Next.js request object
 * @returns Client IP address or 'unknown' if not found
 */
function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";
  return ip;
}

/**
 * Check if IP address has exceeded rate limit
 *
 * Implements sliding window rate limiting with automatic reset.
 *
 * @param ip - Client IP address
 * @returns true if rate limited, false if request should be allowed
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = playAttempts.get(ip);

  if (!attempts || now - attempts.lastReset > RATE_LIMIT_WINDOW) {
    playAttempts.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (attempts.count >= MAX_PLAYS_PER_WINDOW) {
    return true;
  }

  attempts.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { gameId, playDuration, gameContentHash } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: "Game ID is required" },
        { status: 400 }
      );
    }

    // Rate limiting check - prevent spam
    const clientIP = getRateLimitKey(request);
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please wait before playing again.",
        },
        { status: 429 }
      );
    }

    // Validate minimum play duration
    if (!playDuration || playDuration < 5000) {
      return NextResponse.json(
        {
          success: false,
          error: "Game must be played for at least 5 seconds to count.",
        },
        { status: 400 }
      );
    }

    // Check if game exists
    const game = await gameService.getGameById(gameId);
    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    // Verify game content hash to ensure legitimate game loading
    if (gameContentHash) {
      const latestVersion = game.versions.at(-1);
      if (latestVersion) {
        const expectedHash = Buffer.from(latestVersion.html)
          .toString("base64")
          .slice(0, 16);
        if (gameContentHash !== expectedHash) {
          return NextResponse.json(
            { success: false, error: "Game content verification failed" },
            { status: 400 }
          );
        }
      }
    }

    // Increment play count in MongoDB
    const incrementSuccess = await gameService.incrementPlayCount(gameId);
    if (!incrementSuccess) {
      return NextResponse.json(
        { success: false, error: "Failed to increment play count" },
        { status: 500 }
      );
    }

    // Record play on Prize contract (best-effort, don't fail if this fails)
    try {
      await recordPlayOnChain(game.gameId, game.versions.at(-1)?.ipfsCid);
    } catch {
      // Failed to record play on-chain, but off-chain increment was successful
      // Continue execution - off-chain increment was successful
    }

    // Get updated game data
    const updatedGame = await gameService.getGameById(gameId);

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: "Play count incremented successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to increment play count",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}

async function recordPlayOnChain(_gameId: string, _gameCid?: string) {
  const appIdEnv = process.env.NEXT_PUBLIC_PRIZE_APP_ID;
  if (!appIdEnv) {
    throw new Error("NEXT_PUBLIC_PRIZE_APP_ID not set");
  }

  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  const appClient = new PrizeClient({
    algorand,
    appId: BigInt(appIdEnv),
    defaultSender: deployer.addr,
    appName: "Prize",
  });

  // Call recordPlay method on the Prize contract
  await appClient.send.recordPlay({
    args: [],
  });
}
