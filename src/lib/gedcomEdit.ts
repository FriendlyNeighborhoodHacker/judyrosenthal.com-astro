/**
 * DEV-ONLY helper to edit individual BIRT/DEAT facts in the GEDCOM source file.
 *
 * The file is ISO-8859-1 (Latin-1) with CRLF line endings; both are preserved.
 * We parse only the target individual's record into its level-1 entries (each
 * with their level-2+ children), update the BIRT/DEAT events, and splice the
 * record back — leaving every other record byte-identical.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const GED_PATH = path.join(process.cwd(), 'src', 'data', 'judy_rosenthal_genealogy.ged');

export interface IndiFacts {
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
}

interface L1Entry {
  line: string; // e.g. "1 BIRT" or "1 NAME Judith-Ann /Saks/"
  children: string[]; // level-2+ lines belonging to this entry
}

function tagOf(line: string): string {
  const m = line.match(/^1 (\w+)/);
  return m ? m[1] : '';
}

/** One-line-safe GEDCOM value (no embedded newlines). */
function clean(value: string | undefined): string {
  return (value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

/** Set/replace/remove a level-2 DATE or PLAC sub-record within an event's children. */
function setChild(children: string[], sub: 'DATE' | 'PLAC', value: string): void {
  const idx = children.findIndex((c) => new RegExp(`^2 ${sub}\\b`).test(c));
  if (!value) {
    if (idx >= 0) children.splice(idx, 1);
    return;
  }
  const newLine = `2 ${sub} ${value}`;
  if (idx >= 0) {
    children[idx] = newLine;
  } else if (sub === 'DATE') {
    children.unshift(newLine); // DATE conventionally first
  } else {
    const dateIdx = children.findIndex((c) => /^2 DATE\b/.test(c));
    children.splice(dateIdx >= 0 ? dateIdx + 1 : 0, 0, newLine);
  }
}

/** Conventional position to insert a brand-new BIRT/DEAT entry. */
function insertionIndex(entries: L1Entry[], tag: 'BIRT' | 'DEAT'): number {
  const idxOf = (t: string) => entries.findIndex((e) => tagOf(e.line) === t);
  const order = tag === 'BIRT' ? ['SEX', 'NAME'] : ['BIRT', 'SEX', 'NAME'];
  for (const t of order) {
    const i = idxOf(t);
    if (i >= 0) return i + 1;
  }
  return 0;
}

function applyEvent(entries: L1Entry[], tag: 'BIRT' | 'DEAT', date: string, place: string): void {
  let idx = entries.findIndex((e) => e.line === `1 ${tag}`);

  if (!date && !place) {
    if (idx >= 0) entries.splice(idx, 1); // clear the whole event
    return;
  }
  if (idx < 0) {
    const pos = insertionIndex(entries, tag);
    entries.splice(pos, 0, { line: `1 ${tag}`, children: [] });
    idx = pos;
  }
  setChild(entries[idx].children, 'DATE', date);
  setChild(entries[idx].children, 'PLAC', place);
}

/**
 * Pure transform: return the GEDCOM text with one individual's BIRT/DEAT
 * date/place updated. Preserves CRLF and every other record byte-for-byte.
 */
export function editIndiFactsText(text: string, id: string, facts: IndiFacts): string {
  if (!/^@\w+@$/.test(id)) throw new Error('Invalid individual id');

  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r\n|\n/);

  const i0 = lines.findIndex((l) => l === `0 ${id} INDI`);
  if (i0 < 0) throw new Error(`Individual ${id} not found`);
  let i1 = lines.findIndex((l, j) => j > i0 && /^0 /.test(l));
  if (i1 < 0) i1 = lines.length;

  // Parse the record's level-1 entries with their level-2+ children.
  const entries: L1Entry[] = [];
  for (let j = i0 + 1; j < i1; j++) {
    const line = lines[j];
    if (/^1 /.test(line)) entries.push({ line, children: [] });
    else if (entries.length) entries[entries.length - 1].children.push(line);
  }

  applyEvent(entries, 'BIRT', clean(facts.birthDate), clean(facts.birthPlace));
  applyEvent(entries, 'DEAT', clean(facts.deathDate), clean(facts.deathPlace));

  // Re-serialize the record and splice it back into the file.
  const rebuilt = [lines[i0]];
  for (const e of entries) {
    rebuilt.push(e.line, ...e.children);
  }
  const newLines = [...lines.slice(0, i0), ...rebuilt, ...lines.slice(i1)];
  return newLines.join(eol);
}

/** Update an individual's birth/death date and place in the GEDCOM file. */
export async function updateIndiFacts(id: string, facts: IndiFacts): Promise<void> {
  const text = await fs.readFile(GED_PATH, 'latin1');
  const updated = editIndiFactsText(text, id, facts);
  await fs.writeFile(GED_PATH, updated, 'latin1');
}
