import { Leva } from "leva";
import GroupMember from "./components/LoginPage/GroupMember";
import { useShowFps } from "./libs/useShowFps";
import { Canvas } from "@react-three/fiber";
import { RingDistordRenderTarget } from "./libs/ringDistordRenderTarget";
import Gradient from "./components/LoginPage/Gradient";
import Poster from "./components/LoginPage/Poster";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";

const App = () => {
  return (
    <div className="h-screen login-container">
      <Scene />
      <Leva collapsed />
      <GroupMember />
    </div>
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
      <RingDistordRenderTarget />
      <Gradient />
      <Poster />

      {/* <HomePage /> */}
      <LoginPage />

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
    </Canvas>
  );
};

export default App;
