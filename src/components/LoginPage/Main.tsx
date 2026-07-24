import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import Input from "./Input";
import Poster from "./Poster";

const Main = () => {
  return (
    <div className="h-screen login-container">
      <Scene />
      <Leva collapsed />
    </div>
  );
};

const Scene = () => {
  return (
    <Canvas>
      <Poster />
      <Input />

      {/* <OtpInput show={showOtp} /> */}

      <directionalLight position={[3, 1, 5]} intensity={8.7} color="#3457e5" />
      <ambientLight intensity={0.4} color="#504ed8" />
    </Canvas>
  );
};

export default Main;
