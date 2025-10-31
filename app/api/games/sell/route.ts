import { type NextRequest, NextResponse } from "next/server";
import { MIN_SELL_PRICE } from "@/lib/constants";
import { gameService } from "@/lib/game-service";

export async function POST(request: NextRequest) {
  try {
    const { gameId, price, walletAddress } = await request.json();

    if (!(gameId && price && walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: gameId, price, walletAddress",
        },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Price must be a positive number",
        },
        { status: 400 }
      );
    }

    if (price < MIN_SELL_PRICE) {
      return NextResponse.json(
        {
          success: false,
          error: "Minimum price is 0.1 ALGO",
        },
        { status: 400 }
      );
    }

    // Get the game to verify ownership
    const game = await gameService.getGameById(gameId);
    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: "Game not found",
        },
        { status: 404 }
      );
    }

    // Verify ownership
    if (game.walletAddress !== walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You can only sell games you own",
        },
        { status: 403 }
      );
    }

    // Update the game with sale information
    const updatedGame = await gameService.updateGame(gameId, {
      isForSale: true,
      salePrice: price,
      listedForSaleAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: `Game listed for sale at ${price} ALGO`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list game for sale",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
