import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { useRingDistordTexture } from "../../libs/ringDistordRenderTarget";

const postProcessingVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const postProcessingFragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D uRingDistordTexture;
  uniform vec2 uResolution;
  uniform float uTime;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Sample high-precision ring distortion texture
    vec4 ring = texture2D(uRingDistordTexture, uv);

    // Decode displacement from [0, 1] to [-1, 1]
    vec2 distortion = ring.rg * 2.0 - 1.0;

    // Distortion multiplier (since displacement in RT is already masked)
    float strength = 0.6;

    // Smooth boundary falloff to prevent pushing UVs outside the screen
    float edgeDistX = min(uv.x, 1.0 - uv.x);
    float edgeDistY = min(uv.y, 1.0 - uv.y);
    float edgeMask = smoothstep(0.0, 0.08, min(edgeDistX, edgeDistY));

    vec2 distortedUv = uv + distortion * strength;

    // Seamless mirror reflection for any out-of-bounds UVs to avoid edge-clamp pixel stretching
    distortedUv = abs(distortedUv);
    distortedUv = 1.0 - abs(1.0 - distortedUv);

    // Sample the scene using distorted UV
    vec4 sceneColor = texture2D(tDiffuse, distortedUv);

    gl_FragColor = sceneColor;
  }
`;

export const PostProcessing = () => {
  const { gl, scene, camera, size } = useThree();
  const ringDistordTexture = useRingDistordTexture();

  const [composer, shaderPass] = useMemo(() => {
    // 16-bit float buffer prevents color banding and precision loss before final color space conversion
    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      type: THREE.HalfFloatType,
    });

    const comp = new EffectComposer(gl, renderTarget);

    // 1. Render main 3D scene to internal buffer
    const renderPass = new RenderPass(scene, camera);
    comp.addPass(renderPass);

    // 2. Custom post-processing shader pass
    const pass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        uRingDistordTexture: { value: null as THREE.Texture | null },
        uResolution: {
          value: new THREE.Vector2(size.width, size.height),
        },
        uTime: { value: 0 },
      },
      vertexShader: postProcessingVertexShader,
      fragmentShader: postProcessingFragmentShader,
    });
    comp.addPass(pass);

    // 3. OutputPass handles Tone Mapping and sRGB ColorSpace conversion to the screen
    const outputPass = new OutputPass();
    comp.addPass(outputPass);

    return [comp, pass];
  }, [gl, scene, camera]);

  // Handle resizing and pixel ratio
  useEffect(() => {
    composer.setSize(size.width, size.height);
    composer.setPixelRatio(gl.getPixelRatio());
    if (shaderPass.uniforms.uResolution) {
      shaderPass.uniforms.uResolution.value.set(size.width, size.height);
    }
  }, [composer, gl, size, shaderPass]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      composer.dispose();
    };
  }, [composer]);

  // Render via EffectComposer on frame (priority = 1 overrides R3F default render loop)
  useFrame((_state, delta) => {
    if (shaderPass.uniforms.uRingDistordTexture) {
      shaderPass.uniforms.uRingDistordTexture.value = ringDistordTexture;
    }
    if (shaderPass.uniforms.uTime) {
      shaderPass.uniforms.uTime.value += delta;
    }

    composer.render(delta);
  }, 1);

  return null;
};

export default PostProcessing;
