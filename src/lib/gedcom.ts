import fs from 'node:fs/promises';
import path from 'node:path';

// =============================================================================
// Types
// =============================================================================

export interface EventInfo {
  date?: string;
  place?: string;
}

export interface Individual {
  id: string; // e.g. "@I00002@"
  given: string; // "Judith-Ann" (may be "")
  surname: string; // "Saks" (may be "")
  fullName: string; // "Judith-Ann Saks" (or "Unknown")
  sex?: 'M' | 'F';
  birth?: EventInfo;
  death?: EventInfo;
  famc: string[]; // families this person is a child in (→ parents)
  fams: string[]; // families this person is a spouse in (→ marriages)
}

export interface Family {
  id: string; // e.g. "@F00002@"
  husb?: string;
  wife?: string;
  chil: string[];
}

export interface GedcomModel {
  individuals: Map<string, Individual>;
  families: Map<string, Family>;
  /**
   * Reverse index: child @I id → families that list them as a CHIL. Used so the
   * parent-child graph is symmetric with `childrenOf` even when a child's FAMC
   * pointer is missing or points at a duplicate of a parent (a real data quirk
   * in this GEDCOM).
   */
  childToFams: Map<string, string[]>;
}

export interface FamilyData {
  model: GedcomModel;
  /** Map of @I id → URL slug, for the included set only (minors excluded). */
  slugMap: Map<string, string>;
  /** Set of @I ids that get a page (minors excluded). */
  included: Set<string>;
  /** Resolved seed ids. */
  seeds: { judith: string; haskell: string; eugenie: string };
  /** Protected minors (under 18): no page, name never shown, counted only. */
  minors: Set<string>;
}

// =============================================================================
// Parser — level-based state machine, single pass
// =============================================================================

function pushUnique(arr: string[], value: string): void {
  if (value && !arr.includes(value)) arr.push(value);
}

/** Parse a GEDCOM NAME value of the form "Given /Surname/ Suffix" (suffix optional). */
function parseName(value: string): { given: string; surname: string; suffix: string } {
  const match = value.match(/^(.*?)\/([^/]*)\/?\s*(.*)$/);
  if (match) {
    return { given: match[1].trim(), surname: match[2].trim(), suffix: match[3].trim() };
  }
  return { given: value.trim(), surname: '', suffix: '' };
}

function buildFullName(given: string, surname: string, suffix: string): string {
  const name = [given, surname, suffix].filter(Boolean).join(' ').trim();
  return name || 'Unknown';
}

