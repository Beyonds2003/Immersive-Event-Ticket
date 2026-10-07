import React, { useState, useRef, useLayoutEffect } from "react";
import { useAtomValue } from "jotai";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import PenIcon from "../Icons/Pen";
import WobbleButton from "../UI/WobbleButton";
import { profileAtom } from "../../libs/atoms";

gsap.registerPlugin(Flip);

export interface ReviewItem {
  id: number | string;
  name: string;
  review: string;
  date: string;
}

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 1,
    name: "Yadanar",
    review: "The event was really well organized. Had a great time!",
    date: "1h ago",
  },
  {
    id: 2,
    name: "Khin",
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

export interface ReviewProps {
  reviews?: ReviewItem[];
  setReviews?: React.Dispatch<React.SetStateAction<ReviewItem[]>>;
}

const Review: React.FC<ReviewProps> = ({
  reviews: externalReviews,
  setReviews: externalSetReviews,
}) => {
  const [internalReviews, setInternalReviews] =
    useState<ReviewItem[]>(INITIAL_REVIEWS);
  const reviews = externalReviews ?? internalReviews;
  const setReviews = externalSetReviews ?? setInternalReviews;
  const [inputText, setInputText] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store layout state for FLIP animation
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const newlyAddedIdRef = useRef<number | string | null>(null);

  // Animate layout shift and new item entrance
  useLayoutEffect(() => {
    if (!flipStateRef.current || !listRef.current || !newlyAddedIdRef.current)
      return;

    const flipState = flipStateRef.current;
    const newId = newlyAddedIdRef.current;

    flipStateRef.current = null;
    newlyAddedIdRef.current = null;

    const listEl = listRef.current;
    const newCard = listEl.querySelector<HTMLElement>(
      `[data-review-id="${newId}"]`,
    );
    const existingCards = listEl.querySelectorAll<HTMLElement>(
      `.user-review:not([data-review-id="${newId}"])`,
    );

    // 1. Layout animation: smooth transition for cards moving to their new positions
    Flip.from(flipState, {
      targets: existingCards,
      duration: 0.55,
      ease: "power2.out",
      clearProps: "transform",
    });

    // 2. Entrance animation: new review comes up with scale and opacity
    if (newCard) {
      gsap.fromTo(
        newCard,
        {
          opacity: 0,
          scale: 0.75,
          y: 24,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.55,
          ease: "back.out(1.4)",
          clearProps: "transform,opacity",
        },
      );
    }
  }, [reviews]);

  const profileData = useAtomValue(profileAtom);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const content = inputText.trim();

    // If user is logged in, open the profile dialog; otherwise, trigger login dialog
    if (!profileData) {
      window.dispatchEvent(new CustomEvent("login-click"));
      return;
    }

    if (!content) {
      inputRef.current?.focus();
      return;
    }

    // Capture initial positions of all current review cards before updating DOM
    if (listRef.current) {
      const currentCards =
        listRef.current.querySelectorAll<HTMLElement>(".user-review");
      flipStateRef.current = Flip.getState(currentCards);
    }

    const newReview: ReviewItem = {
      id: Date.now(),
      name: profileData.full_name || "You",
      review: content,
      date: "Just now",
    };

    newlyAddedIdRef.current = newReview.id;
    setReviews((prev) => [newReview, ...prev]);
    setInputText("");

    // Smoothly scroll the container to top if scrolled down
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="ticket-detail-review-tab">
      <div className="review-container">
        <form className="review-input-container" onSubmit={handleSubmit}>
          <div className="review-icon-container">
            <PenIcon />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Write your review..."
            className="review-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div>
            <WobbleButton
              text="Post"
              hoverText="Share"
              fillColor="white"
              textColor="black"
              width={140}
              height={60}
              fontSize={1.15}
              fontFamily="Dingos-Bold"
              bulgeAmount={3}
              stiffness={0.04}
              damping={0.96}
              proximityThreshold={70}
              onClick={handleSubmit}
            />
          </div>
        </form>
      </div>

      <div className="user-review-container" ref={containerRef}>
        <UserReview reviews={reviews} listRef={listRef} />
      </div>
    </section>
  );
};

interface UserReviewProps {
  reviews: ReviewItem[];
  listRef: React.RefObject<HTMLDivElement | null>;
}

const getInitials = (name?: string): string => {
  if (!name) return "U";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

const UserReview: React.FC<UserReviewProps> = ({ reviews, listRef }) => {
  return (
    <div className="user-review-list" ref={listRef}>
      {reviews.map((review) => (
        <article
          className="user-review"
          key={review.id}
          data-review-id={review.id}
          data-flip-id={review.id}
        >
          <div className="user-profile">
            <span>{getInitials(review.name)}</span>
          </div>

          <div className="user-review-content">
            <h2>{review.name}</h2>
            <p>{review.review}</p>
            <p className="user-review-date">{review.date}</p>
          </div>
        </article>
      ))}
    </div>
  );
};

export default Review;
