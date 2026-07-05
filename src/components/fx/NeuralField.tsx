import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A slowly rotating 3D point cloud with connecting filaments — the "AI neural
// core". Lazy-loaded (three.js) so it only ships when an AI surface is shown.

function Points({ count = 90 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)

  const { positions, linePositions } = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 0.6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pts.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ),
      )
    }
    const positions = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    })
    const links: number[] = []
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < 1.15) {
          links.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z)
        }
      }
    }
    return { positions, linePositions: new Float32Array(links) }
  }, [count])

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12
      group.current.rotation.x += delta * 0.04
    }
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#53d1b6" size={0.09} sizeAttenuation transparent opacity={0.95} />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0e9f84" transparent opacity={0.22} />
      </lineSegments>
    </group>
  )
}

export default function NeuralField() {
  return (
    <div className="neural-field" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <Points />
      </Canvas>
    </div>
  )
}
