"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import {
  ArrowLeft,
  CreditCard,
  Maximize2,
  Minimize2,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BuyGameDialog } from "@/components/ui/buy-game-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import QrShare from "@/components/ui/qr-share";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MIN_PLAY_DURATION,
  WALLET_ADDRESS_PREFIX_LENGTH,
  WALLET_ADDRESS_SUFFIX_LENGTH,
} from "@/lib/constants";
import type { Game } from "@/lib/game-service";

const IFRAME_LOAD_TIMEOUT_MS = 5000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGameHubMessage(data: unknown): data is GameHubMessage {
  if (!isRecord(data)) {
    return false;
  }
  const type = (data as Record<string, unknown>).type;
  return (
    (data as Record<string, unknown>).source === "gamehub" &&
    (type === "score" || type === "result" || type === "metrics")
  );
}

function formatDate(dateString: string | Date) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatWalletAddress(address: string) {
  return `${address.slice(0, WALLET_ADDRESS_PREFIX_LENGTH)}...${address.slice(
    -WALLET_ADDRESS_SUFFIX_LENGTH
  )}`;
}

function useHideGlobalHeader() {
  React.useEffect(() => {
    const header =
      typeof document !== "undefined"
        ? (document.querySelector("header") as HTMLElement | null)
        : null;
    if (header) {
      const prevDisplay = header.style.display;
      header.style.display = "none";
      return () => {
        header.style.display = prevDisplay || "";
      };
    }
  }, []);
}

function useGameHubMessages() {
  React.useEffect(() => {
    function handleGameHubMessage(msg: GameHubMessage) {
      switch (msg.type) {
        case "score":
          toast.success(`Score: ${msg.payload?.score ?? 0}`);
          return;
        case "result": {
          const { result, ...extras } = (msg.payload ?? {}) as Record<
            string,
            unknown
          > & {
            result?: unknown;
          };
          toast.message(`Result: ${String(result)}` as string, {
            description: Object.keys(extras).length
              ? JSON.stringify(extras)
              : undefined,
          });
          return;
        }
        case "metrics":
          toast("Game Metrics", {
            description: JSON.stringify(msg.payload ?? {}),
          });
          return;
        default:
          return;
      }
    }

    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (isGameHubMessage(data)) {
        handleGameHubMessage(data);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
}

function useFullscreen(ref: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const enter = React.useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    (el as Element).requestFullscreen?.();
  }, [ref]);

  const exit = React.useCallback(() => {
    document.exitFullscreen?.();
  }, []);

  React.useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  return { isFullscreen, enter, exit } as const;
}

function GameFrame(props: {
  gameUrl?: string;
  html?: string;
  title: string;
  onLoaded: () => void;
  onError: () => void;
}) {
  const { gameUrl, html, title, onLoaded, onError } = props;
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  React.useEffect(() => {
    const iframeEl = iframeRef.current;
    if (!iframeEl) {
      return;
    }

    // Simple timeout fallback - if no load event after timeout, assume it's loaded
    const timer = window.setTimeout(() => {
      onLoaded();
    }, IFRAME_LOAD_TIMEOUT_MS);

    function handleLoad() {
      window.clearTimeout(timer);
      onLoaded();
    }

    iframeEl.addEventListener("load", handleLoad);
    return () => {
      window.clearTimeout(timer);
      iframeEl.removeEventListener("load", handleLoad);
    };
  }, [onLoaded]);

  // Handle missing game content
  React.useEffect(() => {
    if (!(gameUrl || html)) {
      onError();
    }
  }, [gameUrl, html, onError]);

  // If no game URL or HTML, show error message
  if (!(gameUrl || html)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <p className="text-gray-500">Game not available</p>
      </div>
    );
  }

  if (gameUrl) {
    return (
      <iframe
        allowFullScreen
        className="h-full w-full border-0"
        ref={iframeRef}
        src={gameUrl}
        title={title}
      />
    );
  }

  if (html) {
    return (
      <iframe
        allowFullScreen
        className="h-full w-full border-0"
        ref={iframeRef}
        srcDoc={html}
        title={title}
      />
    );
  }

  return null;
}

