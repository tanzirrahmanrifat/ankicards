import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { unzipSync, strFromU8 } from 'fflate';
import { decompress as zstdDecompress } from 'fzstd';
import type { Deck, Flashcard } from '@/types';
// Vite handles the WASM asset URL correctly in both dev and production builds
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let sqlStatic: SqlJsStatic | null = null;

async function getSqlStatic(): Promise<SqlJsStatic> {
  if (sqlStatic) return sqlStatic;
  sqlStatic = await initSqlJs({
    locateFile: () => wasmUrl,
  });
  return sqlStatic;
}

interface ApkgContent {
  decks: Deck[];
  cards: Flashcard[];
}

const SQLITE_MAGIC = [0x53, 0x51, 0x4c, 0x69]; // "SQLi"
const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd]; // zstd frame magic

function isSqlite(data: Uint8Array): boolean {
  return data.length >= 16 && SQLITE_MAGIC.every((b, i) => data[i] === b);
}

function isZstd(data: Uint8Array): boolean {
  return data.length >= 4 && ZSTD_MAGIC.every((b, i) => data[i] === b);
}

function decompressIfNeeded(data: Uint8Array): Uint8Array {
  if (isSqlite(data)) return data;
  if (isZstd(data)) {
    return zstdDecompress(data);
  }
  return data;
}

function databasePriority(name: string): number {
  const lower = name.toLowerCase();
  if (lower.endsWith('.anki21b')) return 4;
  if (lower.endsWith('.anki21')) return 3;
  if (lower.endsWith('.anki2')) return 2;
  return 1;
}

export async function parseApkg(file: File): Promise<ApkgContent> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const files = unzipSync(buffer);

  const databaseFiles = Object.keys(files)
    .filter((name) => /\.(anki21b?|anki2|db)$/i.test(name))
    .sort((a, b) => databasePriority(b) - databasePriority(a));

  if (databaseFiles.length === 0) {
    throw new Error('No Anki database file found in the package.');
  }

  const SQL = await getSqlStatic();
  let lastError: Error | null = null;

  for (const dbFileKey of databaseFiles) {
    const rawData = files[dbFileKey];
    let dbData: Uint8Array;
    try {
      dbData = decompressIfNeeded(rawData);
    } catch {
      // Not zstd or decompression failed — try raw
      dbData = rawData;
    }

    if (!isSqlite(dbData)) {
      // Not a valid SQLite file, try next database
      continue;
    }

    let db: Database;
    try {
      db = new SQL.Database(dbData);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      continue;
    }

    try {
      const result = extractDecksAndCards(db, file.name);
      if (result.cards.length > 0) {
        return result;
      }
      // No cards in this DB — try the next one (e.g. .anki2 compatibility stub)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    } finally {
      db.close();
    }
  }

  throw new Error(
    lastError
      ? `Could not read the flashcard database: ${lastError.message}`
      : 'No flashcards found in this file.'
  );
}

interface NoteRow {
  id: number;
  mid: number;
  flds: string;
  tags: string;
}

interface CardRow {
  id: number;
  nid: number;
  did: number;
  ord: number;
}

function extractDecksAndCards(db: Database, fileName: string): ApkgContent {
  let deckMap: Map<number, string> = new Map();
  try {
    const colResult = db.exec('SELECT decks FROM col LIMIT 1');
    if (colResult.length > 0) {
      const decksJson = readSqlText(colResult[0].values[0][0]);
      const decksObj = JSON.parse(decksJson) as Record<string, { id: number; name: string }>;
      deckMap = new Map(Object.values(decksObj).map((d) => [d.id, d.name]));
    }
  } catch {
    try {
      const deckResult = db.exec('SELECT id, name FROM decks');
      for (const row of deckResult[0]?.values ?? []) {
        deckMap.set(row[0] as number, readSqlText(row[1]));
      }
    } catch {
      // ignore
    }
  }

  const notes: NoteRow[] = [];
  try {
    const noteResult = db.exec('SELECT id, mid, flds, tags FROM notes');
    for (const row of noteResult[0]?.values ?? []) {
      notes.push({
        id: row[0] as number,
        mid: row[1] as number,
        flds: readSqlText(row[2]),
        tags: readSqlText(row[3]),
      });
    }
  } catch {
    // ignore
  }

  const noteMap = new Map(notes.map((n) => [n.id, n]));

  const cards: CardRow[] = [];
  try {
    const cardResult = db.exec('SELECT id, nid, did, ord FROM cards');
    for (const row of cardResult[0]?.values ?? []) {
      cards.push({
        id: row[0] as number,
        nid: row[1] as number,
        did: row[2] as number,
        ord: row[3] as number,
      });
    }
  } catch {
    // ignore
  }

  const flashcards: Flashcard[] = [];
  const deckCardCounts = new Map<number, number>();

  for (const card of cards) {
    const note = noteMap.get(card.nid);
    if (!note) continue;

    const fields = note.flds.split('\x1f');
    const front = stripHtml(fields[0] ?? '').trim();
    const back = stripHtml(fields.slice(1).join('<br/>')).trim();
    const tags = note.tags.split(' ').filter((t) => t.length > 0);

    const deckId = `apkg:${card.did}`;

    flashcards.push({
      id: card.id,
      deckId,
      front,
      back,
      tags,
    });

    deckCardCounts.set(card.did, (deckCardCounts.get(card.did) ?? 0) + 1);
  }

  const decks: Deck[] = [];
  for (const [did, name] of deckMap) {
    const count = deckCardCounts.get(did) ?? 0;
    if (count > 0) {
      decks.push({
        id: `apkg:${did}`,
        name,
        cardCount: count,
        description: `${count} cards`,
        createdAt: Date.now(),
      });
    }
  }

  if (decks.length === 0 && flashcards.length > 0) {
    decks.push({
      id: 'apkg:default',
      name: fileName.replace(/\.apkg$/i, ''),
      cardCount: flashcards.length,
      description: `${flashcards.length} cards`,
      createdAt: Date.now(),
    });
    for (const c of flashcards) {
      c.deckId = 'apkg:default';
    }
  }

  return { decks, cards: flashcards };
}

function readSqlText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) return strFromU8(value);
  if (value instanceof ArrayBuffer) return strFromU8(new Uint8Array(value));
  return String(value);
}

function stripHtml(html: string): string {
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (_, src) => {
      if (src.startsWith('data:')) return `\n[img]\n`;
      return `\n[img: ${src}]\n`;
    })
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n');

  return text;
}
