import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import Input from "./Input";
import Poster from "./Poster";
import Gradient from "./Gradient";
import { RingDistordRenderTarget } from "../../libs/ringDistordRenderTarget";
import GroupOfSphere from "../General/GroupOfSphere";
import GroupMember from "./GroupMember";
import EventCard from "../HomePage/EventCard";

const Main = () => {
  return (
    <div className="h-screen login-container">
      <Scene />
      <Leva collapsed />
      <GroupMember />
    </div>
  );
};

const Scene = () => {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <RingDistordRenderTarget />
      <Poster />
      <Gradient />
      {/* <Input /> */}
      {/* <GroupOfSphere /> */}
      {/* <EventCard /> */}

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
    </Canvas>
  );
};

export default Main;
