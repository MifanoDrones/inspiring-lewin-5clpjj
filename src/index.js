import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

let plants = [];

function createPlant(scene, x, z) {
  let plantGeometry = new THREE.ConeGeometry(0.5, 2, 8);
  let plantMaterial = new THREE.MeshBasicMaterial({ color: 0x228b22 });
  let plant = new THREE.Mesh(plantGeometry, plantMaterial);
  plant.position.set(x, 1, z);
  scene.add(plant);
  plants.push(plant);
}

function SprayEffect({ scene, setEfficiency }) {
  const particlesRef = useRef();
  const [hitCount, setHitCount] = useState(0);
  const totalParticles = 500;

  useEffect(() => {
    let geometry = new THREE.BufferGeometry();
    let positions = new Float32Array(totalParticles * 3);
    for (let i = 0; i < totalParticles * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = Math.random() * 5 + 3;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    let material = new THREE.PointsMaterial({
      color: 0x87ceeb,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    let particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);
  }, [scene]);

  useFrame(() => {
    if (!particlesRef.current) return;
    let positions = particlesRef.current.geometry.attributes.position.array;
    let localHitCount = 0;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.1; // Move particles downward
      if (positions[i + 1] < 0) positions[i + 1] = Math.random() * 5 + 3;

      plants.forEach((plant) => {
        let dx = positions[i] - plant.position.x;
        let dz = positions[i + 2] - plant.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1) {
          positions[i + 1] = -10; // Hide droplet
          localHitCount++;
        }
      });
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    setHitCount(localHitCount);
    setEfficiency(((localHitCount / totalParticles) * 100).toFixed(2));
  });

  return null;
}

function ModelViewer() {
  const { scene } = useGLTF("/models/stockpile_model.glb");
  const [efficiency, setEfficiency] = useState(0);

  useEffect(() => {
    for (let i = 0; i < 20; i++) {
      createPlant(
        scene,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
    }
  }, [scene]);

  return (
    <Canvas style={{ height: "100vh" }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
      <SprayEffect scene={scene} setEfficiency={setEfficiency} />
      <OrbitControls />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          fontSize: "20px",
          background: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        Spray Efficiency: {efficiency}%
      </div>
    </Canvas>
  );
}

export default function App() {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Drone Crop Spraying Simulation</h1>
      <ModelViewer />
    </div>
  );
}
