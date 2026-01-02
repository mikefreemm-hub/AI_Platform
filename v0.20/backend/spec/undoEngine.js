/* =========================================================
   Undo Engine — Conversational rollback intelligence
   ---------------------------------------------------------
   Turns natural language into a rollback target.

   Examples:
   - "undo" / "undo that" / "go back"             => steps=1
   - "rollback 2" / "undo 3 changes"              => steps=2/3
   - "restore revision 1767375909739"             => targetRevision
   - "revert to 1767375909739"                    => targetRevision
   ========================================================= */

function lc(v){ return String(v||"").toLowerCase().trim(); }

export function parseUndoRequest(text){
  const t = lc(text);

  // explicit revision id (10+ digits to avoid matching years)
  const rev =
    t.match(/\b(?:restore|revert(?:\s+to)?|go\s+to)\s+(?:revision\s+)?(\d{10,})\b/i)?.[1] ||
    t.match(/\brevision\s+(\d{10,})\b/i)?.[1];

  if (rev) return { targetRevision: String(rev), steps: null };

  // "rollback 2" / "undo 3" / "go back 1"
  const steps =
    t.match(/\b(?:undo|rollback|roll\s+back|go\s+back)\s+(\d+)\b/i)?.[1] ||
    t.match(/\b(?:undo|rollback|roll\s+back)\s+(\d+)\s+(?:changes?|steps?)\b/i)?.[1];

  if (steps) return { targetRevision: null, steps: Math.max(1, Number(steps) || 1) };

  // default: one step
  return { targetRevision: null, steps: 1 };
}

/**
 * Resolve the actual target revision from a list of revisions (sorted newest->oldest)
 */
export function resolveUndoTarget({ revisions, current, targetRevision, steps }){
  const list = Array.isArray(revisions) ? revisions : [];
  if (!list.length) return { ok:false, error:"No revisions exist yet." };

  // Prefer explicit target
  if (targetRevision){
    const hit = list.find(r => String(r.revision) === String(targetRevision));
    if (!hit) return { ok:false, error:"That revision was not found." };
    return { ok:true, target: String(hit.revision) };
  }

  const cur = String(current || list[0]?.revision || "");
  const idx = list.findIndex(r => String(r.revision) === cur);

  // If current isn't in the list (edge), treat newest as current
  const base = (idx >= 0) ? idx : 0;

  const s = Math.max(1, Number(steps) || 1);
  const targetIdx = base + s;

  if (targetIdx >= list.length){
    return { ok:false, error:"You’re already at the oldest revision." };
  }

  return { ok:true, target: String(list[targetIdx].revision) };
}
