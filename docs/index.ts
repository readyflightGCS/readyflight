import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/": index
    }
});

console.log(`Listening on ${server.url}`);
