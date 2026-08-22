import React, { useEffect, useState } from "react";
import WobbleButton from "../UI/WobbleButton";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Canvas } from "@react-three/fiber";
import GroupOfSphere from "./GroupOfSphere";
import { OrbitControls } from "@react-three/drei";

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
  }, []);

  // Force canvas resize measurement when dialog opens and throughout entrance animation
  // useEffect(() => {
  //   if (!open) return;
  //   const triggerResize = () => {
  //     window.dispatchEvent(new Event("resize"));
  //   };

  //   triggerResize();
  //   const timers = [
  //     setTimeout(triggerResize, 50),
  //     setTimeout(triggerResize, 150),
  //     setTimeout(triggerResize, 350),
  //     setTimeout(triggerResize, 700),
  //   ];

  //   return () => {
  //     timers.forEach(clearTimeout);
  //   };
  // }, [open]);

  return (
    <>
      {open && (
        <div data-open={open} className="profile-overlay">
          <div
            className="profile-panel"
            onAnimationEnd={() => {
              window.dispatchEvent(new Event("resize"));
            }}
          >
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
                      {new Array(4).fill(0).map((_, i) => (
                        <TicketUi key={i} index={i} />
                      ))}
                    </div>
                  </div>
                </section>

                <section className="profile-section-4">
                  <div className="profile-canvas-container">
                    <Scene />
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

const Scene = () => {
  return (
    <Canvas
      style={{ width: "100%", height: "100%", display: "block" }}
      camera={{ position: [0, 0, 15], fov: 15 }}
      resize={{ scroll: true, debounce: { scroll: 50, resize: 0 } }}
    >
      <GroupOfSphere configKey="Profile" configOffset={5} />

      <ambientLight intensity={2.4} color="#504ed8" />
      <ambientLight intensity={2.8} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.8}
        castShadow
        shadow-normalBias={0.008}
      />
      <pointLight position={[0, -3, 3]} intensity={0.4} />
    </Canvas>
  );
};

type TicketStatus = "upcoming" | "checked" | "expired";

const tickets = [
  {
    title: "React Conf 2026",
    date: "20 Sep 2026",
    time: "5:00 PM",
    location: "Yangon Hmawbi",
    description:
      "A conference for React developers to learn, connect and build the future.",
    price: "$49",
    status: "upcoming" as TicketStatus,
  },
  {
    title: "Web Dev Summit",
    date: "25 Oct 2026",
    time: "2:30 PM",
    location: "Yangon Hmawbi",
    description:
      "Join industry leaders and developers to explore the latest in web technologies.",
    price: "$79",
    status: "checked" as TicketStatus,
  },
  {
    title: "UI/UX Design Day",
    date: "15 Nov 2026",
    time: "10:00 AM",
    location: "Yangon Hmawbi",
    description:
      "A day dedicated to UI/UX design, trends and hands-on workshops.",
    price: "$35",
    status: "expired" as TicketStatus,
  },
  {
    title: "Code & Coffee",
    date: "10 Dec 2026",
    time: "4:00 PM",
    location: "Yangon Hmawbi",
    description:
      "Casual meetup for developers to code, share ideas and enjoy coffee.",
    price: "Free",
    status: "upcoming" as TicketStatus,
  },
];

const statusConfig: Record<
  TicketStatus,
  { label: string; className: string; Icon: LucideIcon }
> = {
  upcoming: {
    label: "Upcoming",
    className: "ticket-status--upcoming",
    Icon: Clock,
  },
  checked: {
    label: "Checked In",
    className: "ticket-status--checked",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    className: "ticket-status--expired",
    Icon: XCircle,
  },
};

const TicketUi = ({ index }: { index: number }) => {
  const ticket = tickets[index % tickets.length];
  const { label, className, Icon } = statusConfig[ticket.status];
  return (
    <div
      className="profile-ticket-container"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="ticket-timeline-dot" aria-hidden />
      <div className="ticket-card">
        {/* Title row with status badge */}
        <div className="ticket-card-header">
          <h4>{ticket.title}</h4>
          <span className={`ticket-status-badge ${className}`}>
            <Icon size={11} />
            {label}
          </span>
        </div>

        <div className="profile-ticket-meta">
          <span className="ticket-meta-item">
            <CalendarDays size={14} />
            {ticket.date}
          </span>
          <span className="ticket-meta-sep" aria-hidden>
            •
          </span>
          <span className="ticket-meta-item">
            <Clock3 size={14} />
            {ticket.time}
          </span>
          <span className="ticket-meta-sep" aria-hidden>
            •
          </span>
          <span className="ticket-meta-item">
            <MapPin size={14} />
            {ticket.location}
          </span>
        </div>

        <p className="ticket-description">{ticket.description}</p>

        {/* Price tag */}
        <div className="ticket-price-row">
          <span className="ticket-price-tag">
            <Tag size={12} />
            {ticket.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileDialog;
