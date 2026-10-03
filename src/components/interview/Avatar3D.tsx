import React, { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useGraph } from "@react-three/fiber";
import { useGLTF, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { VISEMES } from "wawa-lipsync";
import { AudioWaveformVisualizer } from "./AudioWaveformVisualizer";

// ponytail: Ready Player Me demo avatar. If this URL is unreachable, the ErrorBoundary
// falls back to the 2D AudioWaveformVisualizer. Replace with a custom RPM avatar
// at public/avatars/sarah.glb for production.
const AVATAR_URL = "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb";

interface AvatarModelProps {
  viseme: VISEMES;
  isSpeaking: boolean;
  volume: number;
}

/**
 * Renders the loaded GLB model and applies viseme morph targets + idle animations.
 */
function AvatarModel({ viseme, isSpeaking, volume }: AvatarModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(AVATAR_URL);
  const { nodes } = useGraph(scene) as any;

  // Clone the scene so we don't mutate the cached original
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Collect morph target influences from all skinned meshes
  const morphMeshes = useMemo(() => {
    const meshes: { mesh: THREE.Mesh; dict: Record<string, number> }[] = [];
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        meshes.push({ mesh, dict: mesh.morphTargetDictionary });
      }
    });
    return meshes;
  }, [cloned]);

  // Blink state
  const blinkRef = useRef({ next: 2, closing: false });
  const headSwayRef = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // --- Viseme morph targets ---
    for (const { mesh, dict } of morphMeshes) {
      if (!mesh.morphTargetInfluences) continue;
      // Decay all viseme morphs toward 0
      for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
        mesh.morphTargetInfluences[i] *= 0.82;
      }
      // Activate current viseme
      const visemeName = viseme as string;
      if (visemeName && visemeName !== VISEMES.sil && dict[visemeName] !== undefined) {
        const idx = dict[visemeName];
        mesh.morphTargetInfluences[idx] = Math.min(1, mesh.morphTargetInfluences[idx] + 0.5 * volume);
      }
    }

    // --- Blink animation ---
    const blink = blinkRef.current;
    blink.next -= delta;
    if (blink.next <= 0 && !blink.closing) {
      blink.closing = true;
    }

    for (const { mesh, dict } of morphMeshes) {
      if (dict["eyeBlink"] !== undefined && mesh.morphTargetInfluences) {
        const idx = dict["eyeBlink"];
        if (blink.closing) {
          mesh.morphTargetInfluences[idx] = Math.min(1, mesh.morphTargetInfluences[idx] + delta * 12);
          if (mesh.morphTargetInfluences[idx] >= 1) {
            blink.closing = false;
            blink.next = 2 + Math.random() * 4; // 2-6s until next blink
          }
        } else {
          mesh.morphTargetInfluences[idx] = Math.max(0, mesh.morphTargetInfluences[idx] - delta * 8);
        }
      }
      if (dict["eyeBlinkLeft"] !== undefined && dict["eyeBlinkRight"] !== undefined && mesh.morphTargetInfluences) {
        const lIdx = dict["eyeBlinkLeft"];
        const rIdx = dict["eyeBlinkRight"];
        const target = blink.closing ? 1 : 0;
        mesh.morphTargetInfluences[lIdx] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[lIdx], target, delta * 10);
        mesh.morphTargetInfluences[rIdx] = THREE.MathUtils.lerp(mesh.morphTargetInfluences[rIdx], target, delta * 10);
        if (blink.closing && mesh.morphTargetInfluences[lIdx] >= 0.9) {
          blink.closing = false;
          blink.next = 2 + Math.random() * 4;
        }
      }
    }

    // --- Subtle head movement ---
    if (groupRef.current) {
      headSwayRef.current += delta;
      const sway = isSpeaking ? 0.04 : 0.02;
      const speed = isSpeaking ? 1.5 : 0.8;
      groupRef.current.rotation.y = Math.sin(headSwayRef.current * speed) * sway;
      groupRef.current.rotation.x = Math.sin(headSwayRef.current * speed * 0.7) * sway * 0.5;
      groupRef.current.position.y = isSpeaking ? Math.sin(t * 2) * 0.01 : 0;
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={cloned} scale={1} position={[0, -1.5, 0]} />
    </group>
  );
}

/**
 * Loading fallback while the GLB model downloads.
 */
function AvatarLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Loading Avatar</span>
      </div>
    </Html>
  );
}

/**
 * Error boundary that falls back to the 2D AudioWaveformVisualizer.
 */
function AvatarErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.message.includes("WebGL") || e.message.includes("glb") || e.message.includes("GLTF")) {
        setHasError(true);
      }
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (hasError) return <>{fallback}</>;
  return <>{children}</>;
}

export interface Avatar3DProps {
  viseme: VISEMES;
  isSpeaking: boolean;
  volume: number;
  speakingText?: string;
  enableVoiceSynthesis?: boolean;
  onToggleVoice?: (enabled: boolean) => void;
  className?: string;
}

/**
 * 3D Face-to-Face AI Interviewer Avatar with real-time lip-sync.
 *
 * Uses React Three Fiber to render a Ready Player Me GLB model.
 * Visemes from useViseme() drive morph targets for lip movement.
 * Idle animation: blink + subtle head sway.
 * Falls back to AudioWaveformVisualizer if WebGL unavailable.
 */
export const Avatar3D: React.FC<Avatar3DProps> = ({
  viseme,
  isSpeaking,
  volume,
  speakingText = "",
  enableVoiceSynthesis = false,
  onToggleVoice,
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <AvatarErrorBoundary
        fallback={
          <AudioWaveformVisualizer
            isSpeaking={isSpeaking}
            speakingText={speakingText}
            enableVoiceSynthesis={enableVoiceSynthesis}
            onToggleVoice={onToggleVoice}
          />
        }
      >
        <Canvas
          camera={{ position: [0, 0.3, 1.2], fov: 35 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "280px", background: "transparent" }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} color="#fff5e6" />
          <directionalLight position={[-2, 1, -1]} intensity={0.4} color="#6080ff" />
          <pointLight position={[0, 1, 1]} intensity={0.3} color="#ffcc88" />

          <Suspense fallback={<AvatarLoader />}>
            <AvatarModel viseme={viseme} isSpeaking={isSpeaking} volume={volume} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
            minPolarAngle={Math.PI / 2.2}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Canvas>

        {/* Status indicator overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
          />
          <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider">
            {isSpeaking ? "Sarah Speaking" : "Sarah Listening"}
          </span>
        </div>

        {/* Bottom metadata bar */}
        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/5 text-[10px] font-mono text-white/40">
          <span>3D Avatar: Ready Player Me (WebGL)</span>
          <span>Viseme: {viseme}</span>
        </div>
      </AvatarErrorBoundary>
    </div>
  );
};

// Preload the avatar model
useGLTF.preload(AVATAR_URL);
