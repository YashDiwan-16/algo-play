import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { type NextRequest, NextResponse } from "next/server";
import { gameService } from "@/lib/game-service";
import { PrizeClient } from "@/smart_contracts/artifacts/prize/PrizeClient";

// Rate limiting: track recent play attempts per IP
const playAttempts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_PLAYS_PER_WINDOW = 3; // Max 3 plays per minute per IP

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";
  return ip;
}

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
