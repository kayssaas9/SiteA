import express from "express";
import generationsRoute from "../../server/routes/generations.js";

const app = express();
app.use("/", generationsRoute);

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  req.url = `/${req.query.generationId}`;
  return app(req, res);
}