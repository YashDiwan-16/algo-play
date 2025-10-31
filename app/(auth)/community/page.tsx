"use client";

import {
  Calendar,
  Code,
  Eye,
  GitFork,
  Heart,
  Search,
  Star,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import TipOwner from "@/components/TipOwner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MAX_TAGS_DISPLAY,
  PAGE_SIZE,
  WALLET_ADDRESS_PREFIX_LENGTH,
  WALLET_ADDRESS_SUFFIX_LENGTH,
} from "@/lib/constants";
import type { Game } from "@/lib/game-service";

// Skeleton component for game cards
const GameCardSkeleton = () => (
  <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg dark:from-gray-900 dark:to-gray-800">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

    <CardHeader className="relative pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </CardHeader>

    <CardContent className="relative space-y-4">
      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

export default function CommunityPage() {
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [tipModalOpen, setTipModalOpen] = React.useState(false);
  const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);

  const loadCommunityGames = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/community?${params}`);
      const result = await response.json();

      if (result.success) {
        setGames(result.games);
      } else {
        toast.error("Failed to load community games");
      }
    } catch {
      toast.error("Failed to load community games");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  React.useEffect(() => {
    loadCommunityGames();
  }, [loadCommunityGames]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatWalletAddress = (address: string) => {
    // If the address is shorter than the combined prefix/suffix, return it as-is
    if (
      address.length <=
      WALLET_ADDRESS_PREFIX_LENGTH + WALLET_ADDRESS_SUFFIX_LENGTH
    ) {
      return address;
    }
    return `${address.slice(0, WALLET_ADDRESS_PREFIX_LENGTH)}...${address.slice(
      -WALLET_ADDRESS_SUFFIX_LENGTH
    )}`;
  };

  const handleTipClick = (game: Game) => {
    setSelectedGame(game);
    setTipModalOpen(true);
  };

  if (loading) {
    return (
      <div className="mx-auto space-y-8 p-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-10 w-64" />
              </div>
              <Skeleton className="h-6 w-96" />
              <div className="flex items-center gap-4 pt-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="flex items-center justify-center">
          <div className="flex w-full max-w-lg gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Games Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <GameCardSkeleton key={`game-skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="flex items-center gap-3 font-bold text-4xl tracking-tight">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-2">
                <Users className="h-8 w-8 text-white" />
              </div>
              Game Community
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore, fork, and improve games created by developers worldwide
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-sm dark:bg-black/20">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{games.length} Games</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-sm dark:bg-black/20">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="font-medium">Community Driven</span>
              </div>
            </div>
          </div>
          <Link href="/editor">
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Star className="h-4 w-4" />
              Share Your Creation
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-center">
        <form className="flex w-full max-w-lg gap-2" onSubmit={handleSearch}>
          <div className="relative flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pr-4 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search community games..."
              type="text"
              value={searchQuery}
            />
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="icon"
            type="submit"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-xl">
            No community games found
          </h3>
          <p className="mb-6 text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Be the first to share a game with the community!"}
          </p>
          <Link href="/editor">
            <Button className="gap-2">Share First Game</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <Card
              className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl dark:from-gray-900 dark:to-gray-800"
              key={game.gameId}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <CardHeader className="relative pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <CardTitle className="line-clamp-1 font-bold text-lg transition-colors group-hover:text-blue-600">
                      {game.title}
                      {game.originalGameId && (
                        <Badge
                          className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          variant="default"
                        >
                          <GitFork className="mr-1 h-3 w-3" />
                          Fork
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-muted-foreground text-sm">
                      {game.description || "No description provided"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-4">
                {/* Tags */}
                {game.tags && game.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {game.tags.slice(0, MAX_TAGS_DISPLAY).map((tag) => (
                      <Badge
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300"
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {game.tags.length > MAX_TAGS_DISPLAY && (
                      <Badge className="text-xs" variant="secondary">
                        +{game.tags.length - MAX_TAGS_DISPLAY}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate">
                      {formatWalletAddress(game.walletAddress)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="h-3 w-3" />
                    {game.forkCount} forks
                  </div>
                  <div className="flex items-center gap-1">
                    <Code className="h-3 w-3" />v{game.currentVersion}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(game.communityPublishedAt || game.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link className="flex-1" href={`/community/${game.gameId}`}>
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="sm"
                      variant="default"
                    >
                      <Eye className="h-3 w-3" />
                      View & Fork
                    </Button>
                  </Link>
                  <Button
                    className="gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    onClick={() => handleTipClick(game)}
                    size="sm"
                    variant="default"
                  >
                    <Heart className="h-3 w-3" />
                    Tip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {games.length === PAGE_SIZE && (
        <div className="flex justify-center gap-2 pt-6">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            variant="outline"
          >
            Previous
          </Button>
          <Button onClick={() => setPage((p) => p + 1)} variant="outline">
            Next
          </Button>
        </div>
      )}

      {/* Tip Modal */}
      {selectedGame && (
        <TipOwner
          gameTitle={selectedGame.title}
          openModal={tipModalOpen}
          ownerAddress={selectedGame.walletAddress}
          setModalState={setTipModalOpen}
        />
      )}
    </div>
  );
}
