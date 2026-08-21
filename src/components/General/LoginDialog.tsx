import React, { useEffect, useState } from "react";
import WobbleButton from "../UI/WobbleButton";
import OtpCountdown from "./OtpCountdown";

const test = {
  email: "addy@gmail.com",
  otp: "123456",
};

const LoginDialog = () => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [email, setEmail] = useState("");
  const [otpcode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({ email: false, otp: false });

  const handleOtpSend = () => {
    setOtpSent(true);
  };

  const handleSubmit = () => {
    const emailErr = email.trim().toLowerCase() !== test.email.toLowerCase();
    const otpErr = otpcode.trim() !== test.otp;

    if (!emailErr && !otpErr) {
      setTimeout(() => handleClose(), 1000);
    } else {
      // Reset momentarily and apply to re-trigger shake animation if already in error state
      setErrors({ email: false, otp: false });
      setTimeout(() => setErrors({ email: emailErr, otp: otpErr }), 10);
    }
  };

  const handleClose = () => {
    setClosing(true);
    setErrors({ email: false, otp: false });
  };

  const handleExitEnd = (e: React.AnimationEvent) => {
    if (e.animationName === "login-panel-exit") {
      setClosing(false);
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setOpen(true);
      setClosing(false);
      setEmail("");
      setOtpCode("");
    };

    window.addEventListener("login-click", handleClick);

    return () => {
      window.removeEventListener("login-click", handleClick);
    };
  }, []);

  const visible = open || closing;

  return (
    <>
      {visible && (
        <div className={`profile-overlay ${closing ? "closing" : ""}`}>
          <div
            className={`login-panel ${closing ? "closing" : ""}`}
            onAnimationEnd={handleExitEnd}
          >
            {/* <div className="profile-bg" /> */}
            <button
              onClick={handleClose}
              className="profile-close"
              aria-label="Close"
            >
              <span>×</span>
            </button>
            <h2 className="login-title">LOG IN</h2>
            <div className="login-section">
              <input
                placeholder="Your Email"
                className={`login-email-input ${errors.email ? "error" : ""}`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: false }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />

              <div className="otp-code-container">
                <input
                  placeholder="Otp Code"
                  className={`login-otp-input ${errors.otp ? "error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpcode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setOtpCode(value);
                    if (errors.otp)
                      setErrors((prev) => ({ ...prev, otp: false }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                />

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
                  onClick={handleSubmit}
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
