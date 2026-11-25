import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { isValidPassword } from './password-policy';

test('password policy accepts only strings between 12 and 1024 characters', () => {
  assert.equal(isValidPassword('a'.repeat(11)), false);
  assert.equal(isValidPassword('a'.repeat(12)), true);
  assert.equal(isValidPassword('a'.repeat(1024)), true);
  assert.equal(isValidPassword('a'.repeat(1025)), false);
  assert.equal(isValidPassword(null), false);
});
