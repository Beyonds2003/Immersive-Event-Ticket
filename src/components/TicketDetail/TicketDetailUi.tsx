import React from "react";
import Tab from "../UI/Tab";
import Heart from "../Icons/Heart";
import WobbleButton from "../UI/WobbleButton";

const colorA = "#33fcbc";
const colorB = "#18eba9";
const colorC = "#fcd17c";
const colorD = "#f8c05c";

const TicketDetailUi = () => {
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
          />
          <div className="rating-container">
            <span>4</span>
            <button className="rate-btn">
              <Heart />
              <span className="visually-hidden">Like this event</span>
            </button>
          </div>
        </div>
        <div className="ticket-detail-content relative">
          <span className="date">10.8.2026</span>
          <h1 className="title">Event Title</h1>
          <div className="buy-ticket-btn-container">
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
        </div>
        <div className="ticket-detail-description"></div>
      </div>
    </div>
  );
};

export default TicketDetailUi;
