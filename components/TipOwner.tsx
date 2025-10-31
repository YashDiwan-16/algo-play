import { AlgorandClient, algo } from "@algorandfoundation/algokit-utils";
import { useWallet } from "@txnlab/use-wallet-react";
import { Heart, Loader2 } from "lucide-react";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAlgodConfigFromEnvironment } from "../utils/network/getAlgoClientConfigs";

const ADDRESS_PREFIX_LENGTH = 8;
const ADDRESS_SUFFIX_LENGTH = 8;

type TipOwnerInterface = {
  openModal: boolean;
  setModalState: (value: boolean) => void;
  ownerAddress: string;
  gameTitle?: string;
};

const TipOwner = ({
  openModal,
  setModalState,
  ownerAddress,
  gameTitle,
}: TipOwnerInterface) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [tipAmount, setTipAmount] = useState<string>("1");

  const algodConfig = getAlgodConfigFromEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });

  const { enqueueSnackbar } = useSnackbar();
  const { transactionSigner, activeAddress } = useWallet();

  const handleTipOwner = async () => {
    setLoading(true);

    if (!activeAddress) {
      enqueueSnackbar("Please connect wallet first", { variant: "warning" });
      setLoading(false);
      return;
    }

    if (activeAddress === ownerAddress) {
      enqueueSnackbar("You cannot tip yourself", { variant: "warning" });
      setLoading(false);
      return;
    }

    try {
      const amount = Number.parseFloat(tipAmount);
      if (Number.isNaN(amount) || amount <= 0) {
        enqueueSnackbar("Please enter a valid tip amount", {
          variant: "warning",
        });
        setLoading(false);
        return;
      }

      enqueueSnackbar("Sending tip...", { variant: "info" });
      const result = await algorand.send.payment({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: ownerAddress,
        amount: algo(amount),
      });
      enqueueSnackbar(
        `Tip sent successfully! Transaction: ${result.txIds[0]}`,
        {
          variant: "success",
        }
      );
      setTipAmount("1");
      setModalState(false);
    } catch {
      enqueueSnackbar("Failed to send tip", { variant: "error" });
    }

    setLoading(false);
  };

  const isValidAmount =
    !Number.isNaN(Number.parseFloat(tipAmount)) &&
    Number.parseFloat(tipAmount) > 0;

  return (
    <Dialog onOpenChange={setModalState} open={openModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Tip the Creator
          </DialogTitle>
          <DialogDescription>
            {gameTitle
              ? `Show appreciation for "${gameTitle}" by tipping the creator`
              : "Show appreciation for this community contribution by tipping the creator"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tip-amount">Tip Amount (ALGO)</Label>
            <Input
              className={`${
                tipAmount && !isValidAmount
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-pink-500"
              }`}
              data-test-id="tip-amount"
              id="tip-amount"
              min="0.1"
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="Enter tip amount"
              step="0.1"
              type="number"
              value={tipAmount}
            />
            {tipAmount && !isValidAmount && (
              <p className="text-red-600 text-sm">
                Please enter a valid amount greater than 0
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-muted-foreground text-sm">
              <strong>Recipient:</strong>{" "}
              {ownerAddress.slice(0, ADDRESS_PREFIX_LENGTH)}...
              {ownerAddress.slice(-ADDRESS_SUFFIX_LENGTH)}
            </p>
            <p className="text-muted-foreground text-sm">
              <strong>Amount:</strong> {tipAmount} ALGO
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={() => setModalState(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              data-test-id="send-tip"
              disabled={!isValidAmount || loading}
              onClick={handleTipOwner}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Send Tip
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipOwner;
