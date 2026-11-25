/** The same limits apply to administrator-issued and user-selected passwords. */
export function isValidPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 1024;
}
