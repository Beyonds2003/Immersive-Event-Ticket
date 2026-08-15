import { Leva } from "leva";
import GroupMember from "./components/LoginPage/GroupMember";
import { useShowFps } from "./libs/useShowFps";
import { Canvas } from "@react-three/fiber";
import { RingDistordRenderTarget } from "./libs/ringDistordRenderTarget";
import Gradient from "./components/LoginPage/Gradient";
import Poster from "./components/LoginPage/Poster";
import { BrowserRouter, useLocation } from "react-router";
import AppRoutes, { RouterBridge } from "./router";
import { useSetAtom } from "jotai";
import { pathnameAtom } from "./libs/atoms";
import { Suspense, useEffect } from "react";
import MenuButton from "./components/UI/WobbleMenu";
import PageHtmlUi from "./components/General/PageHtmlUi";
import { PageCameraController } from "./components/General/PageCameraController";
import PageNavigator from "./components/General/PageNavigator";

/** Syncs React Router location into the Jotai atom so R3F canvas can read it */
const LocationSync = () => {
  const location = useLocation();
  const setPathname = useSetAtom(pathnameAtom);
  useEffect(() => {
    setPathname(location.pathname);
  }, [location.pathname, setPathname]);
  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <LocationSync />
      <div className="h-screen login-container">
        <Scene />
        <Leva collapsed />
        <PageHtmlUi />
        <MenuButton />
      </div>
    </BrowserRouter>
  );
};

const isShowFps = new URLSearchParams(window.location.search).has("fps");
function ShowFps() {
  useShowFps();
  return null;
}

const Scene = () => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <RouterBridge>
        <PageCameraController />
        <RingDistordRenderTarget />
        <PageNavigator />

        <Gradient />
        <Poster />

        <Suspense fallback={null}>
          <AppRoutes />
        </Suspense>

        {/* <OtpInput show={showOtp} /> */}
        {/* <directionalLight position={[3, 1, 5]} intensity={8.7} color="#3457e5" /> */}
        <ambientLight intensity={2.4} color="#504ed8" />
        <ambientLight intensity={2.8} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.8}
          castShadow
          shadow-normalBias={0.008}
        />
        <pointLight position={[0, -3, 3]} intensity={0.4} />
        {isShowFps && <ShowFps />}
      </RouterBridge>
    </Canvas>
  );
};

export default App;
