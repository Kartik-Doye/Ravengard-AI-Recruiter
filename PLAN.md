<!-- PLAN STATUS: executing | UPDATED: 2026-10-03T04:49:56.775Z -->
<!-- PLAN ID: plan_murwc5w4_0 -->
<!-- Phase 1: completed -->
<!-- Phase 2: completed -->
<!-- Phase 3: completed -->
<!-- Phase 4: active -->

> **USER REQUIREMENTS (must be applied during execution):**
> - ## Phase 1: Viseme Estimation Hook (`useViseme.ts`)  This hook translates the raw AI text output into an approximate real-time phonetic sequence, bypassing the need for a server-side audio analyser or paid TTS viseme data.  ```typescript import { useState, useEffect, useRef } from 'react';  // Ready Player Me standard morph targets based on the OVRLipSync/wawa-lipsync spec const VISEMES = [   'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH',   'viseme_DD', 'viseme_kk', 'viseme_CH', 'viseme_SS',   'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E',   'viseme_I', 'viseme_O', 'viseme_U' ];  export function useViseme(isSpeaking: boolean, speakingText: string) {   const [currentViseme, setCurrentViseme] = useState<string>('viseme_sil');   const [volume, setVolume] = useState<number>(0);   const frameRef = useRef<number>();   const textIndexRef = useRef<number>(0);   const lastUpdateRef = useRef<number>(0);    useEffect(() => {     if (!isSpeaking || !speakingText) {       setCurrentViseme('viseme_sil');       setVolume(0);       if (frameRef.current) cancelAnimationFrame(frameRef.current);       return;     }      textIndexRef.current = 0;     // Strip punctuation to ensure fluid phonetic mapping     const chars = speakingText.toLowerCase().replace(/[^a-z]/g, '');           const updateViseme = (timestamp: number) => {       // Step interval of ~90ms to mimic natural speech pacing       if (timestamp - lastUpdateRef.current > 90) {         if (textIndexRef.current >= chars.length) {           textIndexRef.current = 0; // Loop gracefully if audio continues past text         }                  const char = chars[textIndexRef.current] || 'a';         let targetViseme = 'viseme_sil';                  if (/[aeiou]/.test(char)) {            targetViseme = char === 'o' ? 'viseme_O' : char === 'u' ? 'viseme_U' : char === 'e' ? 'viseme_E' : char === 'i' ? 'viseme_I' : 'viseme_aa';         } else if (/[pbm]/.test(char)) {            targetViseme = 'viseme_PP';         } else if (/[fv]/.test(char)) {            targetViseme = 'viseme_FF';         } else if (/[th]/.test(char)) {            targetViseme = 'viseme_TH';         } else if (/[sz]/.test(char)) {            targetViseme = 'viseme_SS';         } else if (/[dt]/.test(char)) {            targetViseme = 'viseme_DD';         } else if (/[cgk]/.test(char)) {            targetViseme = 'viseme_kk';         } else if (/[rl]/.test(char)) {            targetViseme = 'viseme_RR';         } else {            targetViseme = 'viseme_nn';         }                  setCurrentViseme(targetViseme);         setVolume(0.5 + Math.random() * 0.5); // Pseudo-volume for head kinematics                  lastUpdateRef.current = timestamp;         textIndexRef.current++;       }              frameRef.current = requestAnimationFrame(updateViseme);     };      frameRef.current = requestAnimationFrame(updateViseme);      return () => {       if (frameRef.current) cancelAnimationFrame(frameRef.current);     };   }, [isSpeaking, speakingText]);    return { viseme: currentViseme, volume }; }  ```  ## Phase 2: 3D Avatar Component (`Avatar3D.tsx`)  This handles the WebGL rendering, lighting, and morph target interpolations. It actively lerps between the viseme frames outputted by the hook to prevent jarring mouth snaps.  ```typescript import React, { useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react'; import { Canvas, useFrame } from '@react-three/fiber'; import { useGLTF, Environment, Html } from '@react-three/drei'; import * as THREE from 'three'; import { AudioWaveformVisualizer } from './AudioWaveformVisualizer'; // Your existing 2D fallback  const VISEMES = [   'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH',   'viseme_DD', 'viseme_kk', 'viseme_CH', 'viseme_SS',   'viseme_nn', 'viseme_RR', 'viseme_aa', 'viseme_E',   'viseme_I', 'viseme_O', 'viseme_U' ];  interface AvatarProps {   viseme: string;   isSpeaking: boolean;   volume: number;   url?: string; }  function Model({ viseme, isSpeaking, volume, url = '/avatars/sarah.glb' }: AvatarProps) {   const { scene } = useGLTF(url);   const headRef = useRef<THREE.Mesh | null>(null);   const teethRef = useRef<THREE.Mesh | null>(null);    useEffect(() => {     scene.traverse((child) => {       const mesh = child as THREE.Mesh;       if (mesh.isMesh) {         if (mesh.name === 'Wolf3D_Head' || mesh.name === 'Wolf3D_Avatar') headRef.current = mesh;         if (mesh.name === 'Wolf3D_Teeth') teethRef.current = mesh;       }     });   }, [scene]);    useFrame((state) => {     [headRef, teethRef].forEach((ref) => {       if (ref.current?.morphTargetDictionary && ref.current?.morphTargetInfluences) {         const dict = ref.current.morphTargetDictionary;         const influences = ref.current.morphTargetInfluences;          // Decay inactive visemes and lerp the active one         VISEMES.forEach((v) => {           const index = dict[v];           if (index !== undefined) {             influences[index] = THREE.MathUtils.lerp(influences[index], v === viseme ? 1 : 0, 0.25);           }         });                  // Asynchronous idle blinking logic         const blinkIndexLeft = dict['eyeBlinkLeft'];         const blinkIndexRight = dict['eyeBlinkRight'];         if (blinkIndexLeft !== undefined && blinkIndexRight !== undefined) {            const blinkValue = Math.sin(state.clock.elapsedTime * 1.5) > 0.96 ? 1 : 0;            influences[blinkIndexLeft] = THREE.MathUtils.lerp(influences[blinkIndexLeft], blinkValue, 0.4);            influences[blinkIndexRight] = THREE.MathUtils.lerp(influences[blinkIndexRight], blinkValue, 0.4);         }       }     });      // Procedural conversational head sway     if (scene) {       const swayIntensity = isSpeaking ? volume * 0.12 : 0.03;       scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, Math.sin(state.clock.elapsedTime * 0.8) * swayIntensity, 0.1);       scene.rotation.x = THREE.MathUtils.lerp(scene.rotation.x, Math.sin(state.clock.elapsedTime * 0.4) * swayIntensity, 0.1);     }   });    // Positioning targets a standard Ready Player Me bust frame   return <primitive object={scene} position={[0, -1.6, 3.2]} scale={2.2} />; }  // Error boundary enforces the zero-downtime WebGL fallback class AvatarErrorBoundary extends Component<{children: ReactNode, fallback: ReactNode}, {hasError: boolean}> {   state = { hasError: false };   static getDerivedStateFromError() { return { hasError: true }; }   render() {     return this.state.hasError ? this.props.fallback : this.props.children;   } }  export function Avatar3D(props: AvatarProps) {   return (     <AvatarErrorBoundary fallback={<AudioWaveformVisualizer isSpeaking={props.isSpeaking} />}>       <Canvas camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 2]}>         <ambientLight intensity={1.8} />         <directionalLight position={[1, 3, 2]} intensity={2.5} />         <Environment preset="city" />         <React.Suspense fallback={<Html center>Loading Avatar...</Html>}>           <Model {...props} />         </React.Suspense>       </Canvas>     </AvatarErrorBoundary>   ); }  ```  ## Phase 3: `InterviewEngine.tsx` Integration  Swap out the rigid 2D implementation for the dynamic 3D rig, relying on React's state management to drive the Three.js canvas.  ```tsx // src/pages/InterviewEngine.tsx import React, { useState } from 'react'; import { Avatar3D } from '../components/interview/Avatar3D'; import { useViseme } from '../hooks/useViseme';  export function InterviewEngine() {   const [isAiSpeaking, setIsAiSpeaking] = useState(false);   const [questionText, setQuestionText] = useState("Hello, I will be conducting your technical interview today.");    // Drive the viseme engine from standard React state   const { viseme, volume } = useViseme(isAiSpeaking, questionText);    const triggerMockSpeech = () => {     setIsAiSpeaking(true);     // Wire this to your actual Web Speech API synthesis onend callback     setTimeout(() => setIsAiSpeaking(false), 4000);    };    return (     <div className="flex flex-col items-center justify-center h-screen bg-gray-900">       <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative">         <Avatar3D            viseme={viseme}            isSpeaking={isAiSpeaking}            volume={volume}          />       </div>              <div className="mt-8 text-center">         <p className="text-white mb-4">{questionText}</p>         <button            onClick={triggerMockSpeech}           className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"         >           Simulate Interview Turn         </button>       </div>     </div>   ); }  ```  ## Phase 4: Avatar Asset Management  1. Generate the avatar at `readyplayer.me`. When exporting, select the **`.glb` format** and ensure **Morph Targets (Facial Expressions)** are checked in the developer dashboard export settings. 2. Place the resulting file at `public/avatars/sarah.glb`. 3. If hosting remotely, swap the local `/avatars/sarah.glb` URL in the `Avatar3D` component defaults with the CDN link provided by Ready Player Me. The `@react-three/drei` loader natively handles remote Cross-Origin resources.

