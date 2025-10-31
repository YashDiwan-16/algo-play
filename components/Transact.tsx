import { AlgorandClient, algo } from "@algorandfoundation/algokit-utils";
import { useWallet } from "@txnlab/use-wallet-react";
import { Loader2, Send } from "lucide-react";
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
import { ALGORAND_ADDRESS_LENGTH } from "@/lib/constants";
import { getAlgodConfigFromEnvironment } from "../utils/network/getAlgoClientConfigs";

type TransactInterface = {
  openModal: boolean;
  setModalState: (value: boolean) => void;
};

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [receiverAddress, setReceiverAddress] = useState<string>("");

  const algodConfig = getAlgodConfigFromEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });

  const { enqueueSnackbar } = useSnackbar();
  const { transactionSigner, activeAddress } = useWallet();

  const handleSubmitAlgo = async () => {
    setLoading(true);

    if (!activeAddress) {
      enqueueSnackbar("Please connect wallet first", { variant: "warning" });
      setLoading(false);
      return;
    }

    try {
      enqueueSnackbar("Sending transaction...", { variant: "info" });
      const result = await algorand.send.payment({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: receiverAddress,
        amount: algo(1),
      });
      enqueueSnackbar(`Transaction sent: ${result.txIds[0]}`, {
        variant: "success",
      });
      setReceiverAddress("");
      setModalState(false);
    } catch {
      enqueueSnackbar("Failed to send transaction", { variant: "error" });
    }

    setLoading(false);
  };

  const isValidAddress = receiverAddress.length === ALGORAND_ADDRESS_LENGTH;

  return (
    <Dialog onOpenChange={setModalState} open={openModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Payment Transaction
          </DialogTitle>
          <DialogDescription>
            Send 1 ALGO to another wallet address on the Algorand network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receiver-address">Recipient Address</Label>
            <Input
              className={`${
                receiverAddress && !isValidAddress
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-blue-500"
              }`}
              data-test-id="receiver-address"
              id="receiver-address"
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="Enter 58-character wallet address"
              value={receiverAddress}
            />
            {receiverAddress && !isValidAddress && (
              <p className="text-red-600 text-sm">
                Address must be exactly 58 characters long
              </p>
            )}
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
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-test-id="send-algo"
              disabled={!isValidAddress || loading}
              onClick={handleSubmitAlgo}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send 1 ALGO
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Transact;
