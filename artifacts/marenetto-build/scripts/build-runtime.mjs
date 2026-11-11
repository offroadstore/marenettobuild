import { build } from 'vite';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
await build({ configFile: path.join(root,'vite.config.ts'), build: { ssr: path.join(root,'src/entry-server.tsx'), outDir: path.join(root,'dist/server'), emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'entry-server.mjs' } } } });
