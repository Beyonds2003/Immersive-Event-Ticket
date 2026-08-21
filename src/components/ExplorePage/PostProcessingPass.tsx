import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export interface PostProcessingControls {
  enablePostProcessing?: boolean;
  showDepthOnly?: boolean;
  blurStrength?: number;
  chromaticAberration?: number;
  focusDepth?: number;
  focusRange?: number;
}

interface PostProcessingPassProps {
  children: React.ReactNode;
  controls?: PostProcessingControls;
}

export const PostProcessingPass = ({
  children,
  controls = {},
}: PostProcessingPassProps) => {
  const {
    enablePostProcessing = true,
    showDepthOnly = false,
    blurStrength = 0.5,
    chromaticAberration = 0.005,
    focusDepth = 5.0,
    focusRange = 3.0,
  } = controls;

  const { gl, scene: defaultScene, camera, size, viewport } = useThree();

  // Create isolated offscreen scene
  const offscreenScene = useMemo(() => new THREE.Scene(), []);

  // Create RenderTarget with DepthTexture
  const renderTarget = useMemo(() => {
    const width = Math.max(1, Math.floor(size.width * viewport.dpr));
    const height = Math.max(1, Math.floor(size.height * viewport.dpr));

    const depthTexture = new THREE.DepthTexture(width, height);
    depthTexture.format = THREE.DepthFormat;
    depthTexture.type = THREE.UnsignedIntType;

    const target = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      depthTexture: depthTexture,
    });

    return target;
  }, [size.width, size.height, viewport.dpr]);

  // Clean up render target on unmount or resize
  useEffect(() => {
    return () => {
      renderTarget.dispose();
      if (renderTarget.depthTexture) {
        renderTarget.depthTexture.dispose();
      }
    };
  }, [renderTarget]);

  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Post processing uniforms
  const uniforms = useMemo(
    () => ({
      uTexture: { value: null as THREE.Texture | null },
      uDepthTexture: { value: null as THREE.Texture | null },
      uCameraNear: { value: 1.0 },
      uCameraFar: { value: 1000.0 },
      uResolution: {
        value: new THREE.Vector2(size.width, size.height),
      },
      uEnablePostProcessing: { value: enablePostProcessing ? 1.0 : 0.0 },
      uShowDepthOnly: { value: showDepthOnly ? 1.0 : 0.0 },
      uBlurStrength: { value: blurStrength },
      uChromaticAberration: { value: chromaticAberration },
      uFocusDepth: { value: focusDepth },
      uFocusRange: { value: focusRange },
      uTime: { value: 0 },
    }),
    [],
  );

  // Sync uniforms on control updates
  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uEnablePostProcessing.value = enablePostProcessing ? 1.0 : 0.0;
    u.uShowDepthOnly.value = showDepthOnly ? 1.0 : 0.0;
    u.uBlurStrength.value = blurStrength;
    u.uChromaticAberration.value = chromaticAberration;
    u.uFocusDepth.value = focusDepth;
    u.uFocusRange.value = focusRange;
  }, [
    enablePostProcessing,
    showDepthOnly,
    blurStrength,
    chromaticAberration,
    focusDepth,
    focusRange,
  ]);

  // Render loop: Render offscreenScene into renderTarget
  useFrame((state, delta) => {
    if (!renderTarget || !materialRef.current) return;

    // 1. Render offscreen scene to target
    gl.setRenderTarget(renderTarget);
    gl.clear(true, true, true);
    gl.render(offscreenScene, camera);
    gl.setRenderTarget(null);

    // 2. Update uniforms for full screen quad
    const perspCamera = camera as THREE.PerspectiveCamera;
    const near = perspCamera.near ?? 0.1;
    const far = perspCamera.far ?? 1000.0;

    materialRef.current.uniforms.uTexture.value = renderTarget.texture;
    materialRef.current.uniforms.uDepthTexture.value =
      renderTarget.depthTexture;
    materialRef.current.uniforms.uCameraNear.value = near;
    materialRef.current.uniforms.uCameraFar.value = far;
    materialRef.current.uniforms.uResolution.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
    );
    materialRef.current.uniforms.uTime.value += delta;
  });

  return (
    <>
      {/* Portal children into the offscreen scene */}
      {createPortal(children, offscreenScene)}

      {/* Fullscreen post processing quad in main scene */}
      <mesh frustumCulled={false} renderOrder={999}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={postVertexShader}
          fragmentShader={postFragmentShader}
          uniforms={uniforms}
          depthTest={false}
          depthWrite={false}
          transparent={true}
        />
      </mesh>
    </>
  );
};

