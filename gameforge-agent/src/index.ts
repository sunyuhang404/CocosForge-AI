import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.on("error", (error) => {
  console.error(error);
});

app.listen(port, () => {
  console.log(`Koa server ready at http://localhost:${port}`);
});
