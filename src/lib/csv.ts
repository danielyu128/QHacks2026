import Papa from "papaparse";
import { Trade } from "./types";

type RawRow = {
  timestamp?: string;
  side?: string;
  asset?: string;
  pnl?: string;
  qty?: string;
  position_size?: string;
  hold_minutes?: string;
};

/**
 * Parse a CSV string into validated Trade[].
 * Required columns: timestamp, side, asset, pnl
 * Optional: qty, position_size, hold_minutes
 */
export function parseTrades(csvString: string): Trade[] {
  const result = Papa.parse<RawRow>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (result.errors.length > 0) {
    const errorMsgs = result.errors.slice(0, 3).map((e) => e.message).join("; ");
    throw new Error(`CSV parse errors: ${errorMsgs}`);
  }

  const trades: Trade[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];

    // Validate required fields
    if (!row.timestamp || !row.side || !row.asset || row.pnl === undefined) {
      throw new Error(
        `Row ${i + 1} missing required field(s). Required: timestamp, side, asset, pnl`
      );
    }

    const ts = new Date(row.timestamp).getTime();
    if (isNaN(ts)) {
      throw new Error(`Row ${i + 1}: invalid timestamp "${row.timestamp}"`);
    }

    const side = row.side.toUpperCase().trim();
    if (side !== "BUY" && side !== "SELL") {
      throw new Error(`Row ${i + 1}: side must be BUY or SELL, got "${row.side}"`);
    }

    const pnl = parseFloat(row.pnl);
    if (isNaN(pnl)) {
      throw new Error(`Row ${i + 1}: pnl must be a number, got "${row.pnl}"`);
    }

    const trade: Trade = {
      timestamp: ts,
      side: side as "BUY" | "SELL",
      asset: row.asset.trim(),
      pnl,
    };

    if (row.qty) {
      const qty = parseFloat(row.qty);
      if (!isNaN(qty)) trade.qty = qty;
    }

    if (row.position_size) {
      const ps = parseFloat(row.position_size);
      if (!isNaN(ps)) trade.positionSize = ps;
    }

    if (row.hold_minutes) {
      const hm = parseFloat(row.hold_minutes);
      if (!isNaN(hm)) trade.holdMinutes = hm;
    }

    trades.push(trade);
  }

  // Sort by timestamp ascending
  trades.sort((a, b) => a.timestamp - b.timestamp);

  return trades;
}
