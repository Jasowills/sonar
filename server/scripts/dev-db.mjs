import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const replSet = await MongoMemoryReplSet.create({
  replSet: { name: 'rs0', count: 1, dbName: 'watchDog' },
});

const baseUri = replSet.getUri();
const uri = baseUri.includes('/?')
  ? baseUri.replace('/?', '/watchDog?')
  : `${baseUri.replace(/\/?$/, '')}/watchDog`;
process.env.DATABASE_URL = uri;

console.log(`\n  Local MongoDB running at ${uri}\n`);

const serverDir = resolve(__dirname, '..');

const push = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: uri, PATH: process.env.PATH },
});

await new Promise((resolve, reject) => {
  push.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`prisma db push exited with code ${code}`));
  });
});

console.log(`\n  Starting Sonar API...\n`);

const nest = spawn('npx', ['nest', 'start', '--watch'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: uri, PATH: process.env.PATH },
});

nest.on('close', (code) => {
  replSet.stop().then(() => process.exit(code ?? 0));
});

const cleanup = () => {
  nest.kill();
  replSet.stop();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
