import React, { useEffect, useRef } from "react";
import WobbleButton from "../UI/WobbleButton";
import CirclePromo from "../Icons/CirclePromo";
import gsap from "gsap";

const NfcUi = () => {
  // Enter animation — slide up from below + fade in
  useEffect(() => {
    gsap.fromTo(
      ".nfc-btn-container",
      { opacity: 0 },
      {
        opacity: 1,
        delay: 1,
        duration: 1,
        ease: "power4.out",
      },
    );
  }, []);

  // Exit animation — menu-click event
  useEffect(() => {
    const handleClick = () => {
      gsap.to(".nfc-btn-container", {
        opacity: 0,
        duration: 0.65,
        ease: "power3.in",
      });
    };

    window.addEventListener("menu-click", handleClick);
    return () => window.removeEventListener("menu-click", handleClick);
  }, []);

  return (
    <div className="nfc-container">
      <div className="nfc-btn-container">
        <WobbleButton
          text="Buy Nfc"
          hoverText="Tap to pay"
          fillColor="#9688E8"
          width={200}
          height={50}
          fontSize={1.05}
          fontFamily="Dingos-Bold"
          bulgeAmount={6}
          stiffness={0.04}
          damping={0.96}
          proximityThreshold={70}
        />
      </div>
    </div>
  );
};

export default NfcUi;
