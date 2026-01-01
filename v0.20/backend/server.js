import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handleChat } from "./handlers/chat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.post("/chat", handleChat);

app.post("/export", (req, res) => {
  res.json({ ok: true });
});

app.use("/builds", express.static(path.join(__dirname, "builds")));

app.get("/", (req, res) => {
  res.send("AI Platform v0.20 running");
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("AI Platform v0.20 running on http://localhost:" + PORT);
});
