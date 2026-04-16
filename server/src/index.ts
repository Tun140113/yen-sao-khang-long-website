import { env } from "./env.js";
import { app } from "./server.js";

const start = async () => {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
};

start();