// ----------------------------------------------------
// Fullscreen Quad Vertex Shader
// ----------------------------------------------------
const postVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    // Map plane geometry to clip space (-1 to 1) for a full screen quad
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// ----------------------------------------------------
// Post Processing Fragment Shader (Color & Depth Data)
// ----------------------------------------------------
const postFragmentShader = `
uniform sampler2D uTexture;
uniform sampler2D uDepthTexture;
uniform float uCameraNear;
uniform float uCameraFar;
uniform vec2  uResolution;
uniform float uEnablePostProcessing;
uniform float uShowDepthOnly;
uniform float uBlurStrength;
uniform float uChromaticAberration;
uniform float uFocusDepth;
uniform float uFocusRange;
uniform float uTime;

varying vec2 vUv;

// Linearize standard depth buffer value to view space z distance
float getLinearDepth(vec2 uv) {
    float depth = texture2D(uDepthTexture, uv).r;
    float z = depth * 2.0 - 1.0; // Convert to NDC [-1, 1]
    return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
}

void main() {
    vec2 uv = vUv;

    // Extract linearized depth value
    float linearDepth = getLinearDepth(uv);

    // If depth visualizer is enabled, display depth buffer as grayscale gradient
    if (uShowDepthOnly > 0.5) {
        float normalizedDepth = clamp((linearDepth - uCameraNear) / (uCameraFar - uCameraNear), 0.0, 1.0);
        // Enhance depth contrast for visual feedback
        float visDepth = pow(normalizedDepth, 0.5);
        gl_FragColor = vec4(vec3(1.0 - visDepth), 1.0);
        return;
    }

    // Bypass post processing if disabled
    if (uEnablePostProcessing < 0.5) {
        gl_FragColor = texture2D(uTexture, uv);
        return;
    }

    // Depth of Field (DoF) calculation
    float depthBlur = smoothstep(0.0, uFocusRange, abs(linearDepth - uFocusDepth)) * uBlurStrength;

    // Depth-aware Chromatic Aberration & Bokeh Sampling
    vec2 texelSize = 1.0 / uResolution;
    float caOffset = uChromaticAberration * (1.0 + depthBlur * 2.0);

    // Multi-sample depth-aware blur
    vec4 col = vec4(0.0);
    vec4 colR = texture2D(uTexture, uv + vec2(caOffset, 0.0));
    vec4 colG = texture2D(uTexture, uv);
    vec4 colB = texture2D(uTexture, uv - vec2(caOffset, 0.0));

    col = vec4(colR.r, colG.g, colB.b, colG.a);

    // Simple 9-tap Poisson / Gaussian blur weighted by depth blur amount
    if (depthBlur > 0.01) {
        vec4 blurCol = vec4(0.0);
        float totalWeight = 0.0;

        for (int x = -2; x <= 2; x++) {
            for (int y = -2; y <= 2; y++) {
                vec2 offset = vec2(float(x), float(y)) * texelSize * depthBlur * 3.0;
                float weight = 1.0 - (length(vec2(x, y)) / 3.0);
                blurCol += texture2D(uTexture, uv + offset) * weight;
                totalWeight += weight;
            }
        }
        col = mix(col, blurCol / max(totalWeight, 0.001), clamp(depthBlur, 0.0, 1.0));
    }

    // Subtle vignette effect
    vec2 centerUv = uv - 0.5;
    float vignette = 1.0 - dot(centerUv, centerUv) * 0.4;
    col.rgb *= clamp(vignette, 0.0, 1.0);

    gl_FragColor = col;
}
`;
