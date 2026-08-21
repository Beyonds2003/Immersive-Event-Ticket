import React, { useEffect, useState } from "react";
import WobbleButton from "../UI/WobbleButton";
import OtpCountdown from "./OtpCountdown";

const LoginDialog = () => {
  const [open, setOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleOtpSend = () => {
    setOtpSent(true);
  };

  useEffect(() => {
    const handleClick = () => {
      setOpen(true);
    };

    window.addEventListener("login-click", handleClick);

    return () => {
      window.removeEventListener("login-click", handleClick);
    };
  }, []);

  return (
    <>
      {open && (
        <div data-open={open} className="profile-overlay">
          <div className="login-panel">
            {/* <div className="profile-bg" /> */}
            <button
              onClick={() => setOpen(false)}
              className="profile-close"
              aria-label="Close"
            >
              <span>×</span>
            </button>
            <h2 className="login-title">LOG IN</h2>
            <div className="login-section">
              <input placeholder="Your Email" className="login-email-input" />

              <div className="otp-code-container">
                <input placeholder="Otp Code" className="login-otp-input" />

                <div className="otp-code-send-btn">
                  {otpSent ? (
                    <OtpCountdown
                      initialSeconds={10}
                      onComplete={() => setOtpSent(false)}
                    />
                  ) : (
                    <WobbleButton
                      text="Send"
                      fillColor="#F1E8DD"
                      textColor="black"
                      width={70}
                      height={30}
                      fontSize={0.8}
                      bulgeAmount={1}
                      stiffness={0.04}
                      damping={0.94}
                      proximityThreshold={70}
                      clickShockWave={1}
                      onClick={handleOtpSend}
                    />
                  )}
                </div>
              </div>

              <div className="login-btn">
                <WobbleButton
                  text="Submit"
                  fillColor="#FFDB78"
                  textColor="black"
                  fontFamily="Dingos"
                  width={160}
                  height={50}
                  fontSize={1}
                  bulgeAmount={6}
                  stiffness={0.04}
                  damping={0.96}
                  proximityThreshold={70}
                />
              </div>

              {/* <span className="login-error">Invalid Email.</span> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginDialog;
