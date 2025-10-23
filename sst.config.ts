/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST Configuration for Fit For Purpose (FFP)
 *
 * This configuration defines the infrastructure for the FFP platform.
 * Region: eu-west-2 (London) - UK-based audience
 * Stages: dev, staging (prod to be added later)
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
    // Stacks will be added in subsequent subtasks (FFP-26 onwards)
    // This is the foundation - infrastructure components will be defined here
  },
});