# 3D Face-to-Face AI Interviewer with wawa-lipsync Lip-Sync

## Context / What this resolves:
The current InterviewEngine uses a 2D `AudioWaveformVisualizer` (canvas bars) to represent the AI interviewer. The user wants a real-time 3D face-to-face avatar that lip-syncs to the TTS output, creating a human-like interview experience. The packages `wawa-lipsync`, `three`, `@react-three/fiber`, and `@react-three/drei` are already installed.

## Approach / Why this way:
- Use **@react-three/fiber + drei** to render a Ready Player Me `.glb` avatar in WebGL.
- Use **wawa-lipsync's `VISEMES` enum** as the morph target naming standard. Since browser `SpeechSynthesis` doesn't expose an audio stream for wawa-lipsync's `connectAudio()`, we drive visemes from **speech boundary events + phoneme estimation** instead. This is the zero-cost approach the user specified (browser Web Speech API for both STT and TTS).
- The avatar idle-animates (blink, subtle head sway) when not speaking, and lip-syncs when `isAiSpeaking` is true.
- Replace `AudioWaveformVisualizer` with `Avatar3D` in the InterviewEngine, keeping the waveform as a fallback toggle.

## Phase 1: Viseme Estimation Hook

**Goal:** Create a hook that converts speech text + SpeechSynthesis events into real-time viseme values that match wawa-lipsync's VISEMES enum.