export function parseGedcom(text: string): GedcomModel {
  const individuals = new Map<string, Individual>();
  const families = new Map<string, Family>();

  const lines = text.split(/\r\n|\r|\n/);

  let currentType: 'INDI' | 'FAM' | null = null;
  let currentIndi: Individual | null = null;
  let currentFam: Family | null = null;
  // Tracks whether a level-1 BIRT/DEAT is open, so level-2 DATE/PLAC attach correctly.
  let eventContext: 'BIRT' | 'DEAT' | null = null;

  for (const raw of lines) {
    if (!raw.trim()) continue;

    const spaceIdx = raw.indexOf(' ');
    if (spaceIdx === -1) continue;
    const level = parseInt(raw.slice(0, spaceIdx), 10);
    if (Number.isNaN(level)) continue;
    const rest = raw.slice(spaceIdx + 1);

    if (level === 0) {
      // Close out the previous record (already stored by reference).
      currentType = null;
      currentIndi = null;
      currentFam = null;
      eventContext = null;

      const recMatch = rest.match(/^(@\w+@)\s+(INDI|FAM)$/);
      if (recMatch) {
        const [, id, type] = recMatch;
        if (type === 'INDI') {
          currentType = 'INDI';
          currentIndi = {
            id,
            given: '',
            surname: '',
            fullName: 'Unknown',
            famc: [],
            fams: [],
          };
          individuals.set(id, currentIndi);
        } else {
          currentType = 'FAM';
          currentFam = { id, chil: [] };
          families.set(id, currentFam);
        }
      }
      continue;
    }

    if (currentType === 'INDI' && currentIndi) {
      if (level === 1) {
        eventContext = null;
        const tagSpace = rest.indexOf(' ');
        const tag = tagSpace === -1 ? rest : rest.slice(0, tagSpace);
        const value = tagSpace === -1 ? '' : rest.slice(tagSpace + 1);
        switch (tag) {
          case 'NAME': {
            const { given, surname, suffix } = parseName(value);
            currentIndi.given = given;
            currentIndi.surname = surname;
            currentIndi.fullName = buildFullName(given, surname, suffix);
            break;
          }
          case 'SEX': {
            const s = value.trim().charAt(0).toUpperCase();
            if (s === 'M' || s === 'F') currentIndi.sex = s;
            break;
          }
          case 'BIRT':
            currentIndi.birth = {};
            eventContext = 'BIRT';
            break;
          case 'DEAT':
            currentIndi.death = {};
            eventContext = 'DEAT';
            break;
          case 'FAMC':
            pushUnique(currentIndi.famc, value.trim());
            break;
          case 'FAMS':
            pushUnique(currentIndi.fams, value.trim());
            break;
        }
      } else if (level === 2 && eventContext) {
        const tagSpace = rest.indexOf(' ');
        const tag = tagSpace === -1 ? rest : rest.slice(0, tagSpace);
        const value = tagSpace === -1 ? '' : rest.slice(tagSpace + 1);
        const target = eventContext === 'BIRT' ? currentIndi.birth! : currentIndi.death!;
        if (tag === 'DATE') target.date = value.trim();
        else if (tag === 'PLAC') target.place = value.trim();
      }
    } else if (currentType === 'FAM' && currentFam) {
      if (level === 1) {
        const tagSpace = rest.indexOf(' ');
        const tag = tagSpace === -1 ? rest : rest.slice(0, tagSpace);
        const value = tagSpace === -1 ? '' : rest.slice(tagSpace + 1);
        switch (tag) {
          case 'HUSB':
            currentFam.husb = value.trim();
            break;
          case 'WIFE':
            currentFam.wife = value.trim();
            break;
          case 'CHIL':
            pushUnique(currentFam.chil, value.trim());
            break;
        }
      }
    }
  }

  // Build the child → families reverse index from every family's CHIL list.
  const childToFams = new Map<string, string[]>();
  for (const fam of families.values()) {
    for (const c of fam.chil) {
      const list = childToFams.get(c);
      if (list) list.push(fam.id);
      else childToFams.set(c, [fam.id]);
    }
  }

  return { individuals, families, childToFams };
}

// =============================================================================
// Accessors
// =============================================================================

export function fullName(model: GedcomModel, id: string): string {
  return model.individuals.get(id)?.fullName ?? 'Unknown';
}

/** Full name with middle name(s) dropped — keeps the first given name + surname (+ suffix). */
function shortName(indi: Individual): string {
  const given = indi.given;
  if (!given) return indi.fullName;
  const firstGiven = given.split(/\s+/)[0];
  if (firstGiven === given) return indi.fullName; // single given token, nothing to drop
  // fullName always starts with the full `given`; replace it with just the first name.
  return (firstGiven + indi.fullName.slice(given.length)).trim();
}

/**
 * Name to display. Deceased people (a death record, or born ≥100 years ago)
 * show their full name including middle name(s); living people show only their
 * first name + surname for privacy.
 */
export function displayName(model: GedcomModel, id: string, now: Date): string {
  const indi = model.individuals.get(id);
  if (!indi) return 'Unknown';
  return isLikelyDeceased(model, id, now) ? indi.fullName : shortName(indi);
}

export function sexOf(model: GedcomModel, id: string): 'M' | 'F' | undefined {
  return model.individuals.get(id)?.sex;
}

/**
 * Families that make this person a child: their FAMC pointer(s) plus any family
 * that lists them in CHIL. FAMC comes first so it wins for single-parent display.
 */
function parentFamilyIds(model: GedcomModel, id: string): string[] {
  const out: string[] = [];
  const indi = model.individuals.get(id);
  if (indi) for (const f of indi.famc) pushUnique(out, f);
  for (const f of model.childToFams.get(id) ?? []) pushUnique(out, f);
  return out;
}

/**
 * Parents as { father?, mother? } for display — the first father/mother found
 * across the person's parent families (FAMC-pointed family first).
 */
export function parentsOf(model: GedcomModel, id: string): { father?: string; mother?: string } {
  const result: { father?: string; mother?: string } = {};
  for (const famId of parentFamilyIds(model, id)) {
    const fam = model.families.get(famId);
    if (!fam) continue;
    if (fam.husb && !result.father) result.father = fam.husb;
    if (fam.wife && !result.mother) result.mother = fam.wife;
  }
  return result;
}

