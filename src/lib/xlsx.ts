import * as XLSX from "xlsx";
import { normalizeHeader, parseTradesFromRows, ParseTradesOptions, ParseTradesResult, RawRow } from "./csv";

// Ensure Buffer is available for some XLSX builds (Expo/RN)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = global;
if (!globalAny.Buffer) {
  // Lazy import to avoid bundler issues if not needed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalAny.Buffer = require("buffer").Buffer;
}

/**
 * Parse an .xlsx file (base64 string) into trades.
 * Uses the first sheet by default.
 */
export function parseXlsx(
  base64: string,
  options: ParseTradesOptions = {}
): ParseTradesResult {
  const workbook = XLSX.read(base64, { type: "base64", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Excel file contains no sheets.");
  }
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: "",
    raw: false,
  });

  const normalized: RawRow[] = rawRows.map((row) => {
    const out: RawRow = {};
    Object.entries(row).forEach(([k, v]) => {
      out[normalizeHeader(k)] = v;
    });
    return out;
  });

  return parseTradesFromRows(normalized, options);
}