type GameHubBaseMessage = {
  source: "gamehub";
};

type GameHubScoreMessage = GameHubBaseMessage & {
  type: "score";
  payload: { score: number } & Record<string, unknown>;
};

type GameHubResult = "win" | "lose" | "draw";
type GameHubResultMessage = GameHubBaseMessage & {
  type: "result";
  payload: { result: GameHubResult } & Record<string, unknown>;
};

type GameHubMetricsMessage = GameHubBaseMessage & {
  type: "metrics";
  payload: Record<string, unknown>;
};

type GameHubMessage =
  | GameHubScoreMessage
  | GameHubResultMessage
  | GameHubMetricsMessage;

export default function MarketplaceGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const mountedRef = React.useRef(true);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [game, setGame] = React.useState<Game | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [iframeLoading, setIframeLoading] = React.useState(true);
  const [shareUrl, setShareUrl] = React.useState("");
  const { activeAddress } = useWallet();
  const { isFullscreen, enter, exit } = useFullscreen(
    containerRef as React.RefObject<HTMLElement>
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/marketplace");
      const result = await response.json();

      if (result.success) {
        const foundGame = result.games.find((g: Game) => g.gameId === gameId);
        if (foundGame) {
          if (mountedRef.current) {
            setGame(foundGame);
          }
        } else {
          toast.error("Game not found");
          router.push("/marketplace");
        }
      }
    } catch {
      toast.error("Failed to load game");
      router.push("/marketplace");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [gameId, router]);

  React.useEffect(() => {
    load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  // Hide the global navbar/header while on the full-screen marketplace game page
  useHideGlobalHeader();

  // Initialize share URL on mount (avoid direct window usage in render)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  // Listen for analytics from embedded games
  useGameHubMessages();

  const [playStartTime, setPlayStartTime] = React.useState<number | null>(null);
  const [hasIncrementedPlay, setHasIncrementedPlay] = React.useState(false);

  const incrementPlayCount = React.useCallback(async () => {
    if (!game || hasIncrementedPlay || !playStartTime) {
      return;
    }

    const playDuration = Date.now() - playStartTime;

    // Only count plays that lasted at least 5 seconds
    if (playDuration < MIN_PLAY_DURATION) {
      return;
    }

    try {
      // Get game content hash for verification
      const latestVersion = game.versions.at(-1);
      const gameContentHash = latestVersion
        ? Buffer.from(latestVersion.html).toString("base64").slice(0, 16)
        : undefined;

      await fetch("/api/games/increment-play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: game.gameId,
          playDuration,
          gameContentHash,
        }),
      });

      setHasIncrementedPlay(true);
    } catch {
      // Silently fail - play count increment is not critical
    }
  }, [game, playStartTime, hasIncrementedPlay]);

  // Timer to increment play count after minimum duration
  React.useEffect(() => {
    if (!playStartTime || hasIncrementedPlay) {
      return;
    }

    const timer = setTimeout(() => {
      incrementPlayCount();
    }, MIN_PLAY_DURATION); // Wait 5 seconds before counting the play

    return () => clearTimeout(timer);
  }, [playStartTime, hasIncrementedPlay, incrementPlayCount]);

  const validatePurchaseRequest = () => {
    if (!game) {
      toast.error("Game not found");
      return false;
    }

    if (!activeAddress) {
      toast.error("Please connect your wallet to purchase games");
      return false;
    }

    if (game.walletAddress === activeAddress) {
      toast.error("You cannot buy your own game");
      return false;
    }

    if (!(game.isForSale && game.salePrice)) {
      toast.error("This game is not for sale");
      return false;
    }

    return true;
  };

  const handleBuyGame = async () => {
    if (!validatePurchaseRequest()) {
      return;
    }

    try {
      const response = await fetch("/api/games/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: game?.gameId ?? "",
          buyerAddress: activeAddress,
          price: game?.salePrice ?? 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Game purchased successfully!", {
          description: `You are now the owner of ${game?.title ?? "this game"}`,
        });
        // Reload the game data to update ownership
        load();
      } else {
        throw new Error(result.error || "Failed to purchase game");
      }
    } catch (error) {
      toast.error("Failed to purchase game", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
      throw error; // Re-throw to let the dialog handle it
    }
  };

  // const handleShare = () => {
  //   if (navigator.share && game) {
  //     navigator.share({
  //       title: game.title,
  //       text: `Check out this awesome game: ${game.title}`,
  //       url: window.location.href,
  //     });
  //   } else {
  //     navigator.clipboard.writeText(window.location.href);
  //     toast.success("Game link copied to clipboard!");
  //   }
  // };

  if (loading) {
    return (
      <div className="mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
          <Skeleton className="h-[80vh] w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto p-6">
        <div className="py-12 text-center">
          <Store className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-xl">Game not found</h3>
          <p className="mb-6 text-muted-foreground">
            The game you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/marketplace">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestVersion = game.versions.at(-1);

  // Use the same approach as community page for consistent behavior
  const getGameUrl = () => {
    if (latestVersion?.ipfsCid) {
      return `https://ipfs.io/ipfs/${latestVersion.ipfsCid}`;
    }
    if (latestVersion?.ipfsUrl) {
      return latestVersion.ipfsUrl;
    }
    return "";
  };

  const gameUrl = getGameUrl();

  return (
    <div className="h-screen min-h-screen w-screen bg-black">
      <div className="relative h-screen w-full" ref={containerRef}>
        {/* Full-viewport game iframe */}
        <GameFrame
          gameUrl={gameUrl}
          html={latestVersion?.html}
          onError={() => {
            setIframeLoading(false);
            toast.error("Failed to load game. Try reloading the page.");
          }}
          onLoaded={() => {
            setIframeLoading(false);
            // Start tracking play time when game loads
            setPlayStartTime(Date.now());
          }}
          title={game.title}
        />

        {/* Loading overlay for iframe */}
        {iframeLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-4xl p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 bg-white/10" />
                <Skeleton className="h-[60vh] w-full bg-white/10" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-24 bg-white/10" />
                  <Skeleton className="h-10 w-24 bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top-left overlay: back button + title */}
        <div className="absolute top-12 left-4 z-50 flex items-center gap-3">
          <Link href="/marketplace">
            <Button className="gap-2" size="sm" variant="outline">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg text-white">{game.title}</h1>
        </div>

        {/* Top-right overlay: avatar (popover) + share button */}
        <div className="absolute top-12 right-4 z-50 flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="p-0" variant="ghost">
                <Avatar>
                  {game.walletAddress ? (
                    <AvatarFallback className="text-xs">
                      {formatWalletAddress(game.walletAddress)}
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback />
                  )}
                </Avatar>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="text-sm">
                <div className="font-medium">Creator</div>
                <div className="mt-1 font-mono">
                  {formatWalletAddress(game.walletAddress)}
                </div>
                <div className="mt-2 text-muted-foreground">
                  Published:{" "}
                  {formatDate(game.marketplacePublishedAt || game.createdAt)}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            {shareUrl ? <QrShare url={shareUrl} /> : null}

            {/* Buy Game Button - only show if game is for sale and user is not the owner */}
            {game?.isForSale &&
              game?.salePrice &&
              game.walletAddress !== activeAddress && (
                <BuyGameDialog
                  gameId={game.gameId}
                  gameTitle={game.title}
                  onBuy={handleBuyGame}
                  price={game.salePrice}
                >
                  <Button
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    Buy {game.salePrice} ALGO
                  </Button>
                </BuyGameDialog>
              )}

            <Button
              className="gap-2"
              onClick={() => (isFullscreen ? exit() : enter())}
              size="sm"
              variant="secondary"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