/**
 * All distinct parent ids across every parent family. This is the edge set used
 * for the ancestor graph / inclusion, kept symmetric with `childrenOf`.
 */
export function parentIdsOf(model: GedcomModel, id: string): string[] {
  const out: string[] = [];
  for (const famId of parentFamilyIds(model, id)) {
    const fam = model.families.get(famId);
    if (!fam) continue;
    if (fam.husb) pushUnique(out, fam.husb);
    if (fam.wife) pushUnique(out, fam.wife);
  }
  return out;
}

export function childrenOf(model: GedcomModel, id: string): string[] {
  const indi = model.individuals.get(id);
  const out: string[] = [];
  if (!indi) return out;
  for (const famId of indi.fams) {
    const fam = model.families.get(famId);
    if (!fam) continue;
    for (const c of fam.chil) pushUnique(out, c);
  }
  return out;
}

export function siblingsOf(model: GedcomModel, id: string): string[] {
  const out: string[] = [];
  for (const famId of parentFamilyIds(model, id)) {
    const fam = model.families.get(famId);
    if (!fam) continue;
    for (const c of fam.chil) {
      if (c !== id) pushUnique(out, c);
    }
  }
  return out;
}

export function spousesOf(model: GedcomModel, id: string): string[] {
  const indi = model.individuals.get(id);
  const out: string[] = [];
  if (!indi) return out;
  for (const famId of indi.fams) {
    const fam = model.families.get(famId);
    if (!fam) continue;
    if (fam.husb && fam.husb !== id) pushUnique(out, fam.husb);
    if (fam.wife && fam.wife !== id) pushUnique(out, fam.wife);
  }
  return out;
}

// =============================================================================
// Slugs
// =============================================================================

function baseSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'unknown';
}

/** Numeric portion of an @I id, for deterministic ordering/disambiguation. */
function idNumber(id: string): number {
  const m = id.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Build a deterministic id→slug map over the included set. The first person
 * (by ascending numeric id) to claim a base slug keeps it; later collisions get
 * `base_<numeric id>`.
 */
export function buildSlugMap(included: Set<string>, model: GedcomModel): Map<string, string> {
  const slugMap = new Map<string, string>();
  const taken = new Set<string>();
  const ids = [...included].sort((a, b) => idNumber(a) - idNumber(b));
  for (const id of ids) {
    const base = baseSlug(fullName(model, id));
    let slug = base;
    if (taken.has(slug)) {
      slug = `${base}_${idNumber(id)}`;
    }
    taken.add(slug);
    slugMap.set(id, slug);
  }
  return slugMap;
}

// =============================================================================
// Inclusion set
// =============================================================================

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Resolve the three seed individuals by normalized name; assert exactly one each. */
export function resolveSeeds(model: GedcomModel): {
  judith: string;
  haskell: string;
  eugenie: string;
} {
  const find = (label: string, pred: (i: Individual) => boolean): string => {
    const matches = [...model.individuals.values()].filter(pred);
    if (matches.length !== 1) {
      throw new Error(
        `GEDCOM seed resolution failed for "${label}": expected exactly 1 match, found ${matches.length}.`
      );
    }
    return matches[0].id;
  };

  const judith = find('Judith-Ann Saks', (i) => {
    const g = normalizeForMatch(i.given);
    const s = normalizeForMatch(i.surname);
    return g.startsWith('judith') && s === 'saks';
  });
  const haskell = find('Haskell Rosenthal', (i) => {
    const g = normalizeForMatch(i.given);
    const s = normalizeForMatch(i.surname);
    return g.startsWith('haskell') && s === 'rosenthal';
  });
  const eugenie = find('Eugenie Lang', (i) => {
    const g = normalizeForMatch(i.given);
    const s = normalizeForMatch(i.surname);
    return g.startsWith('eugenie') && s === 'lang';
  });

  return { judith, haskell, eugenie };
}

function collectAncestors(model: GedcomModel, id: string, into: Set<string>): void {
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const p of parentIdsOf(model, cur)) {
      if (!into.has(p)) {
        into.add(p);
        stack.push(p);
      }
    }
  }
}

function collectDescendants(model: GedcomModel, id: string, into: Set<string>): void {
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const c of childrenOf(model, cur)) {
      if (!into.has(c)) {
        into.add(c);
        stack.push(c);
      }
    }
  }
}

