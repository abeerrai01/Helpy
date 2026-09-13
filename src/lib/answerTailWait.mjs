/**
 * Event-driven wait for the STT "tail" after the user presses Stop on the
 * voice-dictation Answer flow (src/components/NativelyInterface.tsx,
 * handleAnswerNow). Pure helper, unit-tested — see
 * src/lib/__tests__/AnswerNowTranscriptTail2026_09_11.test.mjs.
 *
 * Why this exists: the transcript for the last second or two of speech lands
 * AFTER the Stop press — cloud finals 0.5–2s after speech ends, local models
 * 1.5–7s. The previous code capped the wait at a fixed 750ms and, worse, had
 * already closed the recording gate, so whatever arrived was thrown away and a
 * short question became "No speech detected". The waiter resolves the moment a
 * FINAL user chunk lands, and is bounded so a genuinely empty recording still
 * returns promptly.
 */

/** Nothing captured yet, or an interim is still pending: speech is in flight.
 * Raised from 3000ms → 12000ms to accommodate local Whisper inference time
 * (5–7s on CPU; the event-driven notifyFinal() still short-circuits the wait
 * the moment a result arrives, so cloud providers are unaffected — they
 * resolve via notifyFinal() in ~0.5–2s and never block for the full window).
 */
export const TAIL_WAIT_MS = 12000;
/**
 * A final already landed and nothing is reported pending: a short grace for a
 * straggler. Raised from 1000ms → 2500ms for local models — even after the
 * first final arrives a second segment can still be in-flight (the user spoke
 * two sentences; Whisper decoded #1 but #2 is still queued). Cloud providers
 * are well within 2500ms (Deepgram/Soniox round-trip is 300–800ms), so this
 * change is backward-compatible.
 */
export const TAIL_GRACE_MS = 2500;

export function createTranscriptTailWaiter(timers = globalThis) {
  let wake = null;
  return {
    /** Call whenever a FINAL user chunk has been merged into the captured text. */
    notifyFinal() {
      const w = wake;
      wake = null;
      if (w) w('final');
    },
    /**
     * Resolves 'final' as soon as notifyFinal() fires, else 'timeout' at the
     * bound. One wait at a time — a new wait supersedes an unresolved one.
     */
    wait({ hasCapturedFinal, hasPendingInterim }) {
      const ms = (!hasCapturedFinal || hasPendingInterim) ? TAIL_WAIT_MS : TAIL_GRACE_MS;
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
