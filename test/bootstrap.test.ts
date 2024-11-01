import { test } from "vitest";
import { bootstrap } from "../src/commands/bootstrap";
import fs from "fs";
import path from "path";

const __dirname = new URL(".", import.meta.url).pathname;

process.env.APP_VERSION = "0.0.1";

test("inject from config", async ({ expect }) => {
  await bootstrap({
    verbose: true,
    pwd: new URL(".", import.meta.url).pathname,
    stage: "myapp-dev",
    release: "xxxxxxxxx",
  });

  const outputPath = path.join(__dirname, ".myapp-dev.resolved.env");
  const output = fs.readFileSync(outputPath, "utf-8");
  fs.unlinkSync(outputPath);
  expect(output).toEqual(
    `APP_RELEASE="xxxxxxxxx"
APP_STAGE="myapp-dev"
APP_VERSION="0.0.1"
STATIC_URL="https://static.example.com"
NEXT_PUBLIC_SENTRY_CDN="https://public@sentry.example.com/1"`,
  );
});

test("inject from html", async ({ expect }) => {
  const outputPath = path.join(__dirname, "myapp-stg.final.html");
  await bootstrap({
    verbose: true,
    pwd: new URL(".", import.meta.url).pathname,
    stage: "myapp-stg",
    release: "xxxxxxxxx",
  });

  const output = fs.readFileSync(outputPath, "utf-8");
  fs.unlinkSync(outputPath);

  expect(output).toContain(
    '<script id="env-data">window.__ENV__ = {"APP_RELEASE":"xxxxxxxxx","APP_STAGE":"myapp-stg","APP_VERSION":"0.0.1","STATIC_URL":"https://static.example.com","NEXT_PUBLIC_SENTRY_CDN":"https://public@sentry.example.com/1"}</script>',
  );
});
