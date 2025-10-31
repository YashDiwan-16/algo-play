"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import { Copy, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ConnectWallet from "@/components/ConnectWallet";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ellipseAddress } from "@/utils/ellipseAddress";

// Navigation items

export function Navbar({
  navItems,
}: {
  navItems: { title: string; href: string }[];
}) {
  const COPY_RESET_MS = 1200;
  const [openWalletModal, setOpenWalletModal] = useState(false);
  const { activeAddress, wallets } = useWallet();
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!isCopying) {
      return;
    }
    const timer = setTimeout(() => setIsCopying(false), COPY_RESET_MS);
    return () => clearTimeout(timer);
  }, [isCopying]);

  const handleCopyAddress = async () => {
    if (!activeAddress) {
      return;
    }
    try {
      await navigator.clipboard.writeText(activeAddress);
      setIsCopying(true);
    } catch {
      // noop
    }
  };

  const handleLogout = async () => {
    if (wallets.length > 0) {
      const activeWallet = wallets.find((w) => w.isActive);
      if (activeWallet) {
        await activeWallet.disconnect();
        return;
      }
    }
    localStorage.removeItem("@txnlab/use-wallet:v3");
    window.location.reload();
  };
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 md:px-8 lg:px-12">
      <div className="flex h-16 items-center justify-between">
        {/* Logo - Left */}
        <div className="flex items-center">
          <Link className="items-center space-x-2 md:flex" href="/">
            <Image
              alt="Algo Game Hub Logo"
              className="hidden h-8 w-8 md:inline"
              height={40}
              src="/logo.png"
              width={40}
            />
            <span className="inline-block font-bold font-mono">
              Algo Game Hub
            </span>
          </Link>
        </div>

        {/* Desktop navigation - Center */}
        <nav className="hidden justify-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              className="flex items-center font-medium text-lg transition-colors hover:text-foreground/80 sm:text-sm"
              href={item.href}
              key={item.href}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-2">
          {/* Desktop: Wallet controls */}
          <div className="hidden md:flex">
            {!activeAddress && (
              <Button
                onClick={() => setOpenWalletModal(true)}
                variant="default"
              >
                Connect Wallet
              </Button>
            )}
            {activeAddress && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="font-mono" variant="outline">
                    {ellipseAddress(activeAddress)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuItem onClick={handleCopyAddress}>
                    <Copy className="h-4 w-4" />
                    {isCopying ? "Copied" : "Copy address"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {/* Mobile: Menu */}
          <div className="md:hidden">
            <MobileNav navItems={navItems} />
          </div>
        </div>
      </div>
      <ConnectWallet
        closeModal={() => setOpenWalletModal(false)}
        openModal={openWalletModal}
      />
    </header>
  );
}
