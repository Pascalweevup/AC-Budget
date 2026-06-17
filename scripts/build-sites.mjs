import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const html = await readFile(join(root, "index.html"), "utf8");

await rm(dist, { force: true, recursive: true });
await mkdir(join(dist, "server", "public"), { recursive: true });
await mkdir(join(dist, ".openai"), { recursive: true });

await writeFile(join(dist, "server", "public", "index.html"), html);
await copyFile(join(root, "public", "screenshot.jpeg"), join(dist, "server", "public", "screenshot.jpeg"));
await writeFile(
  join(dist, ".openai", "hosting.json"),
  await readFile(join(root, ".openai", "hosting.json"), "utf8")
);

const worker = `const html = ${JSON.stringify(html)};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname !== "/" && url.pathname !== "/index.html") {
      return new Response("Not Found", { status: 404 });
    }

    return new Response(request.method === "HEAD" ? null : html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60"
      }
    });
  }
};
`;

await writeFile(join(dist, "server", "index.js"), worker);
