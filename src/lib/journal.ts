import * as FileSystem from "expo-file-system";
import { JournalEntry } from "./types";

const JOURNAL_PATH = `${FileSystem.documentDirectory}journal_entries.json`;

export async function loadJournalEntries(): Promise<JournalEntry[]> {
  try {
    const info = await FileSystem.getInfoAsync(JOURNAL_PATH);
    if (!info.exists) return [];
    const content = await FileSystem.readAsStringAsync(JOURNAL_PATH);
    const parsed = JSON.parse(content) as JournalEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addJournalEntry(entry: JournalEntry): Promise<JournalEntry[]> {
  const existing = await loadJournalEntries();
  const next = [entry, ...existing].slice(0, 200);
  await FileSystem.writeAsStringAsync(JOURNAL_PATH, JSON.stringify(next));
  return next;
}
