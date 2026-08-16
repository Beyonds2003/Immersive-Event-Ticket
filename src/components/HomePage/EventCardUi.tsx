import { useEffect } from "react";
import Arrow from "../Icons/Arrow";
import Tab from "../UI/Tab";
import gsap from "gsap";

const colorA = "#06ecff";
const colorB = "#00e1ff";
const colorC = "#fff170";
const colorD = "#efda21";

const EventCardUi = () => {
  // Handle Menu Click
  useEffect(() => {
    const handleClick = () => {
      gsap.to(".ticket-detail-page-ui", {
        opacity: 0,
        duration: 0.1,
      });
    };

    window.addEventListener("menu-click", handleClick);

    return () => {
      window.removeEventListener("menu-click", handleClick);
    };
  });

  return (
    <div className="ticket-detail-page-ui">
      <Tab
        colorA={colorA}
        colorB={colorB}
        colorC={colorC}
        colorD={colorD}
        textA="New"
        textB="Old"
        rippleCoord={[0, -0]}
        timeScale={1.2}
      />
      <Navigation />
    </div>
  );
};

const Navigation = () => {
  const handleClick = (direction: "left" | "right") => {
    window.dispatchEvent(
      new CustomEvent("navigation-click", {
        detail: { direction },
      }),
    );
  };

  return (
    <div className="navigation-container">
      <button
        onClick={() => handleClick("left")}
        className="navigation-item left"
        aria-label="Previous slide"
      >
        <Arrow
          direction="left"
          aria-hidden="true"
          focusable="false"
          size={30}
        />
      </button>

      <button
        onClick={() => handleClick("right")}
        className="navigation-item right"
        aria-label="Next slide"
      >
        <Arrow
          direction="right"
          aria-hidden="true"
          focusable="false"
          size={30}
        />
      </button>
    </div>
  );
};

export default EventCardUi;
