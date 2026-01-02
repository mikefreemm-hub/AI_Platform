/*
  universalBrain.js — v0.22
  Structural + multi-page refinement (About fix)
*/

function lc(v){ return String(v||"").toLowerCase().trim(); }
function clamp(n){ return Math.max(0, Math.min(1, Number(n))); }
function cap(s){ return s ? s[0].toUpperCase()+s.slice(1) : s; }

function getPages(spec){ return spec.site.pages; }
function findPage(pages, id){ return pages.find(p => p.id === id); }

function ensurePage(pages, id, title){
  let page = findPage(pages, id);
  if (page) return page;

  page = {
    id,
    title,
    sections: []
  };
  pages.push(page);
  return page;
}

export async function createNewSpec(prompt){
  const title = cap(prompt.replace(/^(create|make|build)\s+/i,"").slice(0,48));

  return {
    site:{
      title,
      theme:{ mode:"light", accent:"indigo" },
      intent:{ global:{ calm:0.55,salesiness:0.55,density:0.55,warmth:0.55 }},
      pages:[{
        id:"home",
        title:"Home",
        sections:[
          {
            type:"hero",
            headline:`${title} — made simple`,
            subhead:"A clean, fast website built from natural language.",
            ctaPrimary:"Get Started",
            ctaSecondary:"Learn More"
          },
          {
            type:"features",
            title:"Key Features",
            items:[
              { title:"Natural language generation", body:"Describe what you want." },
              { title:"Chat-style refinement", body:"Refine it conversationally." },
              { title:"Revision history", body:"Restore any version instantly." }
            ]
          }
        ]
      }]
    },
    __genericText:""
  };
}

export function applyDeferredIntent(spec){
  const text = lc(spec.__genericText);
  if (!text) return spec;

  const intent = spec.site.intent.global;
  const theme  = spec.site.theme;
  const pages  = getPages(spec);

  /* intent */
  if (text.includes("dark")) theme.mode="dark";
  if (text.includes("light")) theme.mode="light";
  if (text.includes("less salesy")) intent.salesiness=clamp(intent.salesiness-0.2);

  /* ABOUT PAGE (FIX) */
  if (text.includes("add about page")){
    const about = ensurePage(pages,"about","About");

    if (!about.sections.length){
      about.sections.push(
        {
          type:"hero",
          headline:"About this project",
          subhead:"Why this site exists and who it’s for."
        },
        {
          type:"content",
          body:
            "This website was created using natural language. " +
            "Every section, layout choice, and revision was generated and refined through conversation."
        }
      );
    }
  }

  /* PRICING PAGE */
  if (text.includes("add pricing page")){
    const pricing = ensurePage(pages,"pricing","Pricing");

    if (!pricing.sections.length){
      pricing.sections.push({
        type:"pricing",
        title:"Pricing",
        items:[
          { name:"Starter", price:"$0", bullets:["Basic site","Unlimited edits"] },
          { name:"Pro", price:"$19/mo", bullets:["Revisions","Export HTML"] }
        ]
      });
    }
  }

  return spec;
}
