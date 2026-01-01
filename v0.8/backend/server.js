/* v0.8.x — Deterministic Components + Output Normalization (STABLE) */
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

const app = express();
const PORT = 3001;

const ROOT = "C:/Users/mikef/AI_Platform/v0.8/backend/builds";
const FRONTEND = "C:/Users/mikef/AI_Platform/v0.8/frontend";

app.use(cors());
app.use(express.json({ limit: "15mb" }));

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function write(p,c){ ensureDir(path.dirname(p)); fs.writeFileSync(p,c,"utf8"); }

function extractJSON(text){
  const s=text.indexOf("{"), e=text.lastIndexOf("}");
  if(s===-1||e===-1) throw new Error("No JSON block");
  return text.slice(s,e+1);
}

/* 🔑 Normalize ANY model output into { files: [] } */
function normalizeSite(raw){
  if (Array.isArray(raw.files)) return raw;

  const files = [];
  for (const [key, value] of Object.entries(raw)) {
    if (key.endsWith(".html") || key.endsWith(".css") || key.endsWith(".js")) {
      files.push({ path: key, content: value });
    }
  }

  return {
    title: raw.title || "Generated Site",
    files
  };
}

/* 🔑 Deterministic component injection */
function injectComponents(html){
  const components = [
    { name: "hero", regex: /<header[\s\S]*?<\/header>/i },
    { name: "testimonials", regex: /<section[^>]*testimonials[\s\S]*?<\/section>/i },
    { name: "pricing", regex: /<section[^>]*pricing[\s\S]*?<\/section>/i },
    { name: "footer", regex: /<footer[\s\S]*?<\/footer>/i }
  ];

  let output = html;

  for(const c of components){
    output = output.replace(c.regex, match => {
      if(match.includes(`COMPONENT:${c.name}`)) return match;
      return `<!-- COMPONENT:${c.name} -->\n${match}\n<!-- END COMPONENT:${c.name} -->`;
    });
  }

  return output;
}

function extractComponents(html){
  const regex=/<!-- COMPONENT:(.*?) -->([\s\S]*?)<!-- END COMPONENT:\1 -->/g;
  const map={}; let m;
  while((m=regex.exec(html))) map[m[1]]=m[2];
  return map;
}

function injectComponent(html,name,content){
  const block=new RegExp(
    `<!-- COMPONENT:${name} -->[\\s\\S]*?<!-- END COMPONENT:${name} -->`,
    "g"
  );
  return html.replace(block,
    `<!-- COMPONENT:${name} -->\n${content}\n<!-- END COMPONENT:${name} -->`
  );
}

async function generateFullSite(prompt){
  const res = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    temperature:0.3,
    messages:[
      {role:"system",content:"You generate websites. Return JSON only."},
      {role:"user",content:prompt}
    ]
  });

  const raw = JSON.parse(extractJSON(res.choices[0].message.content));
  return normalizeSite(raw);
}

async function generateComponent(prompt,name,prior){
  const res = await openai.chat.completions.create({
    model:"gpt-4o-mini",
    temperature:0.3,
    messages:[
      {role:"system",content:`Edit ONLY the ${name} component. Return HTML only.`},
      {role:"assistant",content:prior},
      {role:"user",content:prompt}
    ]
  });

  return res.choices[0].message.content;
}

app.use("/app",express.static(FRONTEND));
app.use("/builds",express.static(ROOT));

app.post("/generate-site",async(req,res)=>{
  try{
    if(!openai) return res.status(400).json({error:"OPENAI_API_KEY missing"});
    const {prompt,base_build_id,target_component}=req.body;

    const id=base_build_id||uuidv4();
    const dir=path.join(ROOT,id);
    ensureDir(dir);

    const indexPath=path.join(dir,"index.html");

    /* Component update */
    if(target_component && fs.existsSync(indexPath)){
      const html=fs.readFileSync(indexPath,"utf8");
      const components=extractComponents(html);
      if(!components[target_component])
        return res.status(400).json({error:`Component '${target_component}' not found`});

      const updated=await generateComponent(prompt,target_component,components[target_component]);
      write(indexPath,injectComponent(html,target_component,updated));

      return res.json({
        build_id:id,
        updated_component:target_component,
        preview_url:`http://localhost:${PORT}/builds/${id}/index.html`
      });
    }

    /* Full generation */
    const site=await generateFullSite(prompt);

    for(const f of site.files){
      let content = f.content;
      if(f.path==="index.html"){
        content = injectComponents(content);
      }
      write(path.join(dir,f.path),content);
    }

    res.json({
      build_id:id,
      title:site.title,
      preview_url:`http://localhost:${PORT}/builds/${id}/index.html`
    });

  }catch(e){
    console.error(e);
    res.status(500).json({error:"Generation failed",detail:e.message});
  }
});

app.listen(PORT,()=>console.log(`v0.8.x (normalized + components) → http://localhost:${PORT}/app`));
