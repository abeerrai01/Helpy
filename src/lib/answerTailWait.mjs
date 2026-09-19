/**
 * Event-driven wait for the STT "tail" after the user presses Stop on the
 * voice-dictation Answer flow (src/components/NativelyInterface.tsx,
 * handleAnswerNow). Pure helper, unit-tested — see
 * src/lib/__tests__/AnswerNowTranscriptTail2026_09_11.test.mjs.
 *
 * Why this exists: the transcript for the last second or two of speech lands
 * AFTER the Stop press. The waiter resolves the moment a FINAL user chunk
 * lands (or on a repeat Stop press), and is bounded so speech or an empty
 * recording returns as fast as possible to directly answer.
 */

/** Max wait when waiting for in-flight transcript tail (500ms).
 * Short-circuits immediately if a final chunk arrives (notifyFinal) or if
 * the user taps Stop again.
 */
export const TAIL_WAIT_MS = 500;

/** Short grace when a final has already landed with no pending interim (100ms). */
export const TAIL_GRACE_MS = 100;

export function createTranscriptTailWaiter(timers = globalThis) {
  let wake = null;
  return {
    /** Call whenever a FINAL user chunk has been merged into the captured text, or forced early. */
    notifyFinal() {
      const w = wake;
      wake = null;
      if (w) w('final');
    },
    /**
     * Resolves 'final' as soon as notifyFinal() fires, else 'timeout' at the
     * bound. One wait at a time — a new wait supersedes an unresolved one.
     */
    wait({ hasCapturedFinal, hasPendingInterim, maxWaitMs, graceMs } = {}) {
      const waitBound = typeof maxWaitMs === 'number' ? maxWaitMs : TAIL_WAIT_MS;
      const graceBound = typeof graceMs === 'number' ? graceMs : TAIL_GRACE_MS;
      const ms = (!hasCapturedFinal || hasPendingInterim) ? waitBound : graceBound;
      return new Promise((resolve) => {
        const timer = timers.setTimeout(() => {
          if (wake === settle) wake = null;
          resolve('timeout');
        }, ms);
        const settle = (why) => {
          timers.clearTimeout(timer);
          resolve(why);
        };
        wake = settle;
      });
    },
  };
}
