import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { getCredentials } from "./aws.helper";
import { logInfo } from "./cli.helper";
import { S3SyncPlan } from "./aws-s3.helper";

export function getCloudfrontClientInstance(options: {
  region: string;
  endpoint?: string;
}) {
  const endpoint = options.endpoint || process.env.AWS_CLOUDFRONT_ENDPOINT;
  return new CloudFrontClient({
    credentials: getCredentials({ region: options.region }),
    region: options.region,
    endpoint,
  });
}

export function prepareCloudfrontInvalidation(plan: S3SyncPlan): string[] {
  const { items } = plan;
  return [
    ...items.reduce((acc, item) => {
      if (item.invalidate) {
        /**
         * Non-ASCII or unsafe characters in the path
         * If the path includes non-ASCII characters or unsafe characters as defined in RFC 1738, URL-encode those characters. Do not URL-encode any other characters in the path, or CloudFront will not invalidate the old version of the updated file.
         * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html#invalidation-specifying-objects-paths
         *
         * Encode unsafe characters
         */
        const key = encodeURI(item.remote!.key);
        acc.push(`/${key}`);
      }
      return acc;
    }, [] as string[]),
  ];
}

export async function executeCloudfrontInvalidation(
  invalidations: string[],
  distributionsId: string[],
  region: string,
) {
  for (const DistributionId of distributionsId) {
    const client = getCloudfrontClientInstance({ region });
    logInfo(`Invalidating ${DistributionId}`);
    await client.send(
      new CreateInvalidationCommand({
        DistributionId,
        InvalidationBatch: {
          CallerReference: new Date().toISOString(),
          Paths: {
            Quantity: invalidations.length,
            Items: invalidations,
          },
        },
      }),
    );
  }
}
