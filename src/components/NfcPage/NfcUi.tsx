import React, { useEffect, useRef } from "react";
import WobbleButton from "../UI/WobbleButton";
import CirclePromo from "../Icons/CirclePromo";
import gsap from "gsap";

const NfcUi = () => {
  // Enter Animation
  useEffect(() => {
    gsap.fromTo(
      ".nfc-card",
      {
        opacity: 0,
        y: 100,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power4.out",
      },
    );
  });

  // Menu click exit animation
  useEffect(() => {
    const handleClick = () => {
      gsap.to(".nfc-card", {
        opacity: 0,
        y: -100,
        duration: 0.65,
        ease: "power3.in",
      });
    };

    window.addEventListener("menu-click", handleClick);

    return () => window.removeEventListener("menu-click", handleClick);
  });

  return (
    <div className="nfc-container">
      {/* <article className="nfc-card">
        <div className="nfc-img-container">
          <img
            src="/images/nfc-sticker-promo.jpg"
            alt="nfc"
            className="nfc-sticker-promo-img"
          />
        </div>

        <div className="nfc-promo-text">
          <CirclePromo />
        </div>

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
      </article> */}
    </div>
  );
};

export default NfcUi;
