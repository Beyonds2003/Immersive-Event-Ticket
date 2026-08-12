import React from "react";
import PenIcon from "../Icons/Pen";
import SmileIcon from "../Icons/Smile";
import WobbleButton from "../UI/WobbleButton";

const Review = () => {
  return (
    <section className="ticket-detail-review-tab">
      <div className="review-container">
        {" "}
        <div className="review-input-container">
          <div className="review-icon-container">
            <PenIcon />
          </div>

          <input
            type="text"
            placeholder="Write your review..."
            className="review-input"
          />

          <button className="review-icon-container cursor-pointer">
            <SmileIcon />
          </button>
          <div>
            <WobbleButton
              text="Post"
              hoverText="Share"
              fillColor="#a13c52"
              width={140}
              height={60}
              fontSize={1.15}
              fontFamily="Dingos-Bold"
              bulgeAmount={6}
              stiffness={0.04}
              damping={0.96}
              proximityThreshold={70}
            />
          </div>
        </div>
      </div>

      <div className="user-review-container">
        <UserReview />
      </div>
    </section>
  );
};

const reviews = [
  {
    id: 1,
    name: "Addy",
    review: "The event was really well organized. Had a great time!",
    date: "1h ago",
  },
  {
    id: 2,
    name: "Mia",
    review: "Loved the atmosphere and the people. Definitely coming again.",
    date: "2h ago",
  },
  {
    id: 3,
    name: "Ethan",
    review: "Everything was smooth from entry to the end of the event.",
    date: "4h ago",
  },
  {
    id: 4,
    name: "Sophia",
    review: "Such a fun event! The activities were amazing.",
    date: "6h ago",
  },
  {
    id: 5,
    name: "Noah",
    review: "Great experience overall. Can't wait for the next one!",
    date: "1d ago",
  },
];

const UserReview = () => {
  return (
    <div className="user-review-list">
      {reviews.map((review) => (
        <div className="user-review" key={review.id}>
          <div className="user-profile" />

          <div className="user-review-content">
            <h2>{review.name}</h2>
            <p>{review.review}</p>
            <p className="user-review-date">{review.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Review;
