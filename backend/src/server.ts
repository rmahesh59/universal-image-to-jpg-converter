import express from "express";
import cors from "cors";
import { router } from "./routes";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(
  cors({
    origin: "*", // allow all origins (including local phone IP) for this local app
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/api", router);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`HEIC converter backend listening on http://localhost:${port}`);
});
