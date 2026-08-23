import React, { useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { useControls } from "leva";
import * as THREE from "three";

export interface BloomEffectProps {
  enabled?: boolean;
  strength?: number;
  radius?: number;
  threshold?: number;
}

const BloomEffect: React.FC<BloomEffectProps> = (props) => {
  const { gl, scene, camera, size } = useThree();

  const controls = useControls("Bloom Postprocessing", {
    enabled: { value: props.enabled ?? true },
    strength: { value: props.strength ?? 0.2, min: 0, max: 4, step: 0.05 },
    radius: { value: props.radius ?? 0.45, min: 0, max: 2, step: 0.05 },
    threshold: { value: props.threshold ?? 0.9, min: 0, max: 1, step: 0.01 },
  });

  const { composer, bloomPass } = useMemo(() => {
    const comp = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    comp.addPass(renderPass);

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      controls.strength,
      controls.radius,
      controls.threshold,
    );
    comp.addPass(bloom);

    const outputPass = new OutputPass();
    comp.addPass(outputPass);

    return { composer: comp, bloomPass: bloom };
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    bloomPass.resolution.set(size.width, size.height);
  }, [composer, bloomPass, size]);

  useEffect(() => {
    return () => {
      composer.dispose();
    };
  }, [composer]);

  useFrame((_, delta) => {
    if (!controls.enabled) {
      gl.render(scene, camera);
      return;
    }
    bloomPass.strength = controls.strength;
    bloomPass.radius = controls.radius;
    bloomPass.threshold = controls.threshold;
    composer.render(delta);
  }, 1);

  return null;
};

export default BloomEffect;
