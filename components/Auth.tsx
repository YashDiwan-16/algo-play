"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import { type ReactNode, useState } from "react";
import ConnectWallet from "@/components/ConnectWallet";
import { Button } from "@/components/ui/button";

type AuthProps = {
  children: ReactNode;
};

const Auth = ({ children }: AuthProps) => {
  const { activeAddress } = useWallet();
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  if (activeAddress) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h2 className="font-semibold text-2xl">Wallet not connected</h2>
        <p className="text-muted-foreground">
          Please connect your wallet to continue.
        </p>
      </div>
      <Button onClick={() => setIsConnectOpen(true)} size="lg">
        Connect Wallet
      </Button>
      <ConnectWallet
        closeModal={() => setIsConnectOpen(false)}
        openModal={isConnectOpen}
      />
    </div>
  );
};

export default Auth;
