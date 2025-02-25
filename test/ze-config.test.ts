import { test, describe } from "vitest";
import { resolveZeConfigItem } from "../src/helpers/ze-config";

describe("ze-config", () => {
  test("ze-config", async ({ expect }) => {
    process.env.MYAPP_RECORD1 = "value 1";
    process.env.MYAPP_RECORD2 = "value 2";
    process.env.MYAPP_RECORD3 = "value 3";

    const stage = "myapp-dev";

    const config = await resolveZeConfigItem(
      {
        //name: "test",
        //destination: "./test.zeconfig.yml",
        values: [
          { name: "database__name", value: "test" },
          { name: "database__username2", value: "test" },
          { name: "database__password", valueFrom: "env:MYAPP_RECORD3" },
          {
            name: "@",
            configFrom: "template",
          },
          //{
          //  name: "@",
          //  treeFrom: "arn:aws:ssm:::parameter/myapp-dev/",
          //},
        ],
      },
      {
        release: "xxxxxxxxxxxx",
        awsRegion: "us-east-1",
      },
      new URL(".", import.meta.url).pathname,
      stage,
    );

    expect(config).toEqual({
      database: {
        name: "test",
        username2: "test",
        password: "value 3",
      },
      APP_RELEASE: "xxxxxxxxxxxx",
      APP_STAGE: "myapp-dev",
      APP_VERSION: undefined,
      NEXT_PUBLIC_SENTRY_CDN: "https://public@sentry.example.com/1",
      STATIC_URL: "https://static.example.com",
    });
  });
});
