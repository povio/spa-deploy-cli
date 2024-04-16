import { test } from "node:test";
import { generateIni } from "./bootstrap";
import assert from "assert";
import { resolveZeConfigItem } from "../helpers/ze-config";

const __dirname = new URL(".", import.meta.url).pathname;

process.env.APP_VERSION = "0.0.1";

test("bootstrap env", async () => {
  //const destination = "./.test-example.env";

  const data = await resolveZeConfigItem(
    {
      //name: "test",
      //destination,
      values: [
        {
          name: "@",
          config: {
            APP_RELEASE: "${func:release}",
            APP_STAGE: "${func:stage}",
            APP_VERSION: "${env:APP_VERSION}",
            STATIC_URL: "https://static.example.com",
            NEXT_PUBLIC_SENTRY_CDN: "https://public@sentry.example.com/1",
          },
        },
      ],
    },
    {
      awsRegion: "us-east-1",
      release: "semiprecious",
    },
    __dirname,
    "myapp-dev",
  );

  assert.equal(
    generateIni(data),
    `APP_RELEASE="semiprecious"
APP_STAGE="myapp-dev"
APP_VERSION="0.0.1"
STATIC_URL="https://static.example.com"
NEXT_PUBLIC_SENTRY_CDN="https://public@sentry.example.com/1"`,
  );
});
