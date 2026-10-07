import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function FactoryScene() {
  const { scene, animations } = useGLTF('/models/scene.glb');
  const ref = useRef();
  const { actions, names } = useAnimations(animations, ref);
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center);
    names.forEach(name => { if (actions[name]) actions[name].reset().play(); });
  }, [scene, actions, names]);
  return (
    <group ref={ref} scale={0.001} rotation={[0, Math.PI, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function AnimModel({ url, position = [0,0,0], scale = 1, rotation = [0,0,0], interval = 2500 }) {
  const { scene, animations } = useGLTF(url);
  const ref = useRef();
  const { actions, names } = useAnimations(animations, ref);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!names.length) return;
    Object.values(actions).forEach(a => a?.fadeOut(0.2));
    actions[names[idx % names.length]]?.reset().fadeIn(0.3).play();
  }, [idx, actions, names]);
  useEffect(() => {
    if (names.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % names.length), interval);
    return () => clearInterval(t);
  }, [names.length, interval]);
  return (
    <group ref={ref} position={position} scale={typeof scale === 'number' ? [scale,scale,scale] : scale} rotation={rotation}>
      <primitive object={scene} />
    </group>
  );
}

function StaticModel({ url, position = [0,0,0], scale = 1, rotation = [0,0,0] }) {
  const { scene } = useGLTF(url);
  const cloned = scene.clone(true);
  return <primitive object={cloned} position={position} scale={typeof scale === 'number' ? [scale,scale,scale] : scale} rotation={rotation} />;
}

function CameraLogger() {
  const { camera } = useThree();
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') {
        const p = camera.position;
        console.log(`📷 Camera position: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]`);
        console.log(`📷 Copy this: position={[${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]}`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [camera]);
  return null;
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0d1117' }}>
      <Canvas
        shadows
        camera={{ position: [0, 3, 7], fov: 38, near: 0.01, far: 500 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
      >
        <Suspense fallback={<Html center><div style={{ color: '#39c4c3', fontSize: '1.5rem', fontWeight: 700 }}>Loading...</div></Html>}>

          {/* ── Lighting — bright enough to see detail ── */}
          <ambientLight intensity={0.5} color="#c0d0e0" />
          <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow color="#fff5ee" shadow-mapSize={2048} />
          <pointLight position={[-3, 3, 2]} intensity={0.4} color="#39c4c3" distance={12} />
          <pointLight position={[3, 2, -2]} intensity={0.2} color="#782eff" distance={10} />
          <hemisphereLight args={['#b0c4de', '#1a1a2e', 0.3]} />

          {/* ── FACTORY SCENE ── */}
          <FactoryScene />

          {/* ── 4 MECHS — small, around the conveyor ── */}
          <AnimModel url="/models/mech1.glb" position={[-2.2, -1.6, 0.8]} scale={0.15} rotation={[0, 0.8, 0]} interval={2500} />
          <AnimModel url="/models/mech2.glb" position={[2.2, -1.6, 0.5]} scale={0.15} rotation={[0, -0.6, 0]} interval={2800} />
          <AnimModel url="/models/mech3.glb" position={[-1.2, -1.6, -1.5]} scale={0.13} rotation={[0, 1.5, 0]} interval={2200} />
          <AnimModel url="/models/mech4.glb" position={[1.5, -1.6, -1.8]} scale={0.13} rotation={[0, -1.2, 0]} interval={3000} />

          {/* ── SCATTERED BOXES — small ── */}
          <StaticModel url="/models/boxes.glb" position={[-2.8, -1.6, -0.5]} scale={0.15} rotation={[0, 0.3, 0]} />
          <StaticModel url="/models/box.glb" position={[2.8, -1.6, -1]} scale={0.2} rotation={[0, 1.8, 0]} />
          <StaticModel url="/models/boxes.glb" position={[-0.5, -1.6, 2]} scale={0.12} rotation={[0, -0.7, 0]} />
          <StaticModel url="/models/box.glb" position={[0.8, -1.6, -2.2]} scale={0.18} rotation={[0, 2.1, 0]} />
          <StaticModel url="/models/box.glb" position={[-3, -1.6, 1.8]} scale={0.14} rotation={[0.05, 1.3, 0]} />

        </Suspense>
        <OrbitControls makeDefault enableDamping target={[0, 0.5, 0]} />
        <CameraLogger />
      </Canvas>

      <div style={{ position: 'absolute', top: 20, left: 20, color: '#e8ecf4', fontFamily: 'Inter,sans-serif' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>
          <span style={{ color: '#39c4c3' }}>Campaign</span>{' '}
          <span style={{ color: '#782eff' }}>Chaos</span>{' '}
          <span style={{ color: '#ff9408' }}>3D</span>
        </h1>
      </div>
    </div>
  );
}
