/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST Configuration for Fit For Purpose (FFP)
 *
 * This configuration defines the infrastructure for the FFP platform.
 * Region: eu-west-2 (London) - UK-based audience
 * Stages: dev, staging (prod to be added later)
 *
 * VPC Strategy (Phase 1):
 * - Using AWS default VPC to avoid NAT Gateway costs (~£30-35/month)
 * - Resources (RDS, Lambda) will automatically use default VPC when no `vpc` prop specified
 * - Custom VPC with private subnets will be added pre-production (see FFP-101)
 */
export default $config({
  app(input) {
    return {
      name: 'ffp',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-west-2', // London region for UK-based audience
        },
      },
    };
  },
  async run() {
    // Infrastructure stacks will be added in subsequent subtasks:
    // - FFP-28: Lambda function stacks
    // - FFP-29: API Gateway configuration
    // - Later: RDS (FFP-10), Cognito (FFP-9), S3, etc.
    //
    // Phase 1: Resources will use AWS default VPC automatically (no `vpc` prop)
    // Production: Custom VPC will be added via FFP-101
  },
});
