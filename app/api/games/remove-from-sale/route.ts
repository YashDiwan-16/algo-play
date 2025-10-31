import { type NextRequest, NextResponse } from "next/server";
import { gameService } from "@/lib/game-service";

export async function POST(request: NextRequest) {
  try {
    const { gameId, walletAddress } = await request.json();

    if (!(gameId && walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: gameId, walletAddress",
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
          error: "Unauthorized - you can only remove your own games from sale",
        },
        { status: 403 }
      );
    }

    // Remove from sale
    const updatedGame = await gameService.updateGame(gameId, {
      isForSale: false,
      salePrice: undefined,
      listedForSaleAt: undefined,
    });

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: "Game removed from sale successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove game from sale",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
