export const requiredEnv = (key: string, env: NodeJS.ProcessEnv = process.env): string => {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};
