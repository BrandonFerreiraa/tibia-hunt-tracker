const TRANSLATIONS = {
  'New password should be different from the old password.':
    'A nova senha precisa ser diferente da senha atual.',
}

export function translateAuthError(message) {
  return TRANSLATIONS[message] || message
}
