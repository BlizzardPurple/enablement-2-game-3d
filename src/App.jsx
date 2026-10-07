import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ─── GLB Model loader with animation support ─── */
function Model({ url, position = [0,0,0], scale = 1, rotation = [0,0,0], animIndex = 0, label = '' }) {
  const { scene, animations } = useGLTF(url);
  const ref = useRef();
  const { actions, names } = useAnimations(animations, ref);
  const [anim, setAnim] = useState('');

  useEffect(() => {
    if (!names.length) return;
    const name = names[animIndex % names.length];
    setAnim(name);
    Object.values(actions).forEach(a => a?.fadeOut(0.2));
    actions[name]?.reset().fadeIn(0.3).play();
    return () => actions[name]?.fadeOut(0.2);
  }, [animIndex, actions, names]);

  return (
    <group ref={ref} position={position} scale={typeof scale === 'number' ? [scale,scale,scale] : scale} rotation={rotation}>
      <primitive object={scene} />
      {(label || anim) && (
        <Html position={[0, 2.8, 0]} center distanceFactor={10}>
          <div style={{ textAlign:'center', pointerEvents:'none' }}>
            {label && <div style={{ background:'rgba(0,0,0,0.7)', color:'#fff', padding:'3px 10px', borderRadius:8, fontSize:12, fontWeight:700, fontFamily:'Inter,sans-serif', whiteSpace:'nowrap', marginBottom:3 }}>{label}</div>}
            {anim && <div style={{ background:'rgba(57,196,195,0.85)', color:'#fff', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600, fontFamily:'monospace', whiteSpace:'nowrap' }}>▶ {anim.replace(/RobotArmature\|/,'').replace(/Robot_/,'')}</div>}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─── Cycles through all animations on a timer ─── */
function AnimCycler({ url, position, scale, rotation, label, interval = 3000 }) {
  const { animations } = useGLTF(url);
  const [idx, setIdx] = useState(0);
  const count = animations?.length || 1;
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [count, interval]);
  return <Model url={url} position={position} scale={scale} rotation={rotation} animIndex={idx} label={label} />;
}

/* ─── Gentle auto-rotate camera ─── */
function AutoCamera() {
  const angle = useRef(0);
  useFrame((state, delta) => {
    angle.current += delta * 0.15;
    const r = 16;
    state.camera.position.x = Math.sin(angle.current) * r;
    state.camera.position.z = Math.cos(angle.current) * r;
    state.camera.position.y = 9;
    state.camera.lookAt(0, 1, 0);
  });
  return null;
}

export default function App() {
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#0d1117', overflow:'hidden' }}>
      <Canvas shadows camera={{ position:[12,9,12], fov:50 }} gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping }}>
        <Suspense fallback={<Html center><div style={{ color:'#39c4c3', fontSize:'1.5rem', fontWeight:700, fontFamily:'Inter' }}>Loading 3D assets...</div></Html>}>

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10,15,10]} intensity={1.5} castShadow shadow-mapSize={2048} />
          <pointLight position={[-6,8,-6]} intensity={0.6} color="#39c4c3" />
          <pointLight position={[6,5,6]} intensity={0.3} color="#782eff" />
          <Environment preset="warehouse" />

          {/* Floor */}
          <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]} receiveShadow>
            <planeGeometry args={[60,60]} />
            <meshStandardMaterial color="#141829" roughness={0.9} />
          </mesh>

          {/* ── FACTORY SCENE (center) ── */}
          <Model url="/models/scene.glb" position={[0,0,0]} scale={1} label="Factory Scene" animIndex={0} />

          {/* ── CONVEYOR + MANIPULATOR (side) ── */}
          <AnimCycler url="/models/conveyor.glb" position={[9,0,0]} scale={0.7} label="Conveyor + Arm" interval={5000} />

          {/* ── BOXES (on/near belt) ── */}
          <Model url="/models/box.glb" position={[-2,0.4,4]} scale={1.2} label="Box" />
          <Model url="/models/boxes.glb" position={[1,0,5]} scale={1} label="Cardboard Boxes" />
          <Model url="/models/box.glb" position={[3,0.4,4.5]} scale={0.9} />
          <Model url="/models/boxes.glb" position={[-4,0,5.5]} scale={0.8} />

          {/* ── ANIMATED ROBOT (cycles 14 animations) ── */}
          <AnimCycler url="/models/robot-animated.glb" position={[5,0,-3]} scale={0.8} label="Robot (14 anims)" interval={2500} />

          {/* ── CHARACTER ── */}
          <AnimCycler url="/models/character.glb" position={[-5,0,-3]} scale={1} label="Character" interval={4000} />

          {/* ── 4 MECHS (17 animations each) ── */}
          <AnimCycler url="/models/mech1.glb" position={[-7,0,2]} scale={0.7} label="Mech 1" interval={2000} />
          <AnimCycler url="/models/mech2.glb" position={[-5,0,7]} scale={0.7} rotation={[0,Math.PI/3,0]} label="Mech 2" interval={2200} />
          <AnimCycler url="/models/mech3.glb" position={[7,0,6]} scale={0.7} rotation={[0,-Math.PI/4,0]} label="Mech 3" interval={2400} />
          <AnimCycler url="/models/mech4.glb" position={[8,0,-2]} scale={0.7} rotation={[0,Math.PI,0]} label="Mech 4" interval={2600} />

          {/* Auto-rotating camera */}
          <AutoCamera />
        </Suspense>
      </Canvas>

      {/* Overlay */}
      <div style={{ position:'absolute', top:16, left:16, zIndex:10, color:'#e8ecf4', fontFamily:'Inter,sans-serif' }}>
        <h1 style={{ fontSize:'1.8rem', fontWeight:900, margin:0 }}>
          <span style={{ color:'#39c4c3' }}>Campaign Chaos</span>{' '}
          <span style={{ color:'#782eff' }}>3D</span>
        </h1>
        <p style={{ fontSize:'0.85rem', color:'#6b7394', margin:'4px 0 0' }}>
          Asset preview — camera auto-rotates
        </p>
      </div>

      {/* Legend */}
      <div style={{
        position:'absolute', bottom:16, left:16, zIndex:10,
        color:'#8b949e', fontFamily:'monospace', fontSize:'11px',
        background:'rgba(0,0,0,0.6)', padding:'10px 14px', borderRadius:10, lineHeight:1.8,
      }}>
        <div><strong style={{ color:'#39c4c3' }}>scene.glb</strong> — Factory (6 anims, 20 meshes)</div>
        <div><strong style={{ color:'#39c4c3' }}>robot-animated.glb</strong> — 14 animations</div>
        <div><strong style={{ color:'#39c4c3' }}>mech1-4.glb</strong> — 17 animations each</div>
        <div><strong style={{ color:'#39c4c3' }}>character.glb</strong> — Animated humanoid</div>
        <div><strong style={{ color:'#39c4c3' }}>conveyor.glb</strong> — Arm manipulator</div>
        <div><strong style={{ color:'#39c4c3' }}>box/boxes.glb</strong> — Props</div>
      </div>
    </div>
  );
}
