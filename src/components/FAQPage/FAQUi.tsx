import React, { useEffect, useState } from "react";
import { faqDatas } from "../../libs/config/faqData";
import gsap from "gsap";

const FAQUi = () => {
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
      <div className="ticket-detail-container faq-parent-container">
        {faqDatas.map((section) => (
          <section key={section.title} className="faq-section">
            <h1 className="faq-title">{section.title}</h1>

            <div className="faq-list">
              <QuestionAndAnswer faq={section.faq} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const QuestionAndAnswer = ({ faq }: any) => {
  const [open, setOpen] = useState(null);

  return (
    <div className="faq-parent">
      {faq.map((item: any, index: any) => {
        if (!item.q) return null;

        const answer = faq[index + 1]?.a;
        const isOpen = open === index;

        return (
          <div key={index} className="faq-container">
            <button
              onClick={() => setOpen(isOpen ? null : index)}
              className="faq-question-container"
              aria-expanded={isOpen}
            >
              <span className="question">{item.q}</span>

              <span className="icon" data-open={isOpen} aria-hidden="true" />
            </button>

            <div data-open={isOpen} className="faq-answer-container">
              <div data-open={isOpen} className="faq-answer">
                {answer?.map((text: any, index: any) => (
                  <p key={index} className="faq-a-text">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FAQUi;
