import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useAtom } from "jotai";
import { profileAtom } from "../../libs/atoms";
import WobbleButton from "../UI/WobbleButton";
import { Lock, Check, Copy, CheckCircle2 } from "lucide-react";
import { gsap } from "gsap";
import "./BuyTicketSummaryDialog.css";

type MobileWallet = "kbz" | "wave";

interface BuyTicketSummaryDialogProps {
  initialOpen?: boolean;
  onClose?: () => void;
}

const BuyTicketSummaryDialog: React.FC<BuyTicketSummaryDialogProps> = ({
  initialOpen = false,
  onClose,
}) => {
  const [open, setOpen] = useState(initialOpen);
  const [closing, setClosing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<MobileWallet>("kbz");
  const [txnId, setTxnId] = useState("TXN-890074");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Profile data from Jotai (if authenticated)
  const [profile, setProfile] = useAtom(profileAtom);

  // Form fields
  const [isCompany, setIsCompany] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Success state after completing payment
  const [isSuccess, setIsSuccess] = useState(false);

  // DOM refs for animation
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sourceElRef = useRef<HTMLElement | null>(null);

  // Listen to open events from buttons ("Buy Ticket", "Buy Nfc", etc.)
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ sourceEl?: HTMLElement }>;
      sourceElRef.current = customEvent.detail?.sourceEl || null;
      setOpen(true);
      setClosing(false);
      setIsSuccess(false);
    };

    window.addEventListener("buy-ticket-click", handleOpen);
    window.addEventListener("buy-nfc-click", handleOpen);
    window.addEventListener("open-buy-ticket", handleOpen);

    return () => {
      window.removeEventListener("buy-ticket-click", handleOpen);
      window.removeEventListener("buy-nfc-click", handleOpen);
      window.removeEventListener("open-buy-ticket", handleOpen);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !closing) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closing]);

  // Animate panel entering: scale from button position to center
  useLayoutEffect(() => {
    if (!open || closing) return;

    const panel = panelRef.current;
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const sourceEl = sourceElRef.current;

    if (!panel || !overlay) return;

    // Fade in backdrop overlay (no scale)
    gsap.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.45, ease: "power2.out" },
    );

    if (sourceEl) {
      // Clear previous transform state before measuring
      gsap.set(panel, { clearProps: "transform,scale,x,y,opacity" });

      // Measure positions
      const sourceRect = sourceEl.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      // Scale ratio: how small the panel needs to be to match the button
      const scaleX = sourceRect.width / panelRect.width;
      const scaleY = sourceRect.height / panelRect.height;

      // Translation to move panel center onto button center
      const panelCenterX = panelRect.left + panelRect.width / 2;
      const panelCenterY = panelRect.top + panelRect.height / 2;
      const sourceCenterX = sourceRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top + sourceRect.height / 2;
      const deltaX = sourceCenterX - panelCenterX;
      const deltaY = sourceCenterY - panelCenterY;

      // Stagger children inside content with bouncy entrance
      if (content) {
        const children = content.querySelectorAll(
          ":scope > *:not(.profile-close)",
        );
        gsap.set(content, { opacity: 1 });
        gsap.fromTo(
          children,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: 0.3,
            stagger: 0.06,
            ease: "back.out(1.7)",
          },
        );
      }

      // Animate panel from button rect to its natural centered state
      gsap.fromTo(
        panel,
        { scaleX, scaleY, x: deltaX, y: deltaY },
        {
          scaleX: 1,
          scaleY: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "elastic.out(1, 1)",
          clearProps: "transform",
        },
      );
    } else {
      // Fallback animation if no source button
      gsap.fromTo(
        panel,
        { scale: 0.85, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" },
      );
      if (content) {
        const children = content.querySelectorAll(
          ":scope > *:not(.profile-close)",
        );
        gsap.set(content, { opacity: 1 });
        gsap.fromTo(
          children,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: 0.25,
            stagger: 0.06,
            ease: "back.out(1.7)",
          },
        );
      }
    }
  }, [open]);

  // Animate panel exit: shrink back to button position
  const handleClose = () => {
    if (closing) return;
    setClosing(true);

    const panel = panelRef.current;
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const sourceEl = sourceElRef.current;

    // Fade out backdrop overlay
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
      });
    }

    // Fade out content first so text doesn't distort while shrinking
    if (content) {
      gsap.to(content, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      });
    }

    if (panel && sourceEl) {
      // Measure positions for exit
      gsap.set(panel, { clearProps: "transform" });
      const sourceRect = sourceEl.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      const scaleX = sourceRect.width / panelRect.width;
      const scaleY = sourceRect.height / panelRect.height;

      const panelCenterX = panelRect.left + panelRect.width / 2;
      const panelCenterY = panelRect.top + panelRect.height / 2;
      const sourceCenterX = sourceRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top + sourceRect.height / 2;
      const deltaX = sourceCenterX - panelCenterX;
      const deltaY = sourceCenterY - panelCenterY;

      // Animate panel collapsing back to the button
      gsap.to(panel, {
        scaleX,
        scaleY,
        x: deltaX,
        y: deltaY,
        duration: 0.42,
        ease: "power3.in",
        onComplete: () => {
          gsap.set(panel, { clearProps: "transform,scale,x,y" });
          setClosing(false);
          setOpen(false);
          if (onClose) onClose();
        },
      });
    } else if (panel) {
      gsap.to(panel, {
        scale: 0.85,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setClosing(false);
          setOpen(false);
          if (onClose) onClose();
        },
      });
    } else {
      setClosing(false);
      setOpen(false);
      if (onClose) onClose();
    }
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText("09-250123456");
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      setCouponApplied(true);
    }
  };

  const handleCompletePayment = () => {
    setIsSuccess(true);
    if (profile) {
      setProfile({
        ...profile,
        purchased_nfc: true,
      });
    }
  };

  const isVisible = open || closing;
  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      className="buy-ticket-summary-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div ref={panelRef} className="buy-ticket-summary-panel">
        <div ref={contentRef} className="buy-ticket-panel-inner">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="profile-close"
            aria-label="Close dialog"
          >
            <span>×</span>
          </button>

          {isSuccess ? (
            /* Payment Success View */
            <div className="buy-ticket-success-view">
              <div className="buy-ticket-success-icon-wrap">
                <CheckCircle2 size={44} />
              </div>
              <h2 className="buy-ticket-success-title">PAYMENT COMPLETED!</h2>
              <p className="buy-ticket-success-desc">
                Your Universal NFC ID Tag pass has been registered successfully.
              </p>
              <div className="buy-ticket-success-badge">TXN: {txnId}</div>
              <div style={{ marginTop: "12px" }}>
                <WobbleButton
                  text="Done"
                  hoverText="Close"
                  fillColor="#fed26a"
                  textColor="#1b1633"
                  width={160}
                  height={48}
                  fontSize={1.05}
                  fontFamily="Dingos-Bold"
                  clickShockWave={1}
                  onClick={handleClose}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="buy-ticket-header">
                <h2 className="buy-ticket-title">ORDER SUMMARY</h2>
                <p className="buy-ticket-subtitle">
                  Physical Campus Wristband / Card
                </p>
              </div>

              {/* Ticket Info Card */}
              <div className="buy-ticket-card">
                <div className="buy-ticket-item-row">
                  <div className="buy-ticket-item-left">
                    <span className="buy-ticket-qty-badge">1</span>
                    <span className="buy-ticket-item-title">Event Title</span>
                    {/* <span className="buy-ticket-pass-pill">PHYSICAL PASS</span> */}
                  </div>
                  <span className="buy-ticket-item-price">3,000 MMK</span>
                </div>

                <div className="buy-ticket-card-divider" />

                {/* Coupon Row */}
                <div className="buy-ticket-coupon-row">
                  <div className="buy-ticket-coupon-input-wrap">
                    <input
                      type="text"
                      placeholder="COUPON CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="buy-ticket-coupon-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="buy-ticket-coupon-btn"
                  >
                    {couponApplied ? "APPLIED" : "APPLY"}
                  </button>
                </div>
              </div>

              {/* Mobile Wallet Selector */}
              <div className="buy-ticket-section-title">
                Select Mobile Wallet
              </div>
              <div className="buy-ticket-wallets-grid">
                {/* KBZPay Card */}
                <div
                  className={`buy-ticket-wallet-card ${
                    selectedWallet === "kbz" ? "active-kbz" : ""
                  }`}
                  onClick={() => setSelectedWallet("kbz")}
                >
                  <div className="buy-ticket-wallet-top">
                    <span className="buy-ticket-wallet-name kbz">KBZPay</span>
                    {selectedWallet === "kbz" && (
                      <div className="buy-ticket-wallet-check kbz">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="buy-ticket-wallet-sub">KPay Wallet</span>
                </div>

                {/* WavePay Card */}
                <div
                  className={`buy-ticket-wallet-card ${
                    selectedWallet === "wave" ? "active-wave" : ""
                  }`}
                  onClick={() => setSelectedWallet("wave")}
                >
                  <div className="buy-ticket-wallet-top">
                    <span className="buy-ticket-wallet-name wave">WavePay</span>
                    {selectedWallet === "wave" && (
                      <div className="buy-ticket-wallet-check wave">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="buy-ticket-wallet-sub">Wave Money</span>
                </div>
              </div>

              {/* Payment Details Box */}
              <div className="buy-ticket-payment-details">
                <div className="buy-ticket-detail-row">
                  <span className="buy-ticket-detail-label">Account Name:</span>
                  <span className="buy-ticket-detail-val">
                    {selectedWallet === "kbz"
                      ? "U Kyaw Swar (CETDIS KPay)"
                      : "U Kyaw Swar (CETDIS WavePay)"}
                  </span>
                </div>

                <div className="buy-ticket-detail-row">
                  <span className="buy-ticket-detail-label">
                    Merchant Phone:
                  </span>
                  <div className="buy-ticket-phone-wrap">
                    <span className="buy-ticket-phone-num">09-250123456</span>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="buy-ticket-copy-btn"
                    >
                      <Copy size={11} />
                      {copiedPhone ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="buy-ticket-card-divider" />

                <div className="buy-ticket-txn-wrap">
                  <label className="buy-ticket-txn-label">
                    Demo Transaction ID (Pre-Filled):
                  </label>
                  <input
                    type="text"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="buy-ticket-txn-input"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="buy-ticket-checkboxes">
                <div
                  className={`buy-ticket-checkbox-item ${
                    isCompany ? "checked" : ""
                  }`}
                  onClick={() => setIsCompany(!isCompany)}
                >
                  <div className="buy-ticket-custom-checkbox">
                    {isCompany && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span>Buying for a company?</span>
                </div>

                <div
                  className={`buy-ticket-checkbox-item ${
                    acceptTerms ? "checked" : ""
                  }`}
                  onClick={() => setAcceptTerms(!acceptTerms)}
                >
                  <div className="buy-ticket-custom-checkbox">
                    {acceptTerms && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span>
                    I accept the{" "}
                    <span
                      className="buy-ticket-terms-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms & Conditions
                    </span>
                  </span>
                </div>
              </div>

              {/* Demonstration Environment Notice */}
              <p className="buy-ticket-demo-note">
                This is a demonstration environment. No actual funds are
                charged.
              </p>

              {/* Action Buttons using WobbleButton */}
              <div className="buy-ticket-actions">
                <button
                  type="button"
                  onClick={handleClose}
                  className="buy-ticket-cancel-btn"
                >
                  Cancel
                </button>
                <WobbleButton
                  text="Complete Payment"
                  hoverText="Pay 3,000 MMK"
                  fillColor="#fed26a"
                  hoverColor="#ffe08a"
                  textColor="#181335"
                  fontFamily="Dingos-Bold"
                  width={220}
                  height={52}
                  fontSize={1}
                  bulgeAmount={5}
                  stiffness={0.04}
                  damping={0.96}
                  proximityThreshold={60}
                  onClick={handleCompletePayment}
                />
              </div>

              {/* Security Guarantee Note */}
              <div className="buy-ticket-security">
                <Lock size={12} />
                <span>
                  Secure payment via{" "}
                  {selectedWallet === "kbz" ? "KBZPay" : "WavePay"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyTicketSummaryDialog;
