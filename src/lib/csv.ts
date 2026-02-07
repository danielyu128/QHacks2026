import Papa from "papaparse";
import { Trade } from "./types";

export type RawRow = Record<string, any>;

export type ParseTradesOptions = {
  allowLegacy?: boolean; // allow missing extended fields (entry/exit/balance)
};

export type ParseTradesResult = {
  trades: Trade[];
  warnings: string[];
  missingFields: string[];
};

const REQUIRED_BASE_FIELDS = ["timestamp", "side", "asset", "pnl"];
const REQUIRED_EXT_FIELDS = ["entry_price", "exit_price", "account_balance"];

export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pickField(row: RawRow, keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return undefined;
}

function parseTimestamp(value: any): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && !isNaN(value)) {
    // Excel serial date handling: values > 20,000 likely Excel days
    if (value > 20000 && value < 60000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30)).getTime();
      return excelEpoch + value * 24 * 60 * 60 * 1000;
    }
    // Otherwise assume ms epoch or seconds
    if (value < 10_000_000_000) return value * 1000;
    return value;
  }
  if (typeof value === "string") {
    const ts = new Date(value).getTime();
    return isNaN(ts) ? null : ts;
  }
  return null;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.+-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function parseTradesFromRows(
  rows: RawRow[],
  options: ParseTradesOptions = {}
): ParseTradesResult {
  const warnings: string[] = [];
  const missingFields = new Set<string>();
  const trades: Trade[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Required base fields
    const timestampRaw = pickField(row, ["timestamp", "time", "date"]);
    const sideRaw = pickField(row, ["side", "buy_sell", "action", "type"]);
    const assetRaw = pickField(row, ["asset", "symbol", "ticker"]);
    const pnlRaw = pickField(row, ["pnl", "p_l", "pl", "profit_loss"]);

    if (!timestampRaw || !sideRaw || !assetRaw || pnlRaw === undefined) {
      throw new Error(
        `Row ${i + 1} missing required field(s). Required: timestamp, side, asset, pnl`
      );
    }

    const ts = parseTimestamp(timestampRaw);
    if (!ts) {
      throw new Error(`Row ${i + 1}: invalid timestamp "${timestampRaw}"`);
    }

    const side = String(sideRaw).toUpperCase().trim();
    if (side !== "BUY" && side !== "SELL") {
      throw new Error(`Row ${i + 1}: side must be BUY or SELL, got "${sideRaw}"`);
    }

    const pnl = parseNumber(pnlRaw);
    if (pnl === null) {
      throw new Error(`Row ${i + 1}: pnl must be a number, got "${pnlRaw}"`);
    }

    // Extended required fields
    const entryRaw = pickField(row, ["entry_price", "entry", "entryprice", "entry_px"]);
    const exitRaw = pickField(row, ["exit_price", "exit", "exitprice", "exit_px"]);
    const balanceRaw = pickField(row, ["account_balance", "balance", "acct_balance"]);

    const entryPrice = parseNumber(entryRaw);
    const exitPrice = parseNumber(exitRaw);
    const accountBalance = parseNumber(balanceRaw);

    if (entryPrice === null) missingFields.add("entry_price");
    if (exitPrice === null) missingFields.add("exit_price");
    if (accountBalance === null) missingFields.add("account_balance");

    if (!options.allowLegacy && (entryPrice === null || exitPrice === null || accountBalance === null)) {
      throw new Error(
        `Row ${i + 1} missing required extended fields. Required: entry_price, exit_price, account_balance`
      );
    }

    const qtyRaw = pickField(row, ["qty", "quantity", "shares"]);
    const positionSizeRaw = pickField(row, ["position_size", "position", "size", "notional"]);
    const holdRaw = pickField(row, ["hold_minutes", "hold_time", "hold"]);

    const trade: Trade = {
      id: `${ts}-${assetRaw}-${i}`,
      timestamp: ts,
      side: side as "BUY" | "SELL",
      asset: String(assetRaw).trim(),
      pnl,
      entryPrice: entryPrice ?? null,
      exitPrice: exitPrice ?? null,
      accountBalance: accountBalance ?? null,
    };

    const qty = parseNumber(qtyRaw);
    if (qty !== null) trade.qty = qty;

    const ps = parseNumber(positionSizeRaw);
    if (ps !== null) trade.positionSize = ps;

    const hm = parseNumber(holdRaw);
    if (hm !== null) trade.holdMinutes = hm;

    trades.push(trade);
  }

  if (options.allowLegacy) {
    for (const f of REQUIRED_EXT_FIELDS) {
      if (missingFields.has(f)) {
        warnings.push(
          `Missing ${f.replace(/_/g, " ")} — analysis will be limited for some bias signals.`
        );
      }
    }
  }

  trades.sort((a, b) => a.timestamp - b.timestamp);

  return { trades, warnings, missingFields: Array.from(missingFields) };
}

/**
 * Parse a CSV string into validated Trade[].
 * Required columns: timestamp, side, asset, pnl, entry_price, exit_price, account_balance
 * Optional: qty, position_size, hold_minutes
 */
export function parseTrades(
  csvString: string,
  options: ParseTradesOptions = {}
): ParseTradesResult {
  const result = Papa.parse<RawRow>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (result.errors.length > 0) {
    const errorMsgs = result.errors.slice(0, 3).map((e) => e.message).join("; ");
    throw new Error(`CSV parse errors: ${errorMsgs}`);
  }

  return parseTradesFromRows(result.data, options);
}
