import express from "express";
import bodyParser from "body-parser";

import { interpretPlan } from "./plan/interpretPlan.js";
import { planToSpec } from "./plan/planToSpec.js";
import runFull from "./executor/runFull.js";

let currentPlan = null;

const app = express();
app.use(bodyParser.json());
app.use("/", express.static("public"));

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    // 1️⃣ Update semantic plan
    currentPlan = interpretPlan(message, currentPlan);

    // 2️⃣ Convert plan → spec
    const spec = planToSpec(currentPlan);

    // 3️⃣ Render site
    const result = await runFull(spec, {});

    // 4️⃣ Respond
    res.json({
      files: result.files,
      assistant: {
        role: "assistant",
        content: "Updated the site based on your request."
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("v0.23 running at http://localhost:3001");
});
