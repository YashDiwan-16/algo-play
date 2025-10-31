"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import { Code, ExternalLink, Send, Wallet } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AppCalls from "./AppCalls";
import ConnectWallet from "./ConnectWallet";
import Transact from "./Transact";

const Home: React.FC = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false);
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false);
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false);
  const { activeAddress } = useWallet();

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal);
  };

  const toggleDemoModal = () => {
    setOpenDemoModal(!openDemoModal);
  };

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md border-0 bg-white/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-2xl text-white">
            A
          </div>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-3xl text-transparent">
            Welcome to AlgoKit
          </CardTitle>
          <CardDescription className="text-gray-600 leading-relaxed">
            This starter has been generated using the official AlgoKit Nextjs 15
            template. Get started building on Algorand!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:from-blue-600 hover:to-purple-700"
            data-test-id="getting-started"
          >
            <a
              href="https://github.com/algorandfoundation/algokit-cli"
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Getting Started
            </a>
          </Button>

          <Separator className="my-6" />

          <div className="space-y-3">
            <Button
              className="w-full border-blue-200 hover:border-blue-300 hover:bg-blue-50"
              data-test-id="connect-wallet"
              onClick={toggleWalletModal}
              variant="outline"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Wallet Connection
            </Button>

            {activeAddress && (
              <Button
                className="w-full border-green-200 hover:border-green-300 hover:bg-green-50"
                data-test-id="transactions-demo"
                onClick={toggleDemoModal}
                variant="outline"
              >
                <Send className="mr-2 h-4 w-4" />
                Transactions Demo
              </Button>
            )}

            {activeAddress && (
              <Button
                className="w-full border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                data-test-id="appcalls-demo"
                onClick={toggleAppCallsModal}
                variant="outline"
              >
                <Code className="mr-2 h-4 w-4" />
                Contract Interactions
              </Button>
            )}
          </div>

          <ConnectWallet
            closeModal={toggleWalletModal}
            openModal={openWalletModal}
          />
          <Transact
            openModal={openDemoModal}
            setModalState={setOpenDemoModal}
          />
          <AppCalls
            openModal={appCallsDemoModal}
            setModalState={setAppCallsDemoModal}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