/**
 * Included set = all blood relatives of the seeds, plus their spouses.
 *
 * Blood relatives are the downward closure (all descendants) of the seeds
 * together with all of their ancestors. This captures the seeds' ancestors,
 * descendants, and every collateral line (siblings, aunts/uncles, cousins,
 * nieces/nephews and their descendants) — i.e. every "non-leaf" person the
 * tree brings in. Spouses are then added as leaves: a married-in spouse gets
 * a page, but we do not pull in that spouse's own ancestral family.
 */
export function buildIncludedIds(
  model: GedcomModel,
  seeds: { judith: string; haskell: string; eugenie: string }
): Set<string> {
  const included = new Set<string>();

  // Seeds + all their ancestors.
  for (const seed of [seeds.judith, seeds.haskell, seeds.eugenie]) {
    included.add(seed);
    collectAncestors(model, seed, included);
  }

  // All descendants of the seeds and their ancestors (every blood collateral).
  for (const id of [...included]) {
    collectDescendants(model, id, included);
  }

  // Spouses of everyone in the blood set (married-in spouses, as leaves).
  for (const id of [...included]) {
    for (const sp of spousesOf(model, id)) included.add(sp);
  }

  return included;
}

// =============================================================================
// Relationship calculator
// =============================================================================

/** Map of ancestorId → minimum generational depth from `id` (self = 0). */
function ancestorsWithDepth(model: GedcomModel, id: string): Map<string, number> {
  const depths = new Map<string, number>();
  depths.set(id, 0);
  // BFS so first time we reach a node is its minimum depth.
  let frontier = [id];
  let depth = 0;
  while (frontier.length) {
    const next: string[] = [];
    depth += 1;
    for (const cur of frontier) {
      for (const p of parentIdsOf(model, cur)) {
        if (!depths.has(p)) {
          depths.set(p, depth);
          next.push(p);
        }
      }
    }
    frontier = next;
  }
  return depths;
}

interface Lca {
  lca: string;
  dP: number; // distance from P to LCA
  dJ: number; // distance from J to LCA
}

function findLca(model: GedcomModel, p: string, j: string): Lca | null {
  const aP = ancestorsWithDepth(model, p);
  const aJ = ancestorsWithDepth(model, j);
  let best: Lca | null = null;
  for (const [anc, dp] of aP) {
    const dj = aJ.get(anc);
    if (dj === undefined) continue;
    const total = dp + dj;
    if (
      !best ||
      total < best.dP + best.dJ ||
      (total === best.dP + best.dJ && idNumber(anc) < idNumber(best.lca))
    ) {
      best = { lca: anc, dP: dp, dJ: dj };
    }
  }
  return best;
}

const ORDINAL_WORDS = [
  '',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
];

