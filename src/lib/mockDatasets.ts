import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { parseTrades, ParseTradesResult } from "./csv";

export type MockDataset = {
  id: string;
  label: string;
  description: string;
  asset: number;
};

export const MOCK_DATASETS: MockDataset[] = [
  {
    id: "calm_trader",
    label: "Calm Trader",
    description: "Lower trade frequency, steadier behavior patterns.",
    asset: require("../../trading_datasets/calm_trader.csv"),
  },
  {
    id: "loss_averse_trader",
    label: "Loss Averse",
    description: "Holds losers longer and cuts winners early.",
    asset: require("../../trading_datasets/loss_averse_trader.csv"),
  },
  {
    id: "overtrader",
    label: "Overtrader",
    description: "High frequency, short gaps between trades.",
    asset: require("../../trading_datasets/overtrader.csv"),
  },
  {
    id: "revenge_trader",
    label: "Revenge Trader",
    description: "Bursts of trades after losses.",
    asset: require("../../trading_datasets/revenge_trader.csv"),
  },
];

export async function loadMockDataset(id: string): Promise<ParseTradesResult> {
  const dataset = MOCK_DATASETS.find((d) => d.id === id);
  if (!dataset) {
    throw new Error(`Unknown mock dataset: ${id}`);
  }

  const asset = Asset.fromModule(dataset.asset);
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  const csvString = await FileSystem.readAsStringAsync(uri);
  return parseTrades(csvString, { allowLegacy: true });
}
