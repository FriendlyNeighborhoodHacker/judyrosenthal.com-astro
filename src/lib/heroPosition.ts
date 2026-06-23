/**
 * Shared hero-crop math, used by both the real page (FamilyPerson.astro) and the
 * Edit Person live preview so the two can never diverge.
 *
 * The hero is `object-fit: cover` in a fixed-height frame; we control the
 * vertical focal point. A positive offset nudges the focal point AWAY from the
 * anchored edge: for a "top" anchor it moves the crop DOWN ("50px in from the
 * top"); for "bottom" it moves UP. Because cover positive lengths shift the
 * image down (revealing higher content), "down" subtracts and "up" adds.
 */
export function heroVertical(position?: string, offset?: string): string {
  const base = position === 'top' ? '0%' : position === 'bottom' ? '100%' : '50%';
  if (offset) {
    const o = String(offset).trim();
    if (o) {
      const negative = o.startsWith('-');
      const mag = o.replace(/^[-+]/, '');
      const op = position === 'bottom' ? (negative ? '-' : '+') : negative ? '+' : '-';
      return `calc(${base} ${op} ${mag})`;
    }
  }
  return position ?? 'center';
}

/** Full CSS object-position value (horizontal always centered). */
export function heroObjectPosition(position?: string, offset?: string): string {
  return `center ${heroVertical(position, offset)}`;
}
