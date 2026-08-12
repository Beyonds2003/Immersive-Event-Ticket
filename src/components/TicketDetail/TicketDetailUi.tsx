import React, { useEffect } from "react";
import Tab from "../UI/Tab";
import Heart from "../Icons/Heart";
import WobbleButton from "../UI/WobbleButton";
import { pageColor } from "../../libs/config/pageColor";
import { useSearchParams } from "react-router";
import gsap from "gsap";
import Review from "./Review";

const colorA = pageColor.Detail.colorA;
const colorB = pageColor.Detail.colorB;
const colorC = "#fcd17c";
const colorD = "#f8c05c";

const TicketDetailUi = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read tab from URL: ?tab=1 → About, ?tab=2 → Review. Default to 1.
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "2" ? 2 : 1;

  // 0-based index for the Tab component (0 = About, 1 = Review)
  const tabComponentIndex = activeTab - 1;

  // Listen to the tab-click custom event dispatched by <Tab />
  useEffect(() => {
    const handleTabClick = (e: Event) => {
      const detail = (e as CustomEvent<{ tabIndex: number }>).detail;
      const newTab = detail.tabIndex === 0 ? "1" : "2";
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", newTab);
          return next;
        },
        { replace: true },
      );
    };
    window.addEventListener("tab-click", handleTabClick);
    return () => window.removeEventListener("tab-click", handleTabClick);
  }, [setSearchParams]);

  // Listen menu close
  useEffect(() => {
    const handleMenuClose = () => {
      gsap.to(".ticket-detail-container", {
        opacity: 0,
        duration: 0.6,
        ease: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    };

    window.addEventListener("menu-click", handleMenuClose);
    return () => window.removeEventListener("menu-click", handleMenuClose);
  }, []);

  return (
    <div className="ticket-detail-overlay">
      <div className="ticket-detail-container">
        <div className="ticket-detail-tab-container">
          <Tab
            colorA={colorA}
            colorB={colorB}
            colorC={colorC}
            colorD={colorD}
            textA="About"
            textB="Review"
            className="ticket-detail-tab"
            initialTab={tabComponentIndex}
            isRippleFromClick={true}
            rippleDirection="out"
            timeScale={0.9}
          />
          <button className="rating-container">
            <span>4</span>
            <div className="rate-btn">
              <Heart />
              <span className="visually-hidden">Like this event</span>
            </div>
          </button>
        </div>

        <div key={activeTab} className="tab-panel">
          {activeTab === 1 ? <About /> : <Review />}
        </div>
      </div>
    </div>
  );
};

const About = () => {
  return (
    <section className="ticket-detail-about-tab">
      <div className="ticket-detail-content relative">
        <div>
          <span className="date">10.8.2026</span>
          <h1 className="title">Event Title</h1>
        </div>
        <p className="desc-text">
          Two days of advanced React Three Fiber with the core pmndrs team who
          build and maintain it - all about the techniques and performance
          habits that turn a demo into something you can ship.
        </p>
        <p className="speaker">
          With <a>Naruto</a>
          <span> &amp; </span>
          <a>Sasuke</a>
        </p>
        <div className="buy-ticket-btn-container">
          <WobbleButton
            text="Buy Ticket"
            hoverText="Enjoy!"
            fillColor="#f1e8dd"
            textColor="black"
            width={200}
            height={60}
            fontSize={1.15}
            bulgeAmount={3}
            stiffness={0.04}
            damping={0.96}
            fontFamily="Dingos-Bold"
            proximityThreshold={70}
          />
        </div>
      </div>

      <AboutDescription />

      <div className="buy-ticket-btn-container-2">
        <WobbleButton
          text="Buy Ticket"
          hoverText="Enjoy!"
          fillColor="black"
          textColor="white"
          width={200}
          height={60}
          fontSize={1.15}
          bulgeAmount={3}
          stiffness={0.04}
          damping={0.96}
          fontFamily="Dingos-Bold"
          proximityThreshold={70}
        />
      </div>
    </section>
  );
};

const AboutDescription = () => {
  return (
    <div className="ticket-detail-description">
      <div className="ticket-detail-qa-container">
        <h4 className="ticket-detail-q">Architect scenes that scale</h4>
        <p className="ticket-detail-a">
          The patterns the maintainers actually use - component design, state
          management and reconciler internals that keep large scenes
          maintainable, not fragile.
        </p>
      </div>

      <div className="ticket-detail-qa-container">
        <h4 className="ticket-detail-q">Architect scenes that scale</h4>
        <p className="ticket-detail-a">
          The patterns the maintainers actually use - component design, state
          management and reconciler internals that keep large scenes
          maintainable, not fragile.
        </p>
        <ul className="ticket-detail-bullets">
          <li>
            <strong>WebGPU</strong> - the modern rendering path, and when it's
            worth the jump from WebGL.
          </li>
          <li>
            <strong>Instancing &amp; draw-call batching</strong> - turning
            thousands of objects into a handful of calls.
          </li>
          <li>
            <strong>Compute shaders</strong> - moving heavy per-frame work off
            the CPU and onto the GPU.
          </li>
          <li>
            <strong>Memory budgets &amp; profiling</strong> - the workflow that
            catches regressions before they ship.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TicketDetailUi;