**Files:**
- (create) `src/hooks/useViseme.ts`

**Steps:**
1. Create a hook that accepts `isSpeaking` and `speakingText`.
2. When speaking, cycle through visemes using a phoneme-to-viseme map (e.g., vowels → `viseme_aa`/`viseme_O`/`viseme_I`, consonants → `viseme_PP`/`viseme_FF`/`viseme_DD`).
3. Use `requestAnimationFrame` to update viseme at ~60fps with smooth interpolation.
4. When not speaking, return `viseme_sil`.
5. Export the current viseme string and a `volume` estimate (for head movement).

**Risks:**
- Phoneme estimation from English text is approximate. Mitigation: use a simple vowel/consonant heuristic that looks "good enough" for real-time animation. The brain fills in the gaps.

## Phase 2: 3D Avatar Component

**Goal:** Build a React Three Fiber component that loads a Ready Player Me `.glb` model, renders it, and applies viseme morph targets + idle animations.

**Files:**
- (create) `src/components/interview/Avatar3D.tsx`

**Steps:**
1. Use `useGLTF` from `@react-three/drei` to load a Ready Player Me avatar `.glb` from a URL.
2. Extract morph target dictionary from the loaded scene.
3. On each frame (`useFrame`), set the current viseme morph target to 1.0 and decay all others toward 0.
4. Add idle blink animation (random intervals, `eyeBlink` morph targets).
5. Add subtle head sway using `useFrame` sine movement.
6. Accept props: `viseme: string`, `isSpeaking: boolean`, `volume: number`.
7. Wrap in `<Canvas>` with proper lighting, camera position, and background.
8. Include a `<Suspense>` fallback (loading spinner) while the model loads.
9. Include graceful error fallback (if WebGL fails or model URL is unreachable, show the waveform visualizer).

