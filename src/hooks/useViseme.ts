import { useState, useEffect, useRef, useCallback } from "react";
import { VISEMES } from "wawa-lipsync";

/**
 * Maps English phoneme patterns to wawa-lipsync VISEMES.
 * This is an approximation — good enough for real-time avatar animation.
 * The brain fills in gaps at conversational speed.
 */
const PHONEME_TO_VISEME: Record<string, VISEMES> = {
  // Vowels
  a: VISEMES.aa, e: VISEMES.E, i: VISEMES.I, o: VISEMES.O, u: VISEMES.U,
  // Consonants by mouth shape
  p: VISEMES.PP, b: VISEMES.PP, m: VISEMES.PP,
  f: VISEMES.FF, v: VISEMES.FF,
  th: VISEMES.TH,
  t: VISEMES.DD, d: VISEMES.DD, n: VISEMES.nn, l: VISEMES.nn,
  s: VISEMES.SS, z: VISEMES.SS,
  ch: VISEMES.CH, j: VISEMES.CH, sh: VISEMES.CH,
  k: VISEMES.kk, g: VISEMES.kk, c: VISEMES.kk, q: VISEMES.kk, x: VISEMES.kk,
  r: VISEMES.RR,
  w: VISEMES.U, y: VISEMES.I,
  h: VISEMES.I,
};

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Estimate the viseme for a character at a given position in the text.
 */
function estimateViseme(text: string, index: number): VISEMES {
  if (index >= text.length) return VISEMES.sil;
  const ch = text[index].toLowerCase();
  if (ch === " ") return VISEMES.sil;

  // Try digraph first (th, ch, sh)
  if (index + 1 < text.length) {
    const digraph = text.slice(index, index + 2).toLowerCase();
    if (PHONEME_TO_VISEME[digraph]) return PHONEME_TO_VISEME[digraph];
  }

  if (PHONEME_TO_VISEME[ch]) return PHONEME_TO_VISEME[ch];
  if (VOWELS.has(ch)) return VISEMES.aa;
  return VISEMES.sil;
}

export interface VisemeResult {
  viseme: VISEMES;
  volume: number;
}

/**
 * Drives real-time viseme estimation from SpeechSynthesis events.
 *
 * When `isSpeaking` is true, this hook cycles through the speaking text
 * estimating visemes per character. When not speaking, returns viseme_sil.
 *
 * Uses wawa-lipsync's VISEMES enum to match standard morph target names
 * on Ready Player Me avatars (viseme_aa, viseme_PP, etc.).
 */
export function useViseme(params: {
  isSpeaking: boolean;
  speakingText: string;
}): VisemeResult {
  const { isSpeaking, speakingText } = params;
  const [viseme, setViseme] = useState<VISEMES>(VISEMES.sil);
  const [volume, setVolume] = useState(0);
  const rafRef = useRef<number | null>(null);
  const charIndexRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const phaseRef = useRef(0);

  // Speech rate: ~15 chars/sec for natural TTS (adjusts with SpeechSynthesis rate)
  const CHARS_PER_MS = 0.015;

  useEffect(() => {
    if (!isSpeaking || !speakingText) {
      setViseme(VISEMES.sil);
      setVolume(0);
      charIndexRef.current = 0;
      return;
    }

    const animate = (now: number) => {
      const dt = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Advance through text at speech rate
      charIndexRef.current += dt * CHARS_PER_MS;
      const idx = Math.floor(charIndexRef.current);

      if (idx >= speakingText.length) {
        setViseme(VISEMES.sil);
        setVolume(0);
        return;
      }

      // Estimate viseme for current character
      const newViseme = estimateViseme(speakingText, idx);
      setViseme(newViseme);

      // Volume: higher for vowels, lower for consonants, with natural variation
      phaseRef.current += dt * 0.008;
      const base = VOWELS.has(speakingText[idx].toLowerCase()) ? 0.7 : 0.4;
      const variation = Math.sin(phaseRef.current) * 0.15;
      setVolume(Math.max(0.1, Math.min(1, base + variation)));

      rafRef.current = requestAnimationFrame(animate);
    };

    lastUpdateRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isSpeaking, speakingText]);

  // Also listen to speechSynthesis boundary events for more accurate char position
  useEffect(() => {
    if (!isSpeaking) return;

    const onBoundary = (e: SpeechSynthesisEvent) => {
      if (e.charIndex !== undefined && e.charIndex < speakingText.length) {
        charIndexRef.current = e.charIndex;
      }
    };

    const onEnd = () => {
      charIndexRef.current = 0;
      setViseme(VISEMES.sil);
      setVolume(0);
    };

    window.speechSynthesis.addEventListener("boundary", onBoundary as any);
    window.speechSynthesis.addEventListener("end", onEnd);
    return () => {
      window.speechSynthesis.removeEventListener("boundary", onBoundary as any);
      window.speechSynthesis.removeEventListener("end", onEnd);
    };
  }, [isSpeaking, speakingText]);

  return { viseme, volume };
}

export { VISEMES };
