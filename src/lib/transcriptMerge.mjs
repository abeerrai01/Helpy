/**
 * Overlap-aware merge for STT transcript chunks (voice-dictation "Answer Now"
 * flow). Pure helper, unit-tested — see src/lib/__tests__/DoubledQuestionMergeRace2026_07_24.test.mjs.
 */

function normalize(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ');
}

// Strips leading/trailing punctuation for COMPARISON only — interim STT
// chunks are typically unpunctuated while the corrected/final chunk for the
// same words carries automatic punctuation ("condition" vs "condition?"), so
// comparing raw tokens would treat identical spoken words as non-overlapping
// and fall through to concatenation, reproducing the doubled-question bug
// this helper exists to prevent. Internal apostrophes are preserved so
// contractions ("don't") still compare as a single token.
function stripPunctuationForCompare(word) {
  return word.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
}

// Word-array prefix/suffix checks — deliberately NOT string startsWith/endsWith,
// which match on raw characters and can misfire across word boundaries (e.g.
// "category".startsWith("cat") or "chocolate".endsWith("late") would wrongly
// treat unrelated words as a transcript-correction overlap).
function arrayStartsWith(words, prefix) {
  if (prefix.length > words.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (words[i] !== prefix[i]) return false;
  }
  return true;
}

function arrayEndsWith(words, suffix) {
  if (suffix.length > words.length) return false;
  const offset = words.length - suffix.length;
  for (let i = 0; i < suffix.length; i++) {
    if (words[offset + i] !== suffix[i]) return false;
  }
  return true;
}

/**
 * Merge `addition` onto `base`, collapsing any overlap instead of
 * concatenating blindly. Handles three STT race shapes seen in production:
 *
 *  - `addition` is a corrected, more-complete re-transcription that starts
 *    the same way as `base` (an early VAD-triggered "final" for a
 *    sub-segment, followed by a second "final" for the whole utterance) —
 *    `addition` replaces `base` entirely.
 *  - `addition`'s content is already present at the end of `base` (a stale
 *    trailing partial fragment left over after a "final" already committed
 *    the same words) — `addition` is dropped.
 *  - a partial word-boundary overlap between the tail of `base` and the
 *    head of `addition` — the overlapping words are collapsed once instead
 *    of duplicated.
 *
 * Falls back to the original space-joined concatenation when none of the
 * above apply.
 */
export function mergeTranscriptChunks(base, addition) {
  const baseNorm = normalize(base);
  const addNorm = normalize(addition);

  if (!addNorm) return base ?? '';
  if (!baseNorm) return addition;

  const baseWords = baseNorm.split(' ');
  const addWords = addNorm.split(' ');
  // Compare on lowercased, punctuation-stripped tokens; construct results
  // from the original (cased, punctuated) word arrays so the more-complete
  // side's punctuation is preserved in the output.
  const baseWordsCompare = baseWords.map((w) => stripPunctuationForCompare(w.toLowerCase()));
  const addWordsCompare = addWords.map((w) => stripPunctuationForCompare(w.toLowerCase()));

  if (arrayStartsWith(addWordsCompare, baseWordsCompare)) {
    return addition;
  }
  if (arrayEndsWith(baseWordsCompare, addWordsCompare)) {
    return base;
  }

  const maxOverlap = Math.min(baseWords.length, addWords.length);
  for (let n = maxOverlap; n >= 1; n--) {
    if (arrayEndsWith(baseWordsCompare, addWordsCompare.slice(0, n))) {
      return [...baseWords, ...addWords.slice(n)].join(' ');
    }
  }

  return baseNorm + ' ' + addNorm;
}

/**
 * Leading pattern matching questions or prompts in interview settings.
 */
