import 'server-only';

function requiredServerEnv(name: 'DATABASE_URL'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export const databaseUrl = requiredServerEnv('DATABASE_URL');
