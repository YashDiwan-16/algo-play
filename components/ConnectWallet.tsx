import { useWallet, type Wallet, WalletId } from "@txnlab/use-wallet-react";
import { LogOut, Wallet as WalletIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Account from "./Account";

type ConnectWalletInterface = {
  openModal: boolean;
  closeModal: () => void;
};

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet();

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD;

  return (
    <Dialog onOpenChange={closeModal} open={openModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            Select Wallet Provider
          </DialogTitle>
          <DialogDescription>
            Choose your preferred wallet to connect to the Algorand network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {activeAddress && (
            <div className="space-y-4">
              <Account />
              <Separator />
            </div>
          )}

          {!activeAddress && (
            <div className="space-y-2">
              {wallets?.map((wallet) => (
                <Button
                  className="h-12 w-full justify-start border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  data-test-id={`${wallet.id}-connect`}
                  key={`provider-${wallet.id}`}
                  onClick={() => wallet.connect()}
                  variant="outline"
                >
                  {!isKmd(wallet) && (
                    <Image
                      alt={`${wallet.metadata.name} icon`}
                      className="mr-3 object-contain"
                      height={24}
                      src={wallet.metadata.icon}
                      width={24}
                    />
                  )}
                  {isKmd(wallet) && <WalletIcon className="mr-3 h-6 w-6" />}
                  <span className="font-medium">
                    {isKmd(wallet) ? "LocalNet Wallet" : wallet.metadata.name}
                  </span>
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              data-test-id="close-wallet-modal"
              onClick={closeModal}
              variant="outline"
            >
              Close
            </Button>
            {activeAddress && (
              <Button
                className="flex-1"
                data-test-id="logout"
                onClick={async () => {
                  if (wallets.length > 0) {
                    const activeWallet = wallets.find((w) => w.isActive);
                    if (activeWallet) {
                      await activeWallet.disconnect();
                    } else {
                      // Required for logout/cleanup of inactive providers
                      localStorage.removeItem("@txnlab/use-wallet:v3");
                      window.location.reload();
                    }
                  }
                }}
                variant="destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default ConnectWallet;
