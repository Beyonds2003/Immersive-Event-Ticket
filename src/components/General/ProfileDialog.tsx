import React, { useEffect, useState } from "react";
import WobbleButton from "../UI/WobbleButton";
import { LocateFixedIcon, LocationEditIcon } from "lucide-react";

const ProfileDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      setOpen(true);
    };

    window.addEventListener("profile-click", handleClick);

    return () => {
      window.removeEventListener("profile-click", handleClick);
    };
  });

  return (
    <>
      {open && (
        <div data-open={open} className="profile-overlay">
          <div className="profile-panel">
            <div className="profile-bg" />
            <button
              onClick={() => setOpen(false)}
              className="profile-close"
              aria-label="Close"
            >
              <span>×</span>
            </button>

            <div className="panel-content">
              <section className="profile-section-1">
                <header className="panel-header">
                  <h1 className="">PROFILE</h1>
                  <p>Thanks for being part of our community</p>
                </header>
              </section>

              <div className="panel-info">
                <section className="profile-section-2">
                  <div className="panel-info-title">
                    <h3 className="panel-title">YOUR INFO</h3>
                    <div>
                      <WobbleButton
                        text="EDIT"
                        fillColor="#f1e8dd"
                        textColor="black"
                        fontFamily="Inter"
                        width={110}
                        height={40}
                        fontSize={1}
                        bulgeAmount={2}
                        stiffness={0.04}
                        damping={0.96}
                        proximityThreshold={70}
                      />
                    </div>
                  </div>

                  <table className="panel-info-table">
                    <tbody>
                      <tr>
                        <td>Surname</td>
                        <td>Addy</td>
                      </tr>

                      <tr>
                        <td>Email</td>
                        <td>jane@example.com</td>
                      </tr>

                      <tr>
                        <td>Social</td>
                        <td>@example</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section className="profile-section-3">
                  <div className="panel-ticket-container">
                    <h3 className="panel-title">YOUR TICKETS</h3>
                    <div className="panel-ticket-list">
                      {new Array(4).fill(0).map((item) => (
                        <TicketUi key={item} />
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const TicketUi = () => {
  return (
    <div className="profile-ticket-container">
      <h4>Ticket Title</h4>
      <div className="profile-ticket-date">
        <p>20 SEP 2026</p>
        <span className="text-[4px]" aria-hidden>
          ⚪️
        </span>
        <p>5:00 PM</p>
      </div>
      <div className="profile-ticket-location">
        <LocationEditIcon size={20} />
        <p>Yangon Hmawbi</p>
      </div>

      <div className="ticket-divider"></div>

      <div className="profile-ticket-qr-container">
        <div className="profile-qr-info">
          <h6>TICKET ID</h6>
          <h3>#0002</h3>
        </div>
        <div className="profile-ticket-qr-img-container">
          <img src="/images/qr-code.png" alt="qr-code" />
        </div>
      </div>
    </div>
  );
};

export default ProfileDialog;
