import { useWallet } from "@txnlab/use-wallet-react";
import { ExternalLink, Globe, Wallet } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ellipseAddress } from "../utils/ellipseAddress";
import { getAlgodConfigFromEnvironment } from "../utils/network/getAlgoClientConfigs";

const Account = () => {
  const { activeAddress } = useWallet();
  const algoConfig = getAlgodConfigFromEnvironment();

  const networkName = useMemo(() => {
    return algoConfig.network === ""
      ? "localnet"
      : algoConfig.network.toLocaleLowerCase();
  }, [algoConfig.network]);

  const networkColor = useMemo(() => {
    switch (networkName) {
      case "mainnet":
        return "bg-green-100 text-green-800 border-green-200";
      case "testnet":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "localnet":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, [networkName]);

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-700 text-sm">
              Connected Account
            </span>
          </div>
          <Badge className={`${networkColor} font-medium`}>
            <Globe className="mr-1 h-3 w-3" />
            {networkName}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <a
            className="flex items-center gap-1 font-mono text-blue-600 text-sm transition-colors hover:text-blue-800 hover:underline"
            href={`https://lora.algokit.io/${networkName}/account/${activeAddress}/`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {ellipseAddress(activeAddress)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default Account;
