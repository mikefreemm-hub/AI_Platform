/* =========================================================
   Diff Engine — Revision Explanation Layer
   ---------------------------------------------------------
   Produces human-readable summaries from real spec changes.
   No guessing. No hallucination.
   ========================================================= */

function lc(v){ return String(v||"").toLowerCase(); }

function listNames(arr, key){
  return (arr||[]).map(x => x[key]).filter(Boolean);
}

function diffArrays(prev=[], next=[]){
  const a = new Set(prev);
  const b = new Set(next);
  return {
    added: [...b].filter(x => !a.has(x)),
    removed: [...a].filter(x => !b.has(x))
  };
}

export function diffSpecs(prev, next){
  const changes = [];
  if (!prev || !next) return { summary:null, changes:[] };

  /* ---------- THEME ---------- */
  if (prev.site?.theme?.mode !== next.site?.theme?.mode){
    changes.push(`switched to a ${next.site.theme.mode} theme`);
  }

  if (prev.site?.theme?.accent !== next.site?.theme?.accent){
    changes.push(`changed the accent color to ${next.site.theme.accent}`);
  }

  /* ---------- INTENT ---------- */
  const pI = prev.site?.intent?.global || {};
  const nI = next.site?.intent?.global || {};

  if (nI.warmth > pI.warmth) changes.push("made the tone warmer");
  if (nI.salesiness < pI.salesiness) changes.push("made the content less salesy");
  if (nI.calm > pI.calm) changes.push("made the layout calmer");
  if (nI.density !== pI.density) changes.push("adjusted content density");

  /* ---------- PAGES ---------- */
  const pPages = listNames(prev.site?.pages, "id");
  const nPages = listNames(next.site?.pages, "id");
  const pd = diffArrays(pPages, nPages);

  pd.added.forEach(p => {
    changes.push(`added a ${p} page`);
  });

  pd.removed.forEach(p => {
    changes.push(`removed the ${p} page`);
  });

  /* ---------- SECTIONS (HOME) ---------- */
  const pHome = prev.site?.pages?.find(p => p.id === "home");
  const nHome = next.site?.pages?.find(p => p.id === "home");

  if (pHome && nHome){
    const pSec = listNames(pHome.sections, "type");
    const nSec = listNames(nHome.sections, "type");

    const sd = diffArrays(pSec, nSec);

    sd.added.forEach(s => {
      changes.push(`added a ${s} section on the homepage`);
    });

    sd.removed.forEach(s => {
      changes.push(`removed the ${s} section from the homepage`);
    });

    // reorder detection (simple but effective)
    if (pSec.join(",") !== nSec.join(",")){
      changes.push("reordered sections on the homepage");
    }
  }

  if (!changes.length) return { summary:null, changes:[] };

  const summary =
    "I " +
    changes
      .map((c,i) => i === 0 ? c : c)
      .join(", ") +
    ".";

  return { summary, changes };
}
