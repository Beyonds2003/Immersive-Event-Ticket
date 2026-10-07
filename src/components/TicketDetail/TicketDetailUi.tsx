import React, { useEffect, useState } from "react";
import Tab from "../UI/Tab";
import Heart from "../Icons/Heart";
import WobbleButton from "../UI/WobbleButton";
import { pageColor, pageTabColor } from "../../libs/config/pageColor";
import { useSearchParams } from "react-router";
import gsap from "gsap";
import Review from "./Review";
import BuyTicketSummaryDialog from "../General/BuyTicketSummaryDialog";
import TicketBoughtIcon from "../Icons/TicketBoughtIcon";
import AnimatedLikeCount from "./AnimatedLikeCount";

const colorA = pageTabColor.Detail[0];
const colorB = pageTabColor.Detail[1];
// const colorC = "#ffd9a6";
// const colorD = "#ffcc9d";
// const colorC = "#f1f1ff";
// const colorD = "#cfd1ff";
const colorC = pageTabColor.Detail[2];
const colorD = pageTabColor.Detail[3];

const TicketDetailUi = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isTicketBought, setIsTicketBought] = useState(false);

  const [isLikeClicked, setIsLikeClicked] = useState(false);

  // Read tab from URL: ?tab=1 → About, ?tab=2 → Review. Default to 1.
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "2" ? 2 : 1;

  // 0-based index for the Tab component (0 = About, 1 = Review)
  const tabComponentIndex = activeTab - 1;

  const handleLikeClick = () => {
    setIsLikeClicked((prev) => !prev);
  };

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

  // Listen to the ticket bought event
  useEffect(() => {
    const handleTicketBought = () => {
      setIsTicketBought(true);
    };

    window.addEventListener("finish-payment", handleTicketBought);
    return () =>
      window.removeEventListener("finish-payment", handleTicketBought);
  }, []);

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
            timeScale={0.6}
          />
          <button onClick={handleLikeClick} className="rating-container">
            <AnimatedLikeCount isLikeClicked={isLikeClicked} count={203} />
            <div className="rate-btn">
              <Heart isLikeClicked={isLikeClicked} />
            </div>
          </button>
        </div>

        <div key={activeTab} className="tab-panel">
          {activeTab === 1 ? (
            <About isTicketBought={isTicketBought} />
          ) : (
            <Review />
          )}
        </div>
      </div>
    </div>
  );
};

const About = ({ isTicketBought }: { isTicketBought: boolean }) => {
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

        {/* Event Info — compact inline */}
        <div className="event-info-row">
          <span className="event-info-item">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            San Francisco, CA
          </span>
          <span className="event-info-dot">·</span>
          <span className="event-info-item">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            9:00 AM - 5:00 PM
          </span>
          <span className="event-info-dot">·</span>
          <span className="event-info-item">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            3000 MMK
          </span>
        </div>

        {/* Capacity — slim bar */}
        <div className="event-capacity">
          <div className="event-capacity-header">
            <span className="event-capacity-count">156 / 200 spots</span>
            <span className="event-capacity-urgency">44 left</span>
          </div>
          <div className="event-capacity-track">
            <div className="event-capacity-fill" style={{ width: "78%" }} />
          </div>
        </div>

        <div className="buy-ticket-btn-container">
          {isTicketBought ? (
            <TicketBoughtIcon />
          ) : (
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
              onClick={(e) => {
                const btn =
                  (e?.currentTarget as HTMLElement) ||
                  (e?.target as HTMLElement) ||
                  document.querySelector(
                    ".buy-ticket-btn-container .wobbly-btn",
                  );
                window.dispatchEvent(
                  new CustomEvent("buy-ticket-click", {
                    detail: { sourceEl: btn },
                  }),
                );
              }}
            />
          )}
        </div>
      </div>

      <AboutDescription />
      {!isTicketBought && (
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
            onClick={(e) => {
              const btn =
                (e?.currentTarget as HTMLElement) ||
                (e?.target as HTMLElement) ||
                document.querySelector(
                  ".buy-ticket-btn-container-2 .wobbly-btn",
                );
              window.dispatchEvent(
                new CustomEvent("buy-ticket-click", {
                  detail: { sourceEl: btn },
                }),
              );
            }}
          />
        </div>
      )}
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
