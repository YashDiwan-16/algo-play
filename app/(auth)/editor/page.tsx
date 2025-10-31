"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import { Code, Plus, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GameCard } from "@/components/ui/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game } from "@/lib/game-service";

// Skeleton component for game cards
const EditorGameCardSkeleton = () => (
  <div className="group relative">
    <div className="-inset-0.5 absolute rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-20" />

    <div className="relative transform-gpu overflow-hidden rounded-xl border-0 p-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      <div className="overflow-hidden border-0 bg-gradient-to-br from-slate-50/50 to-white p-0 shadow-lg backdrop-blur-sm dark:from-slate-900/50 dark:to-slate-800">
        {/* Banner skeleton */}
        <div className="relative overflow-hidden">
          <div className="relative flex h-32 items-center bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
            <div className="relative w-full px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags skeleton */}
        <div className="bg-gradient-to-r from-slate-50/50 to-transparent px-6 py-4 dark:from-slate-800/50">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="flex flex-col space-y-1" key={`stat-${index}`}>
                <Skeleton className="h-3 w-16" />
                <div className="flex items-center gap-2 rounded-lg bg-slate-100/50 p-2 dark:bg-slate-800/50">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="border-slate-200/50 border-t bg-gradient-to-r from-slate-50/30 to-transparent dark:border-slate-700/50 dark:from-slate-800/30">
          <div className="flex gap-3 px-6 py-4">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function EditorDashboard() {
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedGameToDelete, setSelectedGameToDelete] = React.useState<
    string | null
  >(null);
  const [deleting, setDeleting] = React.useState(false);
  const { activeAddress } = useWallet();

  const loadGames = React.useCallback(async () => {
    try {
      const walletAddress = activeAddress;
      const response = await fetch(`/api/games?wallet=${walletAddress}`);
      const result = await response.json();
      if (result.success) {
        setGames(result.games);
      } else {
        toast.error("Failed to load games");
      }
    } catch {
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  }, [activeAddress]);

  React.useEffect(() => {
    loadGames();
  }, [loadGames]);

  const openDeleteDialog = (gameId: string) => {
    setSelectedGameToDelete(gameId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedGameToDelete(null);
  };

  const performDelete = async (gameId: string | null) => {
    if (!gameId) {
      return;
    }
    setDeleting(true);
    try {
      const walletAddress = activeAddress;
      if (!walletAddress) {
        toast.error("Wallet address not configured");
        return;
      }

      const res = await fetch("/api/games/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, walletAddress }),
      });

      const result = await res.json();
      if (!(res.ok && result.success)) {
        throw new Error(result.error || "Failed to delete game");
      }

      toast.success("Game deleted successfully");
      setGames((prev) => prev.filter((game) => game.gameId !== gameId));
      closeDeleteDialog();

      // Note: if the user is currently editing this game, a redirect could be performed here.
    } catch {
      toast.error("Failed to delete game");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto space-y-8 p-6">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-8 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-indigo-950/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-10 w-48" />
              </div>
              <Skeleton className="h-6 w-80" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>

        {/* Games Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <EditorGameCardSkeleton key={`editor-skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-8 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-indigo-950/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-3 font-bold text-4xl tracking-tight">
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 p-2">
                  <Code className="h-8 w-8 text-white" />
                </div>
                Game Studio
              </h1>
              <p className="text-lg text-muted-foreground">
                Create, manage, and publish your games
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-sm dark:bg-black/20">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{games.length} Games</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-sm dark:bg-black/20">
                  <Code className="h-4 w-4 text-violet-500" />
                  <span className="font-medium">Your Creations</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/marketplace">
                <Button
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  variant="outline"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Marketplace
                </Button>
              </Link>
              <Link href="/editor/new">
                <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Plus className="h-4 w-4" />
                  New Game
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 p-12 text-center dark:from-slate-900 dark:to-gray-800">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative">
              <div className="mx-auto mb-6 w-fit rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 p-4">
                <Code className="h-16 w-16 text-white" />
              </div>
              <h3 className="mb-3 font-bold text-2xl">No games yet</h3>
              <p className="mb-8 text-lg text-muted-foreground">
                Create your first game to get started on your journey as a game
                developer!
              </p>
              <Link href="/editor/new">
                <Button className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-lg hover:from-violet-700 hover:to-indigo-700">
                  <Plus className="h-5 w-5" />
                  Create First Game
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <GameCard
                game={game}
                key={game.gameId}
                onDelete={openDeleteDialog}
                variant="editor"
              />
            ))}
          </div>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
          setDeleteDialogOpen(open);
        }}
        open={deleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete game?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to permanently
              delete this game?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={deleting}
              onClick={() => performDelete(selectedGameToDelete)}
              variant="destructive"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
