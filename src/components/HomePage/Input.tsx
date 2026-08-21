import { Html, useGLTF } from "@react-three/drei";
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { useMouse } from "../../libs/useMouse";
import { useFrame } from "@react-three/fiber";
import { remapClamp } from "../../libs/remapClamp";
import { lerp } from "../../libs/lerp";
import { useEmailInput } from "../../libs/useEmailInput";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import { useControls } from "leva";
import { createRipple } from "../../libs/createRipple";
import { useNavigate } from "react-router";
import { pageColor } from "../../libs/config/pageColor";
import { loginObstacle, ratioScale } from "../../libs/config/pageSphere";

gsap.registerPlugin(SplitText);

const Input = () => {
  const navigate = useNavigate();
  const { nodes, materials } = useGLTF("models/login-input.glb") as any;

  const [visible, setVisible] = useState(true);
  const [clicked, setClicked] = useState(false);
  const isSubmittedRef = useRef(false);

  const ref = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const shakeTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const isUserHover = useRef(false);

  const inputTextRef = useRef<HTMLInputElement>(null);

  const { coords, updateMouse } = useMouse();

  const { color } = useControls("Input", {
    color: "#3457e5",
  });

  useFrame(() => {
    if (!ref.current || !visible) return;

    // Keep obstacle physics collider in exact sync with input mesh scale
    loginObstacle.scale = ref.current.scale.x;

    updateMouse();

    const targetY = remapClamp(coords.x, -1, 1, -0.4, 0.1) * 0.6;
    const targetX = remapClamp(-coords.y, -1, 1, -0.4, 0.2) * 0.6;

    ref.current.rotation.y = lerp(ref.current.rotation.y, targetY, 0.05);
    ref.current.rotation.x = lerp(ref.current.rotation.x, targetX, 0.05);
  });

  // Enter animation (scale 0 to 1) synced with physics obstacle
  useEffect(() => {
    if (!ref.current) return;

    ref.current.scale.set(0, 0, 0);
    loginObstacle.scale = 0;

    const ctx = gsap.context(() => {
      gsap.to(ref.current!.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
      });
    });

    return () => {
      ctx.revert();
      loginObstacle.scale = 0;
    };
  }, []);

  // Continuous idle Z-shake: bounce left→right→rest, pause 2 s, repeat
  const SHAKE_AMPLITUDE = 0.03; // radians
  const timeScale = 0.6;
  useEffect(() => {
    if (!spinGroupRef.current) return;

    const target = spinGroupRef.current.rotation;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

    tl.fromTo(
      target,
      { z: 0 },
      {
        z: SHAKE_AMPLITUDE,
        duration: 0.22 * timeScale,
        ease: "sine.out",
      },
    );
    tl.fromTo(
      target,
      { z: SHAKE_AMPLITUDE },
      {
        z: -SHAKE_AMPLITUDE,
        duration: 0.22 * timeScale,
        ease: "sine.inOut",
        onComplete: () => {
          if (!isUserHover.current) {
            window.dispatchEvent(new CustomEvent("change-text"));
          }
        },
        repeat: 2,
        yoyo: true,
      },
    ).to(target, {
      z: 0,
      duration: 0.35 * timeScale,
      ease: "sine.out",
    });

    shakeTimelineRef.current = tl;

    return () => {
      tl.kill();
    };
  }, []);

  const handlePointerEnter = () => {
    if (isSubmittedRef.current) return;
    document.body.style.cursor = "pointer";
    isUserHover.current = true;

    if (shakeTimelineRef.current) {
      shakeTimelineRef.current.pause();
      if (spinGroupRef.current) {
        gsap.to(spinGroupRef.current.rotation, {
          z: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }

    if (!ref.current) return;
    gsap.to(ref.current.scale, {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      duration: 0.6,
      ease: "back.out(2)",
      overwrite: "auto",
    });

    window.dispatchEvent(
      new CustomEvent("user-input-hover", {
        detail: { text: "Enjoy Your Day!", isHovering: true },
      }),
    );
  };

  const handlePointerLeave = () => {
    if (isSubmittedRef.current) return;
    document.body.style.cursor = "auto";
    isUserHover.current = false;

    if (shakeTimelineRef.current) {
      shakeTimelineRef.current.resume();
    }

    if (!ref.current) return;
    gsap.to(ref.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });

    window.dispatchEvent(
      new CustomEvent("user-input-hover", {
        detail: { text: "", isHovering: false },
      }),
    );
  };

  const handleClick = () => {
    // setClicked(true);
    // focus is called after InputText mounts via the ref
    // setTimeout(() => inputTextRef.current?.focus(), 0);

    createRipple({
      coord: { x: 0.24, y: 0 },
      isPageTransition: true,
      nextPathname: "/explore",
      colorA: pageColor.Explore.colorA,
      colorB: pageColor.Explore.colorB,
      transitionFireAt: 0.5,
      timeScale: 1,
      rippleDirection: "in",
      delay: 0.2,
    });

    // window.setTimeout(() => navigate("/"), 1100);
    cleanUp();
  };

  const rotateEmailInput = () => {
    if (!spinGroupRef.current) return;

    const round = -1;

    gsap.fromTo(
      spinGroupRef.current.rotation,
      { x: 0 },
      {
        x: Math.PI * 2 * round,
        duration: 1.2 + Math.abs(round * 0.05),
        ease: "elastic.out(1, 1)",
      },
    );
  };

  const cleanUp = () => {
    if (!ref.current) return;
    isSubmittedRef.current = true;
    gsap.to(ref.current.scale, {
      x: 0,
      y: 0,
      z: 0,
      delay: 0.2,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        loginObstacle.scale = 0;
        document.body.style.cursor = "auto";
        setVisible(false);
      },
    });
  };

  // const { texture, focus, blur } = useEmailInput((email) => {
  //   // rotateEmailInput();
  //   // onSubmitted();

  //   // console.log(coords.x, coords.y);

  //   window.dispatchEvent(
  //     new CustomEvent("ripple-click", {
  //       detail: { x: 0.24, y: 0 },
  //     }),
  //   );

  //   cleanUp();
  // });
  // texture.flipY = false;

  // useEffect(() => {
  //   const handleSubmit = (_event: Event) => {
  //     // rotateEmailInput();

  //     createRipple({
  //       coord: { x: 0.24, y: 0 },
  //       isPageTransition: true,
  //       nextPathname: "/explore",
  //       colorA: pageColor.Home.colorA,
  //       colorB: pageColor.Home.colorB,
  //       transitionFireAt: 0.5,
  //       timeScale: 1,
  //       rippleDirection: "in",
  //       delay: 0.2,
  //     });

  //     // window.setTimeout(() => navigate("/"), 1100);
  //     cleanUp();
  //   };

  //   window.addEventListener("user-input-submit", handleSubmit);

  //   return () => {
  //     window.removeEventListener("user-input-submit", handleSubmit);
  //   };
  // }, [navigate]);

  useEffect(() => {
    const handleClick = () => {
      cleanUp();
    };

    window.addEventListener("menu-click", handleClick);

    return () => {
      window.removeEventListener("menu-click", handleClick);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <group ref={ref} position={[2 * ratioScale, -0.2, -0.2]} scale={0}>
        <group ref={spinGroupRef}>
          {/* Email input plane — canvas texture replaces the baked text mesh */}
          <mesh geometry={nodes.text.geometry}>
            <meshStandardMaterial
              emissiveIntensity={0.6}
              roughness={0.3}
              metalness={0.4}
              // emissiveMap={texture}
              // map={texture}
              emissive={"white"}
            />
          </mesh>

          <mesh
            geometry={nodes.Mesh_1.geometry}
            material={materials.Material_1}
          />
          <mesh
            geometry={nodes.Mesh_1_1.geometry}
            // material={materials.Material_0}
          >
            <meshStandardMaterial
              emissiveIntensity={2.5}
              roughness={0.1}
              metalness={0.9}
              emissive={color}
            />
          </mesh>

          {/* {clicked ? (
            <InputText
              ref={inputTextRef}
              onBlurEmpty={() => setClicked(false)}
            />
          ) : (
            <AnimateText />
          )} */}
          <AnimateText />
        </group>
      </group>

      {/* Invisible Hover Helper to prevent jitter at the edge  */}
      <Html position={[0, 0.3, 0]}>
        <div
          className="input-hover-helper"
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
          onClick={handleClick}
        />
      </Html>
    </>
  );
};

const InputText = ({ ref, onBlurEmpty }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  useImperativeHandle(ref, () => ({
    focus: handleFocus,
  }));

  const handleBlur = () => {
    if (!inputRef.current?.value) {
      onBlurEmpty?.();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = inputRef.current?.value;

    window.dispatchEvent(
      new CustomEvent("user-input-submit", {
        detail: { email },
      }),
    );
  };

  return (
    <Html
      position={[0, 0, 0.2]}
      center
      transform
      // occlude
    >
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="input"
          type="text"
          autoFocus
          onBlur={handleBlur}
        />
      </form>
    </Html>
  );
};

const data = ["Find Your Vibe", "Book It", "✨ Let the Fun Begin"];
const AnimateText = () => {
  const textRef = useRef<HTMLHeadingElement>(null);
  const indexRef = useRef(0);
  const currentSplitRef = useRef<SplitText | null>(null);
  const isBusyRef = useRef(false);
  const pendingTextRef = useRef<string | null>(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const animateToText = (targetText: string) => {
      const el = textRef.current;
      if (!el) return;

      if (isBusyRef.current) {
        pendingTextRef.current = targetText;
        return;
      }

      if (el.textContent === targetText) {
        return;
      }

      isBusyRef.current = true;

      const playIn = (text: string) => {
        if (!textRef.current) {
          isBusyRef.current = false;
          return;
        }

        if (currentSplitRef.current) {
          currentSplitRef.current.revert();
          currentSplitRef.current = null;
        }

        textRef.current.textContent = text;

        const split = new SplitText(textRef.current, {
          type: "chars",
          charsClass: "char",
        });
        currentSplitRef.current = split;

        gsap.from(split.chars, {
          // y: 30,
          scale: 0,
          stagger: 0.03,
          duration: 0.4,
          ease: "back.out(1.7)",
          transformOrigin: "50% 80%",
          force3D: false,
          onComplete: () => {
            isBusyRef.current = false;
            if (pendingTextRef.current !== null) {
              const nextText = pendingTextRef.current;
              pendingTextRef.current = null;
              animateToText(nextText);
            }
          },
        });
      };

      if (!currentSplitRef.current) {
        playIn(targetText);
        return;
      }

      gsap.to(currentSplitRef.current.chars, {
        // y: -30,
        scale: 0,
        stagger: 0.03,
        duration: 0.2,
        ease: "power2.in",
        transformOrigin: "50% 80%",
        force3D: false,
        onComplete: () => {
          if (currentSplitRef.current) {
            currentSplitRef.current.revert();
            currentSplitRef.current = null;
          }
          playIn(targetText);
        },
      });
    };

    const timer = setTimeout(() => {
      animateToText(data[indexRef.current]);
    }, 100);

    const handleChangeText = () => {
      if (
        isHoveredRef.current ||
        isBusyRef.current ||
        pendingTextRef.current !== null
      )
        return;

      indexRef.current = (indexRef.current + 1) % data.length;
      animateToText(data[indexRef.current]);
    };

    const handleUserHover = (e: Event) => {
      const customEvent = e as CustomEvent<{
        text?: string;
        isHovering?: boolean;
      }>;
      const { text, isHovering } = customEvent.detail || {};
      isHoveredRef.current = !!isHovering;

      if (isHovering) {
        animateToText(text || "Enjoy Your Day!");
      } else {
        animateToText(data[indexRef.current]);
      }
    };

    window.addEventListener("change-text", handleChangeText);
    window.addEventListener("user-input-hover", handleUserHover);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("change-text", handleChangeText);
      window.removeEventListener("user-input-hover", handleUserHover);
      if (currentSplitRef.current) {
        currentSplitRef.current.revert();
      }
    };
  }, []);

  return (
    <Html
      position={[0, 0, 0.2]}
      center
      transform
      // occlude
      style={{ pointerEvents: "none" }}
    >
      <h1 ref={textRef} className="animate-input-text">
        {data[0]}
      </h1>
      {/* <input type="email" placeholder="Enter Email" autoFocus /> */}
    </Html>
  );
};

export default Input;