const QUESTION_STARTER_REGEX =
  /^(why\s+(should\s+we|would\s+we|do\s+you|are\s+you|did\s+you|can\s+you|we\s+should|you\s+should)|what\s+(is|are|was|were|would|do|did|does|can|makes)|how\s+(do|did|does|would|can|is|are|will)|where\s+(do|did|does|would|can|is|are|will)|when\s+(did|do|does|would|was|were)|who\s+(was|were|is|are|do|did)|which\s+(one|part|approach|is|was)|can\s+you|could\s+you|would\s+you|do\s+you|did\s+you|have\s+you|are\s+you|tell\s+me\s+about|tell\s+me\s+more|walk\s+me\s+through|explain\s+to\s+me|explain\s+how|describe\s+a\s+time|describe\s+how|give\s+me\s+an\s+example|give\s+an\s+example|share\s+an\s+example)\b/i;

/**
 * Mid-sentence question patterns that signal the start of a distinct question.
 */
const MID_QUESTION_STARTER_REGEX =
  /\b(why\s+(should\s+we|would\s+we|do\s+you|are\s+you|did\s+you|can\s+you|we\s+should|you\s+should)|what\s+(is|are|was|were|would|do|did|does|can|makes)|how\s+(do|did|does|would|can|is|are|will)|where\s+(do|did|does|would|can|is|are|will)|when\s+(did|do|does|would|was|were)|who\s+(was|were|is|are|do|did)|which\s+(one|part|approach|is|was)|can\s+you|could\s+you|would\s+you|tell\s+me\s+about|walk\s+me\s+through|explain\s+to\s+me|describe\s+a\s+time|give\s+me\s+an\s+example)\b/gi;

function isQuestionLike(text) {
  const t = String(text ?? '').trim();
  if (!t) return false;
  if (t.endsWith('?')) return true;
  return QUESTION_STARTER_REGEX.test(t);
}

function isolateLastQuestionInString(text) {
  const str = String(text ?? '').trim();
  if (!str) return '';

  // 1. Sentence-level check: if text contains punctuation delimiters (.?!),
  // check if preceding sentence is a complete question and the last sentence is also a question.
  const sentences = str.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length > 1) {
    let lastQIndex = sentences.length - 1;
    while (lastQIndex > 0) {
      const prev = sentences[lastQIndex - 1];
      const tail = sentences.slice(lastQIndex).join(' ');
      if (isQuestionLike(prev) && isQuestionLike(tail)) {
        break;
      }
      lastQIndex--;
    }
    if (lastQIndex > 0) {
      return sentences.slice(lastQIndex).join(' ');
    }
  }

  // 2. Unpunctuated check (e.g. "tell me about yourself why we should hire you")
  const matches = [...str.matchAll(MID_QUESTION_STARTER_REGEX)];
  if (matches.length > 1) {
    for (let i = matches.length - 1; i >= 1; i--) {
      const matchIndex = matches[i].index;
      if (matchIndex != null && matchIndex > 0) {
        const prefix = str.slice(0, matchIndex).trim();
        if (isQuestionLike(prefix)) {
          return str.slice(matchIndex).trim();
        }
      }
    }
  }

  return str;
}

/**
 * Extract only the current (latest) question from interviewer transcript text,
 * dropping preceding questions (e.g. "tell me about yourself why we should hire you"
 * -> "why we should hire you").
 */
export function extractCurrentQuestion(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return '';

  // 1. If text is separated by STT segment separator '  ·  '
  if (raw.includes('  ·  ')) {
    const segments = raw.split('  ·  ').map((s) => s.trim()).filter(Boolean);
    if (segments.length === 0) return '';
    if (segments.length === 1) return extractCurrentQuestion(segments[0]);

    // Walk backwards from the last segment.
    let startIndex = segments.length - 1;
    while (startIndex > 0) {
      const prev = segments[startIndex - 1];
      const tail = segments.slice(startIndex).join(' ');
      if (isQuestionLike(prev) && isQuestionLike(tail)) {
        break;
      }
      startIndex--;
    }
    const currentSegments = segments.slice(startIndex);
    const combined = currentSegments.join(' ');
    return isolateLastQuestionInString(combined);
  }

  return isolateLastQuestionInString(raw);
}
