"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/canvas-forge/CodeEditor";
import { Header } from "@/components/canvas-forge/Header";
import { Preview } from "@/components/canvas-forge/Preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game } from "@/lib/game-service";
import type { GenerateGameCodeOutput } from "@/types/ai-sdk";

const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Game</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 500px;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
    .start-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    }
    .start-btn:hover {
      background: #5a6fd8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎮 Game Studio</h1>
    <p>Welcome to your game development workspace!</p>
    <p>Use the AI generator to create amazing games, or start coding your own masterpiece.</p>
    <button class="start-btn" onclick="alert('Let\\'s create something amazing!')">
      Start Creating
    </button>
  </div>
</body>
</html>`;

export default function GameEditor() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const isNewGame = gameId === "new";

  const [html, setHtml] = React.useState(defaultHtml);
  const [title, setTitle] = React.useState("New Game");
  const [currentGameId, setCurrentGameId] = React.useState<string | undefined>(
    isNewGame ? undefined : gameId
  );
  const [currentGame, setCurrentGame] = React.useState<Game | null>(null);
  // Loading state for fetching an existing game
  const [isLoading, setIsLoading] = React.useState<boolean>(!isNewGame);
  const [isGameGenerated, setIsGameGenerated] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { activeAddress } = useWallet();
  const loadGame = React.useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const walletAddress = activeAddress;
        const response = await fetch(`/api/games?wallet=${walletAddress}`);
        const result = await response.json();

        if (result.success) {
          const game = result.games.find((g: Game) => g.gameId === id);
          if (game && game.versions.length > 0) {
            const latestVersion = game.versions.at(-1);
            setHtml(latestVersion.html);
            setTitle(game.title);
            setIsGameGenerated(true);
            setCurrentGameId(game.gameId);
            setCurrentGame(game); // Store the full game data
          }
        }
      } catch {
        toast.error("Failed to load game");
      } finally {
        setIsLoading(false);
      }
    },
    [activeAddress]
  );

  React.useEffect(() => {
    if (!isNewGame) {
      loadGame(gameId);
    }
  }, [gameId, isNewGame, loadGame]);

  const handleGenerate = (output: GenerateGameCodeOutput) => {
    setHtml(output.html);
    setIsGameGenerated(true);
    toast.success("Game Generated!", {
      description: "Your new game has been created. Don't forget to save it!",
    });
  };

  // Helper to perform the save request and return the parsed result.
  const saveGameRequest = async (payload: {
    gameId?: string;
    html: string;
    title: string;
    description: string;
    tags: string[];
    walletAddress: string;
  }) => {
    const response = await fetch("/api/games/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  };

  const handleSave = async () => {
    if (!html.trim()) {
      toast.error("Cannot save empty game");
      return;
    }

    const walletAddress = activeAddress;
    if (!walletAddress) {
      toast.error("Wallet address not configured");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveGameRequest({
        gameId: currentGameId,
        html,
        title,
        description: `Generated game - ${new Date().toLocaleDateString()}`,
        tags: ["ai-generated", "canvas-forge"],
        walletAddress,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save");
      }

      if (currentGameId) {
        // Existing game was updated - reload the game data
        loadGame(currentGameId);
      } else {
        // New game was created
        setCurrentGameId(result.game.gameId);
        setCurrentGame(result.game); // Store the new game data
        // Update URL to reflect the new game ID
        router.replace(`/editor/${result.game.gameId}`);
      }

      toast.success("Game Saved Successfully!", {
        description:
          result.message ||
          "Your game has been saved and uploaded to IPFS permanently",
      });
    } catch (error) {
      toast.error("Failed to save game", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpublish = async (type: "marketplace") => {
    if (!currentGameId) {
      toast.error("Please save your game first");
      return;
    }

    try {
      const walletAddress = activeAddress;
      const response = await fetch("/api/games/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: currentGameId, type, walletAddress }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Unpublished successfully");
        loadGame(currentGameId);
      } else {
        throw new Error(result.error || "Failed to unpublish");
      }
    } catch {
      toast.error("Failed to unpublish");
    }
  };

  const handlePublishToMarketplace = async () => {
    if (!currentGameId) {
      toast.error("Please save your game first");
      return;
    }

    try {
      const walletAddress = activeAddress;
      const currentVersion = currentGame?.currentVersion || 1;

      const response = await fetch("/api/games/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: currentGameId,
          type: "marketplace",
          walletAddress,
          version: currentVersion,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Published to Marketplace!", {
          description: "Your game is now available for players to enjoy.",
        });
        // Reload game data to update publish status
        if (currentGameId) {
          loadGame(currentGameId);
        }
      } else {
        throw new Error(result.error || "Failed to publish");
      }
    } catch (error) {
      toast.error("Failed to publish to marketplace", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    }
  };

  const handleSellGame = async (price: number) => {
    if (!currentGameId) {
      toast.error("Please save your game first");
      return;
    }

    try {
      const walletAddress = activeAddress;
      const response = await fetch("/api/games/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: currentGameId,
          price,
          walletAddress,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Game listed for sale!", {
          description: `Your game is now available for purchase at ${price} ALGO.`,
        });
        // Reload game data to update sell status
        if (currentGameId) {
          loadGame(currentGameId);
        }
      } else {
        throw new Error(result.error || "Failed to list game for sale");
      }
    } catch (error) {
      toast.error("Failed to list game for sale", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
      throw error; // Re-throw to let the dialog handle it
    }
  };

  const handleRemoveFromSale = async () => {
    if (!currentGameId) {
      toast.error("Please save your game first");
      return;
    }

    try {
      const walletAddress = activeAddress;
      const response = await fetch("/api/games/remove-from-sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: currentGameId,
          walletAddress,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Game removed from sale!", {
          description: "Your game is no longer available for purchase.",
        });
        // Reload game data to update sell status
        if (currentGameId) {
          loadGame(currentGameId);
        }
      } else {
        throw new Error(result.error || "Failed to remove game from sale");
      }
    } catch (error) {
      toast.error("Failed to remove game from sale", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
      throw error; // Re-throw to let the dialog handle it
    }
  };

  const srcDoc = React.useMemo(() => {
    return html;
  }, [html]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-[#0a0a0a]">
      {/* Main Editor */}
      <div className="flex-1">
        <ResizablePanelGroup className="h-full" direction="horizontal">
          <ResizablePanel className="min-w-[300px]" defaultSize={30}>
            {isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-6 w-1/3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ) : (
              <CodeEditor
                language="html"
                onChange={(value) => setHtml(value || "")}
                value={html}
              />
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className="min-w-[300px]" defaultSize={70}>
            {/* Header above Preview */}
            <div className="border-border border-b">
              {isLoading ? (
                <div className="flex items-center justify-between p-4">
                  <Skeleton className="h-6 w-1/3" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ) : (
                <Header
                  currentGamePrice={currentGame?.salePrice}
                  gameId={currentGameId}
                  html={html}
                  isGameForSale={currentGame?.isForSale}
                  isGameGenerated={isGameGenerated}
                  isPublishedToMarketplace={
                    currentGame?.isPublishedToMarketplace
                  }
                  isSaving={isSaving}
                  onGenerate={handleGenerate}
                  onPublishMarketplace={handlePublishToMarketplace}
                  onRemoveFromSale={handleRemoveFromSale}
                  onSave={handleSave}
                  onSellGame={handleSellGame}
                  onTitleChange={(t) => setTitle(t)}
                  onUnpublish={handleUnpublish}
                  showPublishButtons={!!currentGameId}
                  showSellButton={
                    !!currentGameId &&
                    currentGame?.walletAddress === activeAddress
                  }
                  title={title}
                />
              )}
            </div>
            {isLoading ? (
              <div className="p-6">
                <Skeleton className="mb-4 h-8 w-full" />
                <Skeleton className="h-[480px] w-full" />
              </div>
            ) : (
              <Preview srcDoc={srcDoc} />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
