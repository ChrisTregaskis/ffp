import { readFileSync } from 'fs';
import { resolve } from 'path';
import { seedVideoAssets } from '../packages/database/seed/seedVideoAssets.js';

interface SstOutputs {
  videosBucket?: string;
  region?: string;
}

/** `sst dev` and `sst deploy` write the outputs of the stage they last ran; see the database README */
const readSstOutputs = (): SstOutputs => {
  try {
    return JSON.parse(
      readFileSync(resolve(process.cwd(), '.sst/outputs.json'), 'utf8')
    ) as SstOutputs;
  } catch {
    return {};
  }
};

const argValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);

  return index === -1 ? undefined : process.argv[index + 1];
};

const outputs = readSstOutputs();
const bucket = argValue('--bucket') ?? outputs.videosBucket;
const region = argValue('--region') ?? outputs.region ?? process.env.AWS_REGION ?? 'eu-west-2';

if (!bucket) {
  console.error('No videos bucket: run sst dev (or deploy) first, or pass --bucket <name>.');
  process.exit(1);
}

seedVideoAssets({ bucket, region })
  .then((uploaded) => {
    console.log(`Video assets: ${String(uploaded)} uploaded to ${bucket}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding video assets failed:', error);
    process.exit(1);
  });