/** Spelled-out ordinal for cousin levels ("second cousin"); numeric fallback past twelfth. */
function ordinal(n: number): string {
  if (n >= 1 && n < ORDINAL_WORDS.length) return ORDINAL_WORDS[n];
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function removedPhrase(n: number): string {
  if (n === 1) return 'once removed';
  if (n === 2) return 'twice removed';
  if (n === 3) return 'three times removed';
  if (n === 4) return 'four times removed';
  if (n === 5) return 'five times removed';
  return `${n} times removed`;
}

function bySex(sex: 'M' | 'F' | undefined, male: string, female: string, neutral: string): string {
  if (sex === 'M') return male;
  if (sex === 'F') return female;
  return neutral;
}

/**
 * The blood-relationship term of P relative to J (no sentence wrapper).
 * Returns null if there is no blood (lineal/collateral) path.
 */
function bloodTerm(model: GedcomModel, p: string, j: string): string | null {
  if (p === j) return 'self';
  const lca = findLca(model, p, j);
  if (!lca) return null;
  const { dP, dJ } = lca;
  const sex = sexOf(model, p);

  // J is the common ancestor (LCA is J) → P descends from J → P is a descendant.
  if (dJ === 0) {
    const g = dP;
    if (g === 1) return bySex(sex, 'son', 'daughter', 'child');
    if (g === 2) return bySex(sex, 'grandson', 'granddaughter', 'grandchild');
    const greats = 'great '.repeat(g - 2);
    return greats + bySex(sex, 'grandson', 'granddaughter', 'grandchild');
  }

  // P is the common ancestor (LCA is P) → J descends from P → P is an ancestor.
  if (dP === 0) {
    const g = dJ;
    if (g === 1) return bySex(sex, 'father', 'mother', 'parent');
    if (g === 2) return bySex(sex, 'grandfather', 'grandmother', 'grandparent');
    const greats = 'great '.repeat(g - 2);
    return greats + bySex(sex, 'grandfather', 'grandmother', 'grandparent');
  }

  // Collateral.
  // Siblings.
  if (dP === 1 && dJ === 1) return bySex(sex, 'brother', 'sister', 'sibling');

  // Aunt/Uncle line: P is closer to the LCA than J.
  if (dP === 1) {
    if (dJ === 2) return bySex(sex, 'uncle', 'aunt', 'aunt or uncle');
    const greats = 'great '.repeat(dJ - 3);
    return greats + bySex(sex, 'great uncle', 'great aunt', 'great aunt or uncle');
  }

  // Niece/Nephew line: J is closer to the LCA than P.
  if (dJ === 1) {
    if (dP === 2) return bySex(sex, 'nephew', 'niece', 'niece or nephew');
    const greats = 'great '.repeat(dP - 3);
    return greats + bySex(sex, 'great nephew', 'great niece', 'great niece or nephew');
  }

  // Cousins.
  const level = Math.min(dP, dJ) - 1;
  const removed = Math.abs(dP - dJ);
  let term = `${ordinal(level)} cousin`;
  if (removed > 0) term += ` ${removedPhrase(removed)}`;
  return term;
}

/** Connector word: cousins read "...cousin once removed TO X", everything else "...OF X". */
function connectorFor(term: string): string {
  return term.includes('cousin') ? 'to' : 'of';
}

/**
 * A relationship sentence split so the anchor person's name can be rendered as a
 * link to their profile. `prefix` is the sentence up to (and including the space
 * before) the anchor's name, e.g. "Mary Smith is the grandmother of ". The
 * caller appends the (linked) `anchorName` followed by a period.
 */
export interface RelationshipDescription {
  prefix: string;
  anchorId: string;
  anchorName: string;
}

/**
 * Describe P's relationship to a single anchor A, but only for the cases the
 * site shows: P is a blood relative of A, P is A's spouse, or P is the spouse
 * of a blood relative of A. Returns the split sentence, or null if none apply.
 */
function relationshipToAnchor(
  model: GedcomModel,
  p: string,
  anchor: string,
  now: Date
): RelationshipDescription | null {
  if (p === anchor) return null;
  const pName = displayName(model, p, now);
  const aName = displayName(model, anchor, now);
  const sex = sexOf(model, p);
  const desc = (prefix: string): RelationshipDescription => ({ prefix, anchorId: anchor, anchorName: aName });

  // (a) P is a blood relative of the anchor.
  const blood = bloodTerm(model, p, anchor);
  if (blood && blood !== 'self') {
    return desc(`${pName} is the ${blood} ${connectorFor(blood)} `);
  }

  // (b) P is the anchor's spouse.
  if (spousesOf(model, anchor).includes(p)) {
    return desc(`${pName} is the ${bySex(sex, 'husband', 'wife', 'spouse')} of `);
  }

  // (c) P is the spouse of a blood relative of the anchor.
  for (const s of spousesOf(model, p)) {
    const t = bloodTerm(model, s, anchor);
    if (t && t !== 'self') {
      return desc(`${pName} is the ${bySex(sex, 'husband', 'wife', 'spouse')} of the ${t} ${connectorFor(t)} `);
    }
  }

  return null;
}

/**
 * Relationship describing P, trying Judith first, then Eugenie, then Haskell.
 * Returns null when P has no qualifying relationship to any of them (in which
 * case the page shows no auto-generated description).
 */
export function describeRelationship(
  model: GedcomModel,
  p: string,
  seeds: { judith: string; haskell: string; eugenie: string },
  now: Date
): RelationshipDescription | null {
  for (const anchor of [seeds.judith, seeds.eugenie, seeds.haskell]) {
    const desc = relationshipToAnchor(model, p, anchor, now);
    if (desc) return desc;
  }
  return null;
}

// =============================================================================
// Minor (under-18) privacy filter
// =============================================================================

const MONTH_INDEX: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

/** Parse a GEDCOM date to the LATEST plausible Y/M/D so partial dates yield the youngest age. */
function parseLatestDate(date: string): { y: number; m: number; d: number } | null {
  const years = date.match(/\d{3,4}/g);
  if (!years) return null;
  const y = parseInt(years[years.length - 1], 10);
  const monMatch = date.toUpperCase().match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/);
  const m = monMatch ? MONTH_INDEX[monMatch[1]] : 11; // unknown month → December
  const dayMatch = date.match(/\b(\d{1,2})\b/); // leading day, if present
  const d = dayMatch ? parseInt(dayMatch[1], 10) : 31; // unknown day → end of month
  return { y, m, d };
}

