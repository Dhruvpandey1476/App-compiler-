require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { runPipeline } = require("./pipeline");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/compile", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: "prompt is required" });
  try {
    const result = await runPipeline(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok" }));
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`App Compiler API on http://localhost:${PORT}`));
