import { test, describe, afterAll, beforeAll } from "vitest";
import { join } from "node:path";
import {
  mkdirSync,
  copyFileSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import {
  deployTarget,
  getDeployConfig,
  IDeployConfigItem,
} from "../src/commands/deploy";

const pwd = join(process.cwd(), "test");
const tmpPath = join(
  process.cwd(),
  `.tmp/test/${Math.random().toString(36).substring(7)}`,
);
const rootConfig = await getDeployConfig({ pwd, stage: "myapp-dev" });

// check if endpoint is reachable
const shouldSkip =
  !rootConfig.endpoint ||
  (await fetch(rootConfig.endpoint)
    .catch((e) => true)
    .then(() => false));

function makeConfig(
  config: Omit<Partial<IDeployConfigItem>, "s3"> & {
    s3?: Partial<IDeployConfigItem["s3"]>;
  },
) {
  return {
    deploy: [
      {
        name: "default",
        buildPath: "app",
        ...config,
        s3: {
          region: "us-west-2",
          bucket: "deploy-bucket",
          endpoint: rootConfig.endpoint,
          ...config.s3,
        },
      },
    ],
  };
}

describe("deploy command", ({ skip }) => {
  if (shouldSkip)
    return skip("S3 Endpoint not reachable, is S3Mock Docker running?");

  beforeAll(() => {
    mkdirSync(tmpPath, { recursive: true });
  });

  afterAll(() => {
    // cleanup
    try {
      rmSync(tmpPath, { recursive: true, force: true });
    } catch (e) {}
  });

  const testArgs = {
    pwd,
    ci: true,
  };

  test("deploy", async ({ expect, skip }) => {
    const prefix = `test-${Math.random().toString(36).substring(7)}/`;

    {
      // upload initial batch
      const results = await deployTarget(
        "default",
        makeConfig({ s3: { prefix } }),
        testArgs,
      );
      expect(results).toEqual(expect.objectContaining({ result: "success" }));
      if (!results) return;
      const { s3SyncPlan, cloudfrontInvalidations } = results;
      expect(s3SyncPlan).toEqual(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              key: `${prefix}global.css`,
              contentDisposition: "inline",
              contentType: "text/css",
              action: "Create",
              acl: undefined,
              cacheControl: "max-age=2628000, public",
              invalidate: false,
              cache: true,
            }),
          ]),
        }),
      );
    }

    {
      // nothing to do
      const results = await deployTarget(
        "default",
        makeConfig({ s3: { prefix } }),
        testArgs,
      );
      expect(results).toEqual(
        expect.objectContaining({ result: "no-changes" }),
      );
    }

    {
      // make some changes

      // copy all files to .tmp
      const testTmpPath = join(
        tmpPath,
        Math.random().toString(36).substring(7),
      );
      mkdirSync(join(testTmpPath, "app"), { recursive: true });

      writeFileSync(
        join(testTmpPath, "app/global.css"),
        // make small change
        readFileSync(join(pwd, "app/global.css")) + " ",
      );

      const results = await deployTarget(
        "default",
        makeConfig({ s3: { prefix } }),
        { ...testArgs, pwd: testTmpPath },
      );
      expect(results).toEqual(expect.objectContaining({ result: "success" }));
      if (!results) return;
      const { s3SyncPlan, cloudfrontInvalidations } = results;
      expect(s3SyncPlan).toEqual(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              acl: undefined,
              action: "Update",
              cache: true,
              cacheControl: "max-age=2628000, public",
              contentDisposition: "inline",
              contentType: "text/css",
              invalidate: true,
              key: `${prefix}global.css`,
            }),
          ]),
        }),
      );
    }
  });
});
