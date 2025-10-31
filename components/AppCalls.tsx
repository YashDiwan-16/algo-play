"use client";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import {
  OnSchemaBreak,
  OnUpdate,
} from "@algorandfoundation/algokit-utils/types/app";
import { useWallet } from "@txnlab/use-wallet-react";
import { Code, Loader2, Sparkles } from "lucide-react";
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
import { HelloWorldFactory } from "../contracts/hello_world";
import {
  getAlgodConfigFromEnvironment,
  getIndexerConfigFromEnvironment,
} from "../utils/network/getAlgoClientConfigs";

type AppCallsInterface = {
  openModal: boolean;
  setModalState: (value: boolean) => void;
};

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [contractInput, setContractInput] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();
  const { transactionSigner, activeAddress } = useWallet();

  const algodConfig = getAlgodConfigFromEnvironment();
  const indexerConfig = getIndexerConfigFromEnvironment();
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  });
  algorand.setDefaultSigner(transactionSigner);

  const sendAppCall = async () => {
    setLoading(true);

    // Please note, in typical production scenarios,
    // you wouldn't want to use deploy directly from your frontend.
    // Instead, you would deploy your contract on your backend and reference it by id.
    // Given the simplicity of the starter contract, we are deploying it on the frontend
    // for demonstration purposes.
    const factory = new HelloWorldFactory({
      defaultSender: activeAddress ?? undefined,
      algorand,
    });
    const deployResult = await factory
      .deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })
      .catch((error: Error) => {
        enqueueSnackbar(`Error deploying the contract: ${error.message}`, {
          variant: "error",
        });
        setLoading(false);
        return;
      });

    if (!deployResult) {
      return;
    }

    const { appClient } = deployResult;

    const response = await appClient.send
      .hello({ args: { name: contractInput } })
      .catch((error: Error) => {
        enqueueSnackbar(`Error calling the contract: ${error.message}`, {
          variant: "error",
        });
        setLoading(false);
        return;
      });

    if (!response) {
      return;
    }

    enqueueSnackbar(`Response from the contract: ${response.return}`, {
      variant: "success",
    });
    setContractInput("");
    setLoading(false);
  };

  return (
    <Dialog onOpenChange={setModalState} open={openModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Smart Contract Interaction
          </DialogTitle>
          <DialogDescription>
            Say hello to your Algorand smart contract! This will deploy and
            interact with a simple contract.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-input">Message for Hello Function</Label>
            <Input
              className="border-gray-200 focus:border-purple-500"
              id="contract-input"
              onChange={(e) => setContractInput(e.target.value)}
              placeholder="Enter your name or message"
              value={contractInput}
            />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This will deploy a new contract instance
              for demonstration purposes. In production, contracts are typically
              deployed once and referenced by ID.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={() => setModalState(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={!contractInput.trim() || loading}
              onClick={sendAppCall}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Send Contract Call
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppCalls;
