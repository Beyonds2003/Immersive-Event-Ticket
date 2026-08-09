import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useAtomValue } from "jotai";
import * as THREE from "three";
import { pathnameAtom } from "../../libs/atoms";
import { pageCamera, routeCameraMap } from "../../libs/config/pageCamera";

export const PageCameraController = () => {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const pathname = useAtomValue(pathnameAtom);

  useEffect(() => {
    const pageKey = routeCameraMap[pathname] ?? "Home";
    const target = pageCamera[pageKey];

    if (!target || !camera) return;

    camera.position.set(...target.position);
    camera.fov = target.fov;
    camera.updateProjectionMatrix();
  }, [pathname, camera]);

  return null;
};
