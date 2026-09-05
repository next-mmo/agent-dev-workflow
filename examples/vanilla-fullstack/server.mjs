import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(root, "public")));

app.get("/api/hello", (_request, response) => {
  response.json({ message: "Hello from Express" });
});

const port = Number(process.env.PORT || 3000);
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => console.log(`http://localhost:${port}`));
}

export default app;
