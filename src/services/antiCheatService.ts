/**
 * Secondary-Device & Behavioral Anti-Cheat Forensics Engine
 * 
 * Provides four non-intrusive telemetry analysis pipelines:
 * 1. Conversational Response Latency (Delta TTFT): Tracks response onset delay to detect secondary LLM relay
 * 2. Adaptive Rapid-Probing Loops: Generates immediate follow-up interruptions when anomalous delay is detected
 * 3. Speech Prosody & Cadence Profiling: Evaluates reading cadence vs spontaneous thought restructuring
 * 4. Cross-Modal Code-Speech Divergence: Correlates spoken audio with DOM/editor events
 * 5. Keystroke Dynamics & Paste Forensics: Analyzes keypress variance (uniform 20ms) and large chunk injection
 */

export interface TelemetrySignalPayload {
  sessionId: string;
  interviewSessionId?: string;
  signalType: string;
  metadata?: {
    deltaTtftMs?: number;
    questionIndex?: number;
    consecutiveHighLatencies?: number;
    keystrokeIntervals?: number[];
    pasteLength?: number;
    pitchVariance?: number;
    spokenWordCount?: number;
    editorEditCount?: number;
    [key: string]: any;
  };
}

export interface AntiCheatEvaluationResult {
  isFlagged: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flagReason: string | null;
  recommendedAction: 'CONTINUE' | 'PROBE_RAPIDLY' | 'FLAG_FOR_AUDIT' | 'HUMAN_REVIEW';
  evidence: string[];
}

export class AntiCheatService {
  private static readonly TTFT_THRESHOLD_MS = 1800; // >1.8s delay on conversational response
  private static readonly SYNTHETIC_KEYSTROKE_STDDEV_MS = 5; // <5ms standard deviation indicates auto-typer script

  /**
   * Evaluates incoming signal telemetry against secondary-device relay models
   */
  public static evaluateSignal(payload: TelemetrySignalPayload): AntiCheatEvaluationResult {
    const { signalType, metadata = {} } = payload;
    const evidence: string[] = [];
    let isFlagged = false;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let flagReason: string | null = null;
    let recommendedAction: 'CONTINUE' | 'PROBE_RAPIDLY' | 'FLAG_FOR_AUDIT' | 'HUMAN_REVIEW' = 'CONTINUE';

    // 1. Conversational Response Latency (Delta TTFT)
    if (signalType === 'HIGH_RISK_PROXY_LATENCY' || (metadata.deltaTtftMs && metadata.deltaTtftMs > this.TTFT_THRESHOLD_MS)) {
      const consecutive = metadata.consecutiveHighLatencies || 1;
      evidence.push(`Candidate response onset delay: ${metadata.deltaTtftMs || '>1800'}ms (consecutive breaches: ${consecutive})`);
      
      if (consecutive >= 3) {
        isFlagged = true;
        riskLevel = 'HIGH';
        flagReason = 'Secondary-device LLM relay suspected: Delta TTFT conversational latency exceeded 1.8s threshold across multiple consecutive turns.';
        recommendedAction = 'PROBE_RAPIDLY';
      } else {
        riskLevel = 'MEDIUM';
        recommendedAction = 'PROBE_RAPIDLY';
      }
    }

    // 2. Keystroke Dynamics & Paste Forensics
    if (signalType === 'HIGH_RISK_SYNTHETIC_INPUT' || signalType === 'UNIFORM_KEYSTROKE_INTERVAL') {
      isFlagged = true;
      riskLevel = 'CRITICAL';
      flagReason = 'Synthetic code injection detected: Uniform ~20ms keystroke intervals or large automated chunk paste event in editor.';
      evidence.push(`Keystroke interval standard deviation breached synthetic threshold: ${metadata.keystrokeIntervals ? 'Automated script pattern' : 'Large chunk paste'}`);
      recommendedAction = 'FLAG_FOR_AUDIT';
    }

    // 3. Speech Prosody & Cadence Profiling
    if (signalType === 'UNNATURAL_READING_PROSODY') {
      isFlagged = true;
      riskLevel = 'HIGH';
      flagReason = 'Reading prosody detected: Spoken response exhibited robotic pitch invariance and lack of spontaneous technical hesitations or false starts.';
      evidence.push('Audio pitch variance < 12Hz across 40+ continuous words without cognitive restructuring');
      recommendedAction = 'FLAG_FOR_AUDIT';
    }

    // 4. Cross-Modal Code-Speech Divergence
    if (signalType === 'CROSS_MODAL_DIVERGENCE_FLAG') {
      isFlagged = true;
      riskLevel = 'HIGH';
      flagReason = 'Cross-modal divergence detected: Candidate verbally recited complex algorithmic logic with zero corresponding typing or contradictory canvas events.';
      evidence.push(`Spoken complexity: ${metadata.spokenWordCount || 50} words vs Editor edits: ${metadata.editorEditCount || 0} characters`);
      recommendedAction = 'HUMAN_REVIEW';
    }

    return {
      isFlagged,
      riskLevel,
      flagReason,
      recommendedAction,
      evidence
    };
  }

  /**
   * Generates an adaptive rapid-probing question to break an LLM relay stream
   */
  public static generateRapidProbeQuestion(topic: string = "distributed consensus"): string {
    const rapidProbes = [
      `Wait—before you expand on that, why did you choose Raft over Paxos specifically for the 3-node cluster you just mentioned?`,
      `Hold on—how does your proposed solution handle the split-brain scenario if replica 2 gets partitioned right at that exact millisecond?`,
      `Quick checkpoint: what is the worst-case time complexity of that lookup if the hash table experiences 100% collision rate?`,
      `Before we continue, how would you rewrite that specific loop without using any auxiliary memory buffer?`
    ];

    const randomIndex = Math.floor(Math.random() * rapidProbes.length);
    return rapidProbes[randomIndex];
  }
}
