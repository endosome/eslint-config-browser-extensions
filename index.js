/* cspell:words endosome */
import nodeConfig from '@endosome/eslint-config-node';
import globals from 'globals';

const lintedFiles = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,html}'];
const javaScriptFiles = ['**/*.{js,jsx,mjs,cjs,html}'];

/** End-to-end tests: Node.js code that drives a browser and passes it callbacks (page.evaluate). */
export const defaultEndToEndFiles = ['test/e2e/**', '**/*.e2e.{js,mjs,cjs,ts,mts,cts}'];

/**
 * Files that run in Node.js: build scripts, tool configs, end-to-end tests that drive a browser, and every `.mjs`/`.cjs`
 * file (extension code is bundled from `.js`/`.ts`, so those two extensions are left for tooling).
 */
export const defaultNodeFiles = [
  '**/*.{mjs,cjs}',
  'scripts/**',
  'config/**',
  'tools/**',
  ...defaultEndToEndFiles,
  '**/*.config.{js,mjs,cjs,ts,mts,cts}',
];

// Every eslint-plugin-n rule the Node.js config sets: none of them applies to code that runs in a browser
const nodePluginRules = Object.fromEntries(
  nodeConfig.flatMap(config => Object.keys(config.rules ?? {})).filter(rule => rule.startsWith('n/')).map(rule => [rule, 'off'])
);

const browserGlobals = { ...globals.browser, ...globals.worker, ...globals.serviceworker, ...globals.webextensions };

// The web platform APIs eslint-plugin-n knows (navigator, crypto, URL.createObjectURL, ...): in an end-to-end test they
// are called in the browser, inside the callbacks the test passes to it, so the Node.js version does not matter
const nodePlugin = nodeConfig.find(config => config.plugins?.n).plugins.n;
const [nodeBuiltinsOptions] = nodePlugin.rules['no-unsupported-features/node-builtins'].meta.schema;
const webPlatformNames = nodeBuiltinsOptions.properties.ignores.items.enum.filter(
  name => typeof name === 'string' && name.split('.')[0] in globals.browser
);

// Node.js-only names (process, Buffer, require, __dirname, ...) are not defined in a browser
const nodeOnlyGlobals = Object.fromEntries(
  Object.keys({ ...globals.node, ...globals.nodeBuiltin }).filter(name => !(name in browserGlobals)).map(name => [name, 'off'])
);

/**
 * The Node.js config with the code of a browser extension (background service worker, content scripts, scripts
 * injected into pages, extension pages, web workers) linted as browser code. `nodeFiles` run in Node.js and keep the
 * Node.js rules; in `endToEndFiles` the web platform APIs are left to the browser that runs them.
 */
// plain JavaScript has no return type to write
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function browserExtensions({ endToEndFiles = defaultEndToEndFiles, nodeFiles = defaultNodeFiles } = {}) {
  return [
    ...nodeConfig,
    {
      name: 'endosome/browser-extensions/browser',
      files: lintedFiles,
      ignores: nodeFiles,
      languageOptions: { globals: { ...nodeOnlyGlobals, ...browserGlobals } },
      rules: {
        ...nodePluginRules,
        // extension code mostly posts to a runtime Port, a MessagePort or a worker, which take no target origin; the
        // rule cannot tell them from window.postMessage
        'unicorn/require-post-message-target-origin': 'off',
      },
    },
    {
      name: 'endosome/browser-extensions/browser-javascript',
      files: javaScriptFiles,
      ignores: nodeFiles,
      // TypeScript reports undefined names itself; in JavaScript a Node.js-only name in a page script is a bug
      rules: { 'no-undef': 'error' },
    },
    {
      name: 'endosome/browser-extensions/node',
      files: nodeFiles,
      languageOptions: { globals: globals.node },
    },
    {
      name: 'endosome/browser-extensions/end-to-end',
      files: endToEndFiles,
      rules: {
        'n/no-unsupported-features/node-builtins': ['error', { ignores: webPlatformNames }],
        'unicorn/require-post-message-target-origin': 'off',
      },
    },
  ];
}

export default browserExtensions();
