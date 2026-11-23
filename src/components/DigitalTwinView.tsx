import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EyeOff, Eye } from 'lucide-react';
import { CartesianCoord, JointCoord } from '../types/robot';

interface DigitalTwinViewProps {
  coords: CartesianCoord;
  joints: JointCoord;
  onGizmoMove?: (newCoords: CartesianCoord) => void;
  isOffloaded?: boolean;
  onToggleOffload?: () => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  coords,
  joints,
  onGizmoMove,
  isOffloaded = false,
  onToggleOffload,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const reqAnimIdRef = useRef<number | null>(null);

  // Arm meshes
  const j1GroupRef = useRef<THREE.Group | null>(null);
  const j2GroupRef = useRef<THREE.Group | null>(null);
  const j3GroupRef = useRef<THREE.Group | null>(null);
  const toolMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (isOffloaded || !mountRef.current) {
      // Offloaded / Suspended: Clean up GPU resources completely
      if (reqAnimIdRef.current) {
        cancelAnimationFrame(reqAnimIdRef.current);
        reqAnimIdRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current && rendererRef.current.domElement) {
          mountRef.current.innerHTML = '';
        }
        rendererRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
      return;
    }

    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 220;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 10, 1000);
    camera.position.set(300, 350, 400);
    camera.lookAt(150, 0, 80);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(200, 400, 250);
    scene.add(dirLight);

    // 4. Ground Grid
    const grid = new THREE.GridHelper(500, 25, 0x444455, 0x222233);
    grid.position.y = -138;
    scene.add(grid);

    // 5. Reachable Workspace Envelope (Translucent Hemisphere)
    const envelopeGeo = new THREE.SphereGeometry(320, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    const envelopeMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const envelope = new THREE.Mesh(envelopeGeo, envelopeMat);
    envelope.position.set(0, -138, 0);
    scene.add(envelope);

    // 6. Dobot Robot Kinematic Arm Hierarchy
    const baseGeo = new THREE.CylinderGeometry(60, 70, 40, 32);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.4, metalness: 0.7 });
    const armMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.5 });
    const toolMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2 });

    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.y = -118;
    scene.add(baseMesh);

    // J1 Base Yaw Pivot
    const j1Group = new THREE.Group();
    j1Group.position.set(0, -98, 0);
    scene.add(j1Group);
    j1GroupRef.current = j1Group;

    // J2 Rear Arm
    const j2Group = new THREE.Group();
    j2Group.position.set(0, 0, 0);
    j1Group.add(j2Group);
    j2GroupRef.current = j2Group;

    const rearArmGeo = new THREE.CylinderGeometry(14, 16, 135, 16);
    const rearArmMesh = new THREE.Mesh(rearArmGeo, armMat);
    rearArmMesh.position.set(0, 67.5, 0);
    j2Group.add(rearArmMesh);

    // J3 Forearm
    const j3Group = new THREE.Group();
    j3Group.position.set(0, 135, 0);
    j1Group.add(j3Group);
    j3GroupRef.current = j3Group;

    const foreArmGeo = new THREE.CylinderGeometry(12, 14, 147, 16);
    const foreArmMesh = new THREE.Mesh(foreArmGeo, armMat);
    foreArmMesh.position.set(0, 73.5, 0);
    j3Group.add(foreArmMesh);

    // End Effector Tool
    const toolGeo = new THREE.CylinderGeometry(8, 8, 30, 16);
    const toolMesh = new THREE.Mesh(toolGeo, toolMat);
    toolMesh.position.set(0, 147 + 15, 0);
    j3Group.add(toolMesh);
    toolMeshRef.current = toolMesh;

    // 7. Render Loop with Render-on-demand
    let isRendering = true;
    const animate = () => {
      if (!isRendering) return;
      reqAnimIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isRendering = false;
      window.removeEventListener('resize', handleResize);
      if (reqAnimIdRef.current) cancelAnimationFrame(reqAnimIdRef.current);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, [isOffloaded]);

  // Update Joint Rotations smoothly
  useEffect(() => {
    if (isOffloaded) return;
    if (j1GroupRef.current) {
      j1GroupRef.current.rotation.y = THREE.MathUtils.degToRad(-joints.j1);
    }
    if (j2GroupRef.current) {
      j2GroupRef.current.rotation.z = THREE.MathUtils.degToRad(joints.j2 - 45);
    }
    if (j3GroupRef.current) {
      j3GroupRef.current.rotation.z = THREE.MathUtils.degToRad(-joints.j3 + 35);
    }
  }, [joints, isOffloaded]);

  return (
    <div className="relative w-full h-[210px] rounded-xl border border-[var(--border)] overflow-hidden bg-gradient-to-br from-[var(--card)] to-[var(--background)] group">
      {/* 3D Canvas Mount */}
      {!isOffloaded ? (
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--muted-foreground)] gap-2 bg-[var(--card)]/40">
          <span className="text-2xl opacity-40">🧊</span>
          <span className="text-xs">3D Viewport Offloaded (0% GPU)</span>
          <button
            onClick={onToggleOffload}
            className="px-3 py-1 rounded text-xs bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold mt-1"
          >
            Restore 3D Viewport
          </button>
        </div>
      )}

      {/* Hover-reveal Collapse Button */}
      {!isOffloaded && onToggleOffload && (
        <button
          onClick={onToggleOffload}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-md z-10"
          title="Suspend 3D Viewport to free 100% GPU VRAM"
        >
          <EyeOff size={13} />
        </button>
      )}

      {/* Live Coordinate Overlay */}
      {!isOffloaded && (
        <div className="absolute bottom-2 left-2.5 px-2 py-1 rounded bg-[var(--card)]/80 backdrop-blur-sm border border-[var(--border)] font-mono text-[11px] flex gap-3 text-[var(--muted-foreground)]">
          <span>
            <strong className="text-red-500">X</strong> {coords.x.toFixed(1)}
          </span>
          <span>
            <strong className="text-emerald-500">Y</strong> {coords.y.toFixed(1)}
          </span>
          <span>
            <strong className="text-blue-500">Z</strong> {coords.z.toFixed(1)}
          </span>
          <span>
            <strong className="text-amber-500">R</strong> {coords.r.toFixed(1)}°
          </span>
        </div>
      )}
    </div>
  );
};