function ageOn(birth: { y: number; m: number; d: number }, now: Date): number {
  let age = now.getFullYear() - birth.y;
  const m = now.getMonth();
  const dt = now.getDate();
  if (m < birth.m || (m === birth.m && dt < birth.d)) age -= 1;
  return age;
}

/**
 * A person is treated as a protected minor (no page, name never shown — only
 * counted) when they are not recorded as deceased and their birth date puts
 * them under 18 as of `now`. Partial dates are read as the latest plausible
 * date (youngest age) to err toward privacy. People with no birth date are
 * assumed adult (most undated records are ancestors), as is anyone with a
 * death record.
 */
export function isMinor(model: GedcomModel, id: string, now: Date): boolean {
  const indi = model.individuals.get(id);
  if (!indi) return false;
  if (indi.death) return false;
  const date = indi.birth?.date;
  if (!date) return false;
  const birth = parseLatestDate(date);
  if (!birth) return false;
  return ageOn(birth, now) < 18;
}

// Age beyond which we treat an undated-death person as certainly deceased, so
// historical ancestors show their dates while plausibly-living people don't.
const ASSUMED_DECEASED_AGE = 100;

/**
 * Whether a person is treated as deceased for date-display purposes: they have
 * a GEDCOM death record, or they were born at least ASSUMED_DECEASED_AGE years
 * ago. (A death supplied via per-person metadata is handled at the call site.)
 */
export function isLikelyDeceased(model: GedcomModel, id: string, now: Date): boolean {
  const indi = model.individuals.get(id);
  if (!indi) return false;
  if (indi.death) return true;
  const date = indi.birth?.date;
  if (date) {
    const birth = parseLatestDate(date);
    if (birth && now.getFullYear() - birth.y >= ASSUMED_DECEASED_AGE) return true;
  }
  return false;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DATE_QUALIFIERS: Record<string, string> = {
  ABT: 'about', EST: 'about', CAL: 'about', AFT: 'after', BEF: 'before',
};

/**
 * Format a GEDCOM date for display: full dates → "M/D/YYYY", month+year →
 * "Month YYYY", year only → "YYYY" (with an "about/after/before" prefix when
 * the GEDCOM qualifies it). Returns null when no year can be found.
 */
export function formatDisplayDate(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const years = s.match(/\d{3,4}/g);
  if (!years) return null;
  const year = parseInt(years[years.length - 1], 10);
  const monMatch = s.toUpperCase().match(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/);
  const monthIdx = monMatch ? MONTH_INDEX[monMatch[1]] : null;
  const dayMatch = s.match(/\b(\d{1,2})\b/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : null;
  const qualMatch = s.toUpperCase().match(/\b(ABT|EST|CAL|AFT|BEF)\b/);
  const prefix = qualMatch ? `${DATE_QUALIFIERS[qualMatch[1]]} ` : '';

  if (monthIdx !== null && day !== null) return `${monthIdx + 1}/${day}/${year}`;
  if (monthIdx !== null) return `${prefix}${MONTH_NAMES[monthIdx]} ${year}`;
  return `${prefix}${year}`;
}

// =============================================================================
// Memoized loader
// =============================================================================

const GEDCOM_PATH = path.join(process.cwd(), 'src', 'data', 'judy_rosenthal_genealogy.ged');

let _cache: FamilyData | null = null;

export async function loadFamilyData(): Promise<FamilyData> {
  // In dev, skip the cache so edits to the GEDCOM are reflected on reload. The
  // static build keeps the cache (loadFamilyData is called many times).
  if (_cache && !import.meta.env.DEV) return _cache;
  // GEDCOM file is ISO-8859-1 (Latin-1) with CRLF line endings.
  const text = await fs.readFile(GEDCOM_PATH, 'latin1');
  const model = parseGedcom(text);
  const seeds = resolveSeeds(model);
  const included = buildIncludedIds(model, seeds);

  // Protect minors: drop them from the page set (computed before removal so
  // relatives can still be counted).
  const now = new Date();
  const minors = new Set<string>();
  for (const id of included) {
    if (isMinor(model, id, now)) minors.add(id);
  }
  for (const id of minors) included.delete(id);

  const slugMap = buildSlugMap(included, model);
  _cache = { model, slugMap, included, seeds, minors };
  return _cache;
}
