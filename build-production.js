import { build } from 'esbuild';
import { execSync } from 'child_process';

// First build the frontend
console.log('Building frontend...');
execSync('npx vite build', { stdio: 'inherit' });

// Then build the backend using the production-only entry point
console.log('Building backend...');
await build({
  entryPoints: ['server/index-production.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external'
});

console.log('Production build complete!');