import React, { useEffect, useState } from "react";
import WobbleButton from "../UI/WobbleButton";
import OtpCountdown from "./OtpCountdown";
import { sendOtpSupabase, verifyOtp } from "../../utils/auth";

const LoginDialog = () => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [email, setEmail] = useState("");
  const [otpcode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({ email: false, otp: false });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleOtpSend = async () => {
    setOtpSent(true);

    try {
      const { error, success } = await sendOtpSupabase(email);

      console.log("OTP send result:", { error, success });

      if (error.length > 0 && !success) {
        setErrors((prev) => ({ ...prev, email: true }));
        setErrorMessage(error);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setErrorMessage("An error occurred while sending the OTP.");
    }
  };

  const handleSubmit = async () => {
    const { success, error } = await verifyOtp(email.trim(), otpcode.trim());

    if (success) {
      setTimeout(() => handleClose(), 1000);
    } else {
      console.error("Verification failed:", error);
      // Reset momentarily and apply to re-trigger shake animation if already in error state
      setErrors({ email: email.length < 1, otp: otpcode.length < 1 });
      setErrorMessage(error);
      // setTimeout(() => setErrors({ email: true, otp: true }), 10);
    }
  };

  const handleClose = () => {
    setClosing(true);
    setErrors({ email: false, otp: false });
    setErrorMessage("");
  };

  const handleExitEnd = (e: React.AnimationEvent) => {
    if (e.animationName === "login-panel-exit") {
      setClosing(false);
      setOpen(false);
      setOtpSent(false);
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
                      initialSeconds={60}
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
                      disabled={email.trim() === "" || errors.email}
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
                  bulgeAmount={4}
                  stiffness={0.04}
                  damping={0.96}
                  proximityThreshold={70}
                  clickShockWave={1}
                  onClick={handleSubmit}
                />
              </div>

              {errorMessage.length > 0 && (
                <span className="login-error">{errorMessage}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginDialog;
