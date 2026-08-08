import React from "react";
import Tab from "../UI/Tab";

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
            <button>Heart</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailUi;
