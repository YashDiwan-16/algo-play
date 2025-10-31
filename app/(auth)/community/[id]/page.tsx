"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import {
  ArrowLeft,
  Calendar,
  Code,
  ExternalLink,
  GitFork,
  Heart,
  Maximize,
  Play,
  Star,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import TipOwner from "@/components/TipOwner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QrShare from "@/components/ui/qr-share";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WALLET_ADDRESS_PREFIX_LENGTH,
  WALLET_ADDRESS_SUFFIX_LENGTH,
} from "@/lib/constants";
import type { Game } from "@/lib/game-service";

type CommunityGamePageProps = {
  params: {
    id: string;
  };
};

export default function CommunityGamePage({ params }: CommunityGamePageProps) {
  // Next.js may provide params as a Promise in newer versions.
  // Use React.use() to unwrap params before accessing properties to be future-proof.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resolvedParams: { id: string } =
    params instanceof Promise ? React.use(params) : params;
  const { activeAddress } = useWallet();
  const [game, setGame] = React.useState<Game | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forking, setForking] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [tipModalOpen, setTipModalOpen] = React.useState(false);
  const router = useRouter();

  const loadGame = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/community/${resolvedParams.id}`);
      const result = await response.json();

      if (result.success && result.game) {
        setGame(result.game);
      } else {
        toast.error("Game not found");
        router.push("/community");
      }
    } catch {
      toast.error("Failed to load game");
      router.push("/community");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, router]);

  React.useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handleFork = async () => {
    try {
      setForking(true);
      const response = await fetch("/api/games/fork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalGameId: resolvedParams.id,
          walletAddress: activeAddress,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Game forked successfully!");
        router.push(`/editor/${result.game.gameId}`);
      } else {
        toast.error(result.error || "Failed to fork game");
      }
    } catch {
      toast.error("Failed to fork game");
    } finally {
      setForking(false);
    }
  };

  // const handleShare = async () => {
  //   try {
  //     await navigator.clipboard.writeText(window.location.href);
  //     toast.success("Game link copied to clipboard!");
  //   } catch {
  //     toast.error("Failed to copy link");
  //   }
  // };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, WALLET_ADDRESS_PREFIX_LENGTH)}...${address.slice(-WALLET_ADDRESS_SUFFIX_LENGTH)}`;
  };

  const getGameUrl = () => {
    if (game?.versions?.[game.currentVersion - 1]?.ipfsCid) {
      return `https://ipfs.io/ipfs/${game.versions[game.currentVersion - 1].ipfsCid}`;
    }
    return "";
  };

  const handleTipClick = () => {
    setTipModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto space-y-8 p-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="mb-2 h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content Skeleton */}
          <div className="space-y-6 lg:col-span-2">
            {/* Game Player Skeleton */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-4 text-center">
                      <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Game Info Skeleton */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tags skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-12" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>

                <Separator />

                {/* Stats skeleton */}
                <div className="space-y-4 text-sm">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                      key={`stat-skeleton-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Actions skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Fork Info Skeleton */}
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center gap-4">
          <Link href="/community">
            <Button
              className="bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40"
              size="icon"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                Community Game
              </h1>
              <p className="text-muted-foreground">
                Explore and interact with community creations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Game Player */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Play className="h-5 w-5 text-blue-600" />
                  Game Preview
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    className="bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40"
                    onClick={() => setIsFullscreen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                {getGameUrl() ? (
                  <iframe
                    className="h-full w-full border-0"
                    src={getGameUrl()}
                    title={game.title}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4">
                        <Play className="h-16 w-16 text-white" />
                      </div>
                      <p className="font-medium text-lg text-muted-foreground">
                        Game not available
                      </p>
                      <p className="text-muted-foreground text-sm">
                        The game content could not be loaded
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Game Info */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="h-5 w-5 text-yellow-500" />
                {game.title}
                {game.originalGameId && (
                  <Badge
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    variant="default"
                  >
                    <GitFork className="mr-1 h-3 w-3" />
                    Fork
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tags */}
              {game.tags && game.tags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-muted-foreground text-sm">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((tag) => (
                      <Badge
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300"
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Stats */}
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Creator
                  </span>
                  <span className="font-mono text-sm">
                    {formatWalletAddress(game.walletAddress)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Code className="h-4 w-4" />
                    Version
                  </span>
                  <span className="font-semibold">v{game.currentVersion}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <GitFork className="h-4 w-4" />
                    Forks
                  </span>
                  <span className="font-semibold">{game.forkCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Published
                  </span>
                  <span className="font-semibold">
                    {formatDate(game.communityPublishedAt || game.createdAt)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={forking}
                  onClick={handleFork}
                >
                  <GitFork className="h-4 w-4" />
                  {forking ? "Forking..." : "Fork & Edit"}
                </Button>
                <Button
                  className="w-full gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  onClick={handleTipClick}
                >
                  <Heart className="h-4 w-4" />
                  Tip Creator
                </Button>
                <QrShare url={window.location.href} />
              </div>
            </CardContent>
          </Card>

          {/* Fork Info */}
          {game.originalGameId && (
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <GitFork className="h-4 w-4 text-green-600" />
                  Fork Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">
                  <p className="mb-3">
                    This is a fork of another community game.
                  </p>
                  <Link
                    className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 text-white hover:from-green-600 hover:to-emerald-600"
                    href={`/community/${game.originalGameId}`}
                  >
                    View original <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="relative h-full w-full">
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={() => setIsFullscreen(false)}
                size="sm"
                variant="secondary"
              >
                Exit Fullscreen
              </Button>
            </div>
            {getGameUrl() && (
              <iframe
                className="h-full w-full border-0"
                src={getGameUrl()}
                title={`${game.title} - Fullscreen`}
              />
            )}
          </div>
        </div>
      )}

      {/* Tip Modal */}
      <TipOwner
        gameTitle={game.title}
        openModal={tipModalOpen}
        ownerAddress={game.walletAddress}
        setModalState={setTipModalOpen}
      />
    </div>
  );
}
