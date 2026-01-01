import express from "express";
import { evaluateBuild } from "../eval/evaluateBuild.js";
import { saveEval, getEvalById } from "../eval/store.js";

export function createSelfEvalRouter({ buildRoot, dataRoot }) {
  const router = express.Router();

  // POST /self-eval  { site, revision }
  router.post("/", (req, res) => {
    try {
      const { site, revision } = req.body || {};
      const evalResult = evaluateBuild({ buildRoot, site, revision });
      const saved = saveEval({ dataRoot, evalResult });
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /self-eval/:id
  router.get("/:id", (req, res) => {
    try {
      const rec = getEvalById({ dataRoot, id: req.params.id });
      if (!rec) return res.status(404).json({ error: "not found" });
      res.json(rec);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
