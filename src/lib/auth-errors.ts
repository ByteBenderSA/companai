/** Turn a Firebase Auth error into a message a student understands. */
export function authErrorMessage(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'That email and password don\'t match an account. Check them, or reset your password.';
    case 'auth/invalid-email':
      return 'That doesn\'t look like a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/weak-password':
      return 'Choose a stronger password — at least 6 characters.';
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes, or reset your password.';
    case 'auth/network-request-failed':
      return 'Couldn\'t reach the server. Check your internet connection.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google sign-in window was closed before finishing.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn\'t enabled for this app. Ask your instructor to enable it in Firebase.';
    case 'auth/unauthorized-domain':
      return 'This website isn\'t authorised for sign-in yet. Ask your instructor to add it in Firebase → Authentication → Settings.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/** Popup closed by the user is not worth an error toast. */
export function isUserCancelled(err: unknown): boolean {
  const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request';
}
