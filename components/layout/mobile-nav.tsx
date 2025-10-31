"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = {
  title: string;
  href: string;
};

type MobileNavProps = {
  navItems: NavItem[];
};

export function MobileNav({ navItems }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button className="px-0 md:hidden" size="icon" variant="ghost">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[280px] border-l px-6 py-8 focus:outline-none sm:w-[350px]"
        side="right"
      >
        <div className="flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between border-b pb-6">
            <DialogTitle>Portfolio</DialogTitle>
            <DialogDescription />
          </div>
          <nav className="flex flex-col gap-5">
            {navItems.map((item) => (
              <Link
                className="font-medium text-foreground/70 text-lg transition-colors duration-200 hover:translate-x-1 hover:text-foreground"
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
