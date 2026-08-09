import React, { useEffect } from "react";
import Tab from "../UI/Tab";
import Heart from "../Icons/Heart";
import WobbleButton from "../UI/WobbleButton";
import { pageColor } from "../../libs/config/pageColor";
import { useSearchParams } from "react-router";

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
            rippleCoord={[-0.3, 0.1]}
            initialTab={tabComponentIndex}
          />
          <div className="rating-container">
            <span>4</span>
            <button className="rate-btn">
              <Heart />
              <span className="visually-hidden">Like this event</span>
            </button>
          </div>
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
      <div className="ticket-detail-description"></div>
    </section>
  );
};

const Review = () => {
  return (
    <section className="ticket-detail-review-tab">
      <div className="review-container">
        <h1>hello</h1>
      </div>
    </section>
  );
};

export default TicketDetailUi;
