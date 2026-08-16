import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import GroupOfSphere from "../General/GroupOfSphere";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMouse } from "../../libs/useMouse";
import { remapClamp } from "../../libs/remapClamp";
import { lerp } from "../../libs/lerp";
import { useTexture } from "@react-three/drei";
import { useControls, folder } from "leva";
import { createFlameWrapMaterial, DEFAULTS } from "./FlameWrapShader";
import gsap from "gsap";

const index = () => {
  const [show, setShow] = useState(false);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShow(true);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <Suspense fallback={<></>}>
        {show && (
          <>
            <group>
              <GroupOfSphere configKey="Nfc1" configOffset={14} />
              <GroupOfSphere configKey="Nfc2" configOffset={2} />

              {/* <GroupOfSphere configKey="Nfc" configOffset={0} /> */}
            </group>
          </>
        )}
      </Suspense>

      <Card />
    </>
  );
};

const Card = () => {
  const groupRef = useRef<THREE.Group>(null);
  const promoTex = useTexture("/images/nfc-sticker-promo.jpg");
  // promoTex.colorSpace = THREE.SRGBColorSpace;
  promoTex.flipY = false;

  const flameMaterial = useMemo(() => {
    return createFlameWrapMaterial(promoTex);
  }, [promoTex]);

  useEffect(() => {
    return () => {
      flameMaterial.dispose();
    };
  }, [flameMaterial]);

  // Enter animation — slide up from below + fade in
  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.position.y = -3;
    flameMaterial.uniforms.uOpacity.value = 0;

    gsap.to(groupRef.current.position, {
      y: 0,
      duration: 1,
      ease: "power4.out",
    });

    gsap.to(flameMaterial.uniforms.uOpacity, {
      value: 1,
      duration: 3,
      ease: "power4.out",
    });
  }, [flameMaterial]);

  // Exit animation — menu-click event
  useEffect(() => {
    const handleClick = () => {
      if (!groupRef.current) return;

      // gsap.to(groupRef.current.position, {
      //   y: 3,
      //   duration: 0.65,
      //   ease: "power3.in",
      // });

      gsap.to(flameMaterial.uniforms.uOpacity, {
        value: 0,
        duration: 0.65,
        ease: "power3.in",
      });
    };

    window.addEventListener("menu-click", handleClick);
    return () => window.removeEventListener("menu-click", handleClick);
  }, [flameMaterial]);

  const flameControls = useControls("Flame Shader", {
    Appearance: folder({
      color: "#cdc1ff",
      intensity: { value: DEFAULTS.intensity, min: 0, max: 3, step: 0.01 },
      height: { value: DEFAULTS.height, min: 0, max: 300, step: 1 },
      spread: { value: DEFAULTS.spread, min: 0, max: 100, step: 1 },
      radius: { value: DEFAULTS.radius, min: 0, max: 100, step: 1 },
      speed: { value: DEFAULTS.speed, min: 0, max: 3, step: 0.01 },
      scale: { value: DEFAULTS.scale, min: 0.05, max: 1, step: 0.01 },
    }),
    "Turbulence & Shimmer": folder({
      turbulence: { value: DEFAULTS.turbulence, min: 0, max: 1, step: 0.01 },
      turbulenceScale: {
        value: DEFAULTS.turbulenceScale,
        min: 0.2,
        max: 3,
        step: 0.01,
      },
      turbulenceReach: {
        value: DEFAULTS.turbulenceReach,
        min: 0,
        max: 100,
        step: 1,
      },
      distortion: { value: DEFAULTS.distortion, min: 0, max: 32, step: 0.5 },
    }),
    "Sparks & Glow": folder({
      sparks: { value: DEFAULTS.sparks, min: 0, max: 3, step: 0.01 },
      sparkSize: { value: DEFAULTS.sparkSize, min: 0.2, max: 3, step: 0.01 },
      sparkDensity: {
        value: DEFAULTS.sparkDensity,
        min: 0.3,
        max: 2.5,
        step: 0.01,
      },
      sparkSpeed: { value: DEFAULTS.sparkSpeed, min: 0.1, max: 3, step: 0.01 },
      rim: { value: DEFAULTS.rim, min: 0, max: 3, step: 0.01 },
    }),
    "Burn & Smoke": folder({
      melt: { value: DEFAULTS.melt, min: 0, max: 20, step: 0.1 },
      smoke: { value: DEFAULTS.smoke, min: 0, max: 2, step: 0.01 },
      ember: { value: DEFAULTS.ember, min: 0, max: 2, step: 0.01 },
      scorch: { value: DEFAULTS.scorch, min: 0, max: 2, step: 0.01 },
    }),
    "Card Layout": folder({
      cardWidthPx: { value: 720, min: 200, max: 1800, step: 10 },
      cardHeightPx: { value: 405, min: 100, max: 1200, step: 10 },
      cardOffsetYPx: { value: -30, min: -200, max: 200, step: 5 },
    }),
  });

  useFrame((_, delta) => {
    if (flameMaterial) {
      const u = flameMaterial.uniforms;

      u.uTime.value += delta * flameControls.speed;

      const col = new THREE.Color(flameControls.color);
      u.uColor.value.setRGB(col.r, col.g, col.b);

      u.uIntensity.value = flameControls.intensity;
      u.uHeight.value = flameControls.height;
      u.uSpread.value = flameControls.spread;
      u.uCorner.value = flameControls.radius;
      u.uScale.value = flameControls.scale;
      u.uTurbulence.value = flameControls.turbulence;
      u.uTurbScale.value = flameControls.turbulenceScale;
      u.uTurbReach.value = flameControls.turbulenceReach;
      u.uSparks.value = flameControls.sparks;
      u.uSparkSize.value = flameControls.sparkSize;
      u.uSparkDensity.value = flameControls.sparkDensity;
      u.uSparkSpeed.value = flameControls.sparkSpeed;
      u.uRim.value = flameControls.rim;
      u.uMelt.value = flameControls.melt;
      u.uDistortion.value = flameControls.distortion;
      u.uSmoke.value = flameControls.smoke;
      u.uEmber.value = flameControls.ember;
      u.uScorch.value = flameControls.scorch;

      u.uResolution.value.set(1000, 700);
      u.uRectCenter.value.set(500, 350 + flameControls.cardOffsetYPx);
      u.uRectHalf.value.set(
        flameControls.cardWidthPx / 2,
        flameControls.cardHeightPx / 2,
      );
    }
  });

  const { coords, updateMouse } = useMouse();

  useFrame(() => {
    if (groupRef.current) {
      updateMouse();

      const targetY = remapClamp(coords.x, -1, 1, -0.4, 0.4) * 0.2;
      const targetX = remapClamp(-coords.y, -1, 1, -0.4, 0.4) * 0.2;

      groupRef.current.rotation.y = lerp(
        groupRef.current.rotation.y,
        targetY,
        0.05,
      );
      groupRef.current.rotation.x = lerp(
        groupRef.current.rotation.x,
        targetX,
        0.05,
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, -0, 0]}>
      <mesh>
        <planeGeometry args={[12, 8.5]} />
        <primitive object={flameMaterial} attach="material" />
      </mesh>
    </group>
  );
};

export default index;
