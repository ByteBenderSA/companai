/** Message for a failed Firestore read/write. */
export function dataErrorMessage(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (code === 'permission-denied') return "You don't have permission to do that. Try logging out and back in.";
  if (code === 'unavailable') return "Can't reach the database. Check your internet connection.";
  if (code === 'failed-precondition') return 'The database is still being set up (missing index). Ask your instructor to deploy the Firestore indexes.';
  return 'Something went wrong saving or loading your data. Please try again.';
}
