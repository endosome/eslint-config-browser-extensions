# @endosome/eslint-config-browser-extensions

A shared [ESLint](https://eslint.org) flat config for browser extensions written in TypeScript (or JavaScript). It is
[`@endosome/eslint-config-node`](https://www.npmjs.com/package/@endosome/eslint-config-node), with the rule set
unchanged, plus the parts that tell the code a browser runs from the code Node.js runs. It supports **ESLint 10 only**.

## What it adds to the Node.js config

**Browser code** (background service worker, content scripts, scripts injected into pages, extension pages, web
workers) is every linted file outside the Node.js files below:

- No `eslint-plugin-n` rule applies. They check Node.js: `fetch`, `crypto`, `navigator`, `Blob` or `structuredClone`
  are browser APIs here, not "unsupported Node.js features".
- Browser, worker, service worker and WebExtension globals (`chrome`, `browser`) are defined, and the names only Node.js
  has (`process`, `Buffer`, `require`, `__dirname`, ...) are not. `no-undef` is on for JavaScript, so a Node.js name in a
  page script is reported; TypeScript reports undefined names itself.
- `unicorn/require-post-message-target-origin` is off: extension code posts to runtime Ports, MessagePorts and workers,
  which take no target origin, and the rule cannot tell them from `window.postMessage`.

**Node.js files** keep the Node.js config as it is, with Node.js globals. By default they are:

- `scripts/**`, `config/**`, `tools/**`, `**/*.config.*`
- every `.mjs` and `.cjs` file (extension code is bundled from `.js`/`.ts`)
- end-to-end tests: `test/e2e/**` and `**/*.e2e.*`

**End-to-end tests** run in Node.js but pass callbacks to the browser they drive (`page.evaluate`). In them,
`n/no-unsupported-features/node-builtins` ignores the web platform APIs it knows (`navigator`, `crypto`,
`URL.createObjectURL`, ...), since the browser runs those calls; Node.js-only APIs are still checked.

`eslint-plugin-n` checks Node.js features against the `engines.node` range in `package.json`, so set it to the
Node.js version the project's tooling needs.

## Requirements

- ESLint `^10.0.0`
- Node.js `>=22.18.0`
- TypeScript `>=4.8.4 <6.1.0`

## Usage

```sh
npm install --save-dev eslint typescript @endosome/eslint-config-browser-extensions
```

```js
// eslint.config.js
export { default } from '@endosome/eslint-config-browser-extensions';
```

Project rules go after it, as with the Node.js config:

```js
import config from '@endosome/eslint-config-browser-extensions';

export default [
  ...config,
  { ignores: ['vendor/**'] },
];
```

Other Node.js or end-to-end files are chosen with `browserExtensions`:

```js
import { browserExtensions, defaultEndToEndFiles, defaultNodeFiles } from '@endosome/eslint-config-browser-extensions';

export default browserExtensions({
  nodeFiles: [...defaultNodeFiles, 'packaging/**'],
  // scripts that drive a browser like the end-to-end tests do
  endToEndFiles: [...defaultEndToEndFiles, 'scripts/live/**'],
});
```

Type information, ignores and everything else work as in `@endosome/eslint-config-node`; see its README.

## License

MIT.
