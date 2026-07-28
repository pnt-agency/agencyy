// Password strength scoring for the signup and reset forms.
//
// This is purely advisory: `evaluatePassword` produces a 0-4 score and concrete
// suggestions, and nothing here blocks a submission. The only enforced rule is
// the 8-character minimum in lib/validation.ts — someone who reads "Very weak"
// and submits anyway gets the account they asked for.

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  score: PasswordScore;
  label: string;
  suggestions: string[];
};

export type PasswordContext = {
  email?: string;
  name?: string;
};

const SCORE_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;

// The passwords guessed first in real attacks, plus the ones this site invites
// ("amaris", "partners"). Not exhaustive by design — it exists to make the
// meter say "Very weak" about the obvious cases, not to be a complete corpus.
const COMMON_PASSWORDS = new Set([
  "password", "passwort", "passw0rd", "pass", "secret", "letmein", "welcome",
  "admin", "administrator", "root", "guest", "user", "test", "demo", "login",
  "qwerty", "qwertyui", "qwertyuiop", "azerty", "asdfgh", "asdfghjk", "zxcvbn",
  "zxcvbnm", "123456", "1234567", "12345678", "123456789", "1234567890",
  "111111", "000000", "abc123", "abcd1234", "a1b2c3d4", "iloveyou", "princess",
  "sunshine", "monkey", "dragon", "football", "baseball", "superman", "batman",
  "trustno1", "starwars", "master", "shadow", "michael", "jennifer", "jordan",
  "hunter", "freedom", "whatever", "computer", "internet", "changeme",
  "amaris", "amarispartners", "partners", "remote", "talent", "employer",
]);

type CharacterClasses = {
  lower: boolean;
  upper: boolean;
  digit: boolean;
  symbol: boolean;
};

function characterClasses(password: string): CharacterClasses {
  return {
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

function classCount(classes: CharacterClasses): number {
  return Object.values(classes).filter(Boolean).length;
}

/** Three or more of the same character in a row ("aaa", "!!!"). */
function hasRepeatedRun(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

/**
 * Four or more consecutive code points running in either direction ("1234",
 * "abcd", "dcba"). Keyboard walks like "qwerty" are covered by the blocklist.
 */
function hasSequentialRun(password: string): boolean {
  const lower = password.toLowerCase();
  let ascending = 1;
  let descending = 1;
  for (let i = 1; i < lower.length; i++) {
    const delta = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    ascending = delta === 1 ? ascending + 1 : 1;
    descending = delta === -1 ? descending + 1 : 1;
    if (ascending >= 4 || descending >= 4) return true;
  }
  return false;
}

/**
 * Strips a trailing digit/symbol suffix so "password1" and "letmein!" are
 * recognised as the blocklisted words they are.
 */
function baseWord(password: string): string {
  return password.toLowerCase().replace(/[\d!@#$%^&*_.\-+]+$/, "");
}

function isCommon(password: string): boolean {
  const lower = password.toLowerCase();
  return COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(baseWord(password));
}

/**
 * Personal terms worth refusing: the email local part and each name word. Short
 * fragments are skipped — someone called "Jo" shouldn't be barred from every
 * password containing "jo".
 */
function personalTerms({ email, name }: PasswordContext): string[] {
  const terms: string[] = [];
  const localPart = email?.split("@")[0]?.trim().toLowerCase();
  if (localPart) terms.push(localPart);
  for (const word of name?.trim().toLowerCase().split(/\s+/) ?? []) {
    terms.push(word);
  }
  return terms.filter((term) => term.length >= 4);
}

function containsPersonalInfo(password: string, context: PasswordContext): boolean {
  const lower = password.toLowerCase();
  return personalTerms(context).some((term) => lower.includes(term));
}

/**
 * Advisory 0-4 score plus the specific things that would improve it. Length is
 * weighted above variety because it contributes far more entropy per keystroke.
 */
export function evaluatePassword(
  password: string,
  context: PasswordContext = {}
): PasswordStrength {
  const suggestions: string[] = [];

  if (!password) {
    return { score: 0, label: SCORE_LABELS[0], suggestions: [] };
  }

  const classes = characterClasses(password);
  const variety = classCount(classes);

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;

  // Guessability caps beat any amount of length/variety credit: "Passw0rd!" is
  // long and varied and still on every cracking list.
  const common = isCommon(password);
  const personal = containsPersonalInfo(password, context);
  const repeated = hasRepeatedRun(password);
  const sequential = hasSequentialRun(password);

  // Anything below the enforced minimum reads as "Very weak" regardless of how
  // varied it is — the meter shouldn't say "Fair" about a password the form
  // will refuse.
  if (common || personal || password.length < MIN_PASSWORD_LENGTH) score = 0;
  else if (repeated || sequential) score = Math.min(score, 1);

  score = Math.max(0, Math.min(4, score)) as PasswordScore;

  if (password.length < MIN_PASSWORD_LENGTH) {
    suggestions.push(`Use at least ${MIN_PASSWORD_LENGTH} characters`);
  } else if (password.length < 12) {
    suggestions.push("Make it 12 characters or longer");
  }
  if (common) suggestions.push("Avoid common passwords — this one is easy to guess");
  if (personal) suggestions.push("Leave your name and email out of it");
  if (repeated) suggestions.push("Avoid repeating the same character");
  if (sequential) suggestions.push("Avoid runs like 1234 or abcd");
  if (variety < 3) {
    const missing: string[] = [];
    if (!classes.lower) missing.push("a lowercase letter");
    if (!classes.upper) missing.push("an uppercase letter");
    if (!classes.digit) missing.push("a number");
    if (!classes.symbol) missing.push("a symbol");
    if (missing.length) suggestions.push(`Mix in ${missing.slice(0, 2).join(" and ")}`);
  }

  return {
    score: score as PasswordScore,
    label: SCORE_LABELS[score],
    suggestions,
  };
}