**Risks:**
- Ready Player Me model URL might be unreachable. Mitigation: use a known-stable RPM demo URL, and include an `onError` fallback that renders the existing `AudioWaveformVisualizer`.
- Morph target names vary by model. Mitigation: use wawa-lipsync's VISEMES enum names which match RPM's standard viseme morph targets.

## Phase 3: Integrate into InterviewEngine

**Goal:** Replace the `AudioWaveformVisualizer` with `Avatar3D` in the interview screen, wired to the existing TTS flow.

**Files:**
- (modify) `src/pages/InterviewEngine.tsx`

**Steps:**
1. Import `Avatar3D` and `useViseme`.
2. Call `useViseme({ isSpeaking: isAiSpeaking, speakingText: questionText })` to get the current viseme.
3. Replace the `<AudioWaveformVisualizer>` component with `<Avatar3D viseme={viseme} isSpeaking={isAiSpeaking} volume={volume} />` in the AI question display area.
4. Keep the `AudioWaveformVisualizer` as a fallback inside `Avatar3D`'s error boundary.
5. Ensure the `speakQuestion()` function still works — the viseme hook listens to `window.speechSynthesis` events independently.

**Risks:**
- The 3D canvas adds GPU load. Mitigation: limit canvas resolution with `dpr={[1, 2]}` and use `frameloop="demand"` when idle.

## Phase 4: Avatar Asset + Polish

**Goal:** Download a professional Ready Player Me avatar and add the avatar to the practice room.

**Files:**
- (create) `public/avatars/sarah.glb` (downloaded asset)
- (modify) `src/components/interview/PracticeRoom.tsx` (optional, add avatar to practice room)

**Steps:**
1. Download a professional female Ready Player Me avatar `.glb` to `public/avatars/`.
2. If download fails, use the RPM CDN URL directly (e.g., `https://models.readyplayer.me/...glb`).
3. Update `Avatar3D` to use the local path.

**Risks:**
- Ready Player Me avatar creation requires their platform. Mitigation: use a known demo avatar URL or generate one via their API (free).

## Manual Tests
1. Navigate to the interview engine page — the 3D avatar should load and idle-blink.
2. When a question streams in and TTS speaks, the avatar's lips should move in sync.
3. When TTS is off (muted), the avatar should stay in idle state.
4. Refresh the page mid-interview — the avatar should re-render correctly with the current session state.
5. Test on a device without WebGL — the waveform fallback should appear.

## Warnings
- The 3D canvas adds ~2-4MB to the initial load (Three.js + model). Use `Suspense` + code-splitting.
- WebGL is not available in all browsers (e.g., some enterprise lockdowns). Always include the 2D fallback.
- The viseme estimation is approximate — it won't perfectly match actual phonemes, but will look natural at conversational speed.