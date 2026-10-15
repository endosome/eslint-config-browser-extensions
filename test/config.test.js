import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ESLint } from 'eslint';

import { browserExtensions, defaultNodeFiles } from '../index.js';

const cwd = new URL('fixtures/', import.meta.url).pathname;

const lint = async (file, overrideConfig) => {
  const eslint = new ESLint({ cwd, overrideConfigFile: overrideConfig ? true : 'eslint.config.js', overrideConfig });
  const [result] = await eslint.lintFiles([file]);

  return result.messages;
};
const rulesOf = messages => new Set(messages.map(message => message.ruleId));

test('browser APIs in extension code are not reported as unsupported Node.js features', async () => {
  const messages = await lint('src/background.ts');

  assert.deepEqual(messages.filter(message => message.fatal), []);
  assert.deepEqual(
    messages.filter(message => message.ruleId?.startsWith('n/')),
    [],
    'no eslint-plugin-n rule reports browser code'
  );
  assert.ok(!rulesOf(messages).has('unicorn/require-post-message-target-origin'), 'Port.postMessage takes no origin');
});

test('extension and browser globals are defined in JavaScript; Node.js-only ones are not', async () => {
  const messages = await lint('src/content.js');
  const undefinedNames = messages.filter(message => message.ruleId === 'no-undef').map(message => message.message);

  assert.deepEqual(undefinedNames, ["'process' is not defined."]);
});

test('build scripts keep the Node.js rules', async () => {
  const messages = await lint('scripts/build.mjs');

  assert.deepEqual(messages.filter(message => message.fatal), []);
  assert.ok(rulesOf(messages).has('n/no-deprecated-api'), 'url.parse is reported');
  assert.ok(!rulesOf(messages).has('no-undef'), 'process is a global in Node.js');
});

test('end-to-end tests may call web platform APIs in the callbacks they pass to the browser', async () => {
  const messages = await lint('test/e2e/page.e2e.ts');

  assert.deepEqual(messages.filter(message => message.fatal), []);
  assert.ok(!rulesOf(messages).has('n/no-unsupported-features/node-builtins'), 'navigator is not checked against Node.js');
});

test('the Node.js files can be chosen', async () => {
  const messages = await lint('src/content.js', browserExtensions({ nodeFiles: ['src/**'] }));

  assert.ok(!rulesOf(messages).has('no-undef'));
  assert.ok(defaultNodeFiles.includes('scripts/**'));
});
