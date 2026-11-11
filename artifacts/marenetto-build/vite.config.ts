import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import ts from 'typescript';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { seoPreviewPlugin } from './scripts/seo-vite-plugin.mjs';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

function localizationDraftPlugin() {
  return {
    name: 'marenetto-localization-drafts',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.endsWith('/src/App.tsx')) return null;

      const source = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const transformer: ts.TransformerFactory<ts.SourceFile> = context => root => {
        const visit = (node: ts.Node): ts.Node => {
          if (ts.isConditionalExpression(node)) {
            const condition = node.condition.getText(source).replace(/\s+/g, '');
            const italianOnTrue = condition === 'it' || condition === "lang==='it'";
            if (italianOnTrue) {
              const branchText = (branch: ts.Node) => {
                const texts: string[] = [];
                const collect = (child: ts.Node) => {
                  if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) texts.push(child.text);
                  if (ts.isJsxText(child)) texts.push(child.text);
                  ts.forEachChild(child, collect);
                };
                collect(branch);
                return texts.map(text => text.trim()).filter(Boolean);
              };
              const allText = [...branchText(node.whenTrue), ...branchText(node.whenFalse)];
              const codeOnly = allText.length > 0 && allText.every(text =>
                /^[a-z]{2}(?:[-_][a-zA-Z]{2,3})?$/.test(text) || /^[A-Z]{2}$/.test(text),
              );
              if (allText.length > 0 && !codeOnly) {
                return ts.factory.createCallExpression(
                  ts.factory.createIdentifier('__localizeChoice'),
                  undefined,
                  [ts.factory.createIdentifier('lang'), ts.visitNode(node.whenTrue, visit) as ts.Expression, ts.visitNode(node.whenFalse, visit) as ts.Expression],
                );
              }
            }
          }
          return ts.visitEachChild(node, visit, context);
        };
        return ts.visitNode(root, visit) as ts.SourceFile;
      };
      const result = ts.transform(source, [transformer]);
      const transformed = ts.createPrinter().printFile(result.transformed[0]);
      result.dispose();
      return {
        code: `import { localizeChoice as __localizeChoice } from './localization/runtime';\n${transformed}`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    seoPreviewPlugin(),
    localizationDraftPlugin(),
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    proxy: { '/api/editorial/active': { target: 'http://localhost:80', changeOrigin: true } },
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
