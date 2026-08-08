import { useEffect, useState } from "react";
import WobbleButton from "../WobbleButton";
import "./index.css";
import gsap from "gsap";
import { GSDevTools } from "gsap/GSDevTools";

gsap.registerPlugin(GSDevTools);

const index = () => {
  return (
    <>
      <Main />
    </>
  );
};

const Main = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const handleOpen = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isClosing) {
      setIsClosing(true);
    }
  };

  const handleCloseComplete = () => {
    setIsOpen(false);
    setIsClosing(false);
  };

  return (
    <div>
      <OpenMenuButton onOpen={handleOpen} />
      {isOpen && (
        <>
          <CloseMenuButton onClose={handleClose} isClosing={isClosing} />
          <MenuContent
            isClosing={isClosing}
            onCloseComplete={handleCloseComplete}
          />
        </>
      )}
    </div>
  );
};

const OpenMenuButton = ({ onOpen }: { onOpen: () => void }) => {
  return (
    <div className="menu-container" onClick={onOpen}>
      <div className="wobble-menu-container">
        <WobbleButton
          fillColor="#000000"
          width={65}
          height={65}
          bulgeAmount={4}
          stiffness={0.06}
          damping={0.98}
          clickShockWave={1}
          proximityThreshold={80}
        />
      </div>
      <div className="humbager" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

const CloseMenuButton = ({
  onClose,
  isClosing,
}: {
  onClose: () => void;
  isClosing: boolean;
}) => {
  const enterAnimation = () => {
    gsap.fromTo(
      ".menu-container.close",
      {
        scale: 0,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
      },
    );
  };

  const exitAnimation = () => {
    gsap.fromTo(
      ".menu-container.close",
      {
        scale: 1,
        opacity: 1,
      },
      {
        scale: 0,
        opacity: 0,
        delay: 0.15,
        duration: 0.3,
        ease: "power2.in",
      },
    );
  };

  useEffect(() => {
    if (!isClosing) {
      enterAnimation();
    } else {
      exitAnimation();
    }
  }, [isClosing]);

  return (
    <div className="menu-container close" onClick={onClose}>
      <button className="close-btn">
        <span>×</span>
      </button>
    </div>
  );
};

type MenuContentProps = {
  isClosing: boolean;
  onCloseComplete: () => void;
};

const MenuContent = ({ isClosing, onCloseComplete }: MenuContentProps) => {
  const enterAnimation = () => {
    gsap.killTweensOf([
      ".menu-content-container",
      ".nav-items nav button",
      ".buy-nfc-btn-container",
    ]);

    const tl = gsap.timeline();
    tl.fromTo(
      ".menu-content-container",
      { opacity: 0, scale: 0, transformOrigin: "bottom left" },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" },
    );
    tl.fromTo(
      ".nav-items nav button",
      { x: -80, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.1,
        ease: "power4.out",
      },
      "-=0.6",
    );
    tl.fromTo(
      ".buy-nfc-btn-container",
      { x: -80, opacity: 0 },
      { x: 0, opacity: 1, ease: "power1.out", duration: 0.6 },
      "-=0.7",
    );
  };

  const exitAnimation = () => {
    gsap.killTweensOf([
      ".menu-content-container",
      ".nav-items nav button",
      ".buy-nfc-btn-container",
    ]);

    const tl = gsap.timeline({
      onComplete: onCloseComplete,
    });

    tl.to(".menu-content-container", {
      scale: 0,
      opacity: 0,
      transformOrigin: "bottom left",
      duration: 0.5,
      ease: "power4.inOut",
    });
    tl.to(
      ".nav-items nav button",
      {
        x: -80,
        opacity: 0,
        stagger: 0.05,
        duration: 0.1,
        ease: "power2.in",
      },
      "<-0.2",
    );
  };

  useEffect(() => {
    if (!isClosing) {
      enterAnimation();
    } else {
      exitAnimation();
    }
  }, [isClosing]);

  const handleNavigate = (path: string) => {};

  return (
    <div className="menu-content-container">
      <div className="nav-items">
        <nav>
          <button onClick={() => handleNavigate("/")}>Home</button>
          <button>NFC Card</button>
          <button>Live</button>
          <button>Profile</button>
          <button>FAQ</button>
        </nav>
      </div>
      <div className="buy-nfc-btn-container">
        <WobbleButton
          text="BUY NFC"
          hoverText="LET GO!"
          fillColor="#7BC1AA"
          width={200}
          height={60}
          fontSize={1.3}
          fontFamily="Dingos-Bold"
          textMargin="0 0 -4px 0"
          bulgeAmount={6}
          stiffness={0.04}
          damping={0.96}
          proximityThreshold={70}
        />
      </div>
    </div>
  );
};

export default index;
