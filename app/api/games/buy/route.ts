import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { type NextRequest, NextResponse } from "next/server";
import { gameService } from "@/lib/game-service";
import { PublishRegistryClient } from "@/smart_contracts/artifacts/publish_registry/PublishRegistryClient";

async function registerOwnershipOnChain(args: {
  gameCid: string;
  ownerAddress: string;
  parentCid: string;
  version: string;
}) {
  const appIdEnv = process.env.NEXT_PUBLIC_PUBLISH_REGISTRY_APP_ID;
  if (!appIdEnv) {
    return;
  }

  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");
  const appClient = new PublishRegistryClient({
    algorand,
    appId: BigInt(appIdEnv),
    defaultSender: deployer.addr,
    appName: "PublishRegistry",
  });

  const enc = new TextEncoder();
  await appClient.send.register({
    args: [
      enc.encode(args.gameCid),
      enc.encode(args.version),
      enc.encode(args.ownerAddress),
      enc.encode(args.parentCid ?? ""),
    ],
  });
}

function validatePurchaseRequest(
  gameId: string,
  buyerAddress: string,
  price: number
) {
  if (!(gameId && buyerAddress && price)) {
    return {
      error: "Missing required fields: gameId, buyerAddress, price",
      status: 400,
    };
  }

  if (typeof price !== "number" || price <= 0) {
    return {
      error: "Price must be a positive number",
      status: 400,
    };
  }

  return null;
}

async function validateGameForPurchase(
  gameId: string,
  buyerAddress: string,
  price: number
) {
  const game = await gameService.getGameById(gameId);
  if (!game) {
    return {
      error: "Game not found",
      status: 404,
      game: null,
    };
  }

  if (!(game.isForSale && game.salePrice)) {
    return {
      error: "Game is not for sale",
      status: 400,
      game,
    };
  }

  if (game.salePrice !== price) {
    return {
      error: "Price mismatch",
      status: 400,
      game,
    };
  }

  if (game.walletAddress === buyerAddress) {
    return {
      error: "You cannot buy your own game",
      status: 400,
      game,
    };
  }

  return { game, error: null, status: null };
}

export async function POST(request: NextRequest) {
  try {
    const { gameId, buyerAddress, price } = await request.json();

    // Validate request parameters
    const requestError = validatePurchaseRequest(gameId, buyerAddress, price);
    if (requestError) {
      return NextResponse.json(
        {
          success: false,
          error: requestError.error,
        },
        { status: requestError.status }
      );
    }

    // Validate game for purchase
    const gameValidation = await validateGameForPurchase(
      gameId,
      buyerAddress,
      price
    );
    if (gameValidation.error) {
      return NextResponse.json(
        {
          success: false,
          error: gameValidation.error,
        },
        { status: gameValidation.status }
      );
    }

    const game =
      gameValidation.game ??
      (() => {
        throw new Error("Game validation failed");
      })();

    // Update the game with new ownership and remove from sale
    const updatedGame = await gameService.updateGame(gameId, {
      walletAddress: buyerAddress,
      isForSale: false,
      salePrice: undefined,
      listedForSaleAt: undefined,
      purchasedAt: new Date(),
      previousOwner: game.walletAddress,
    });

    // Register new ownership on-chain (best-effort)
    try {
      const latestVersion = game.versions.at(-1);
      if (latestVersion?.ipfsCid) {
        await registerOwnershipOnChain({
          gameCid: latestVersion.ipfsCid,
          ownerAddress: buyerAddress,
          parentCid: game.originalGameId ? "" : "",
          version: String(latestVersion.version ?? game.currentVersion ?? 1),
        });
      }
    } catch {
      // Silently ignore on-chain registration errors to not block purchase
    }

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: `Game purchased successfully for ${price} ALGO`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to purchase game",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
