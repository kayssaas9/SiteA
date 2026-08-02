import express from "express";
import generationsRoute from "../../server/routes/generations.js";

const app = express();
app.use("/", generationsRoute);

export default function handler(req, res) {
  req.url = `/${req.query.generationId}`;
  return app(req, res);
}