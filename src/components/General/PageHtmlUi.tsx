import { useAtomValue } from "jotai";
import React from "react";
import { pathnameAtom } from "../../libs/atoms";
import EventCardUi from "../HomePage/EventCardUi";
import TicketDetailUi from "../TicketDetail/TicketDetailUi";
import NfcUi from "../NfcPage/NfcUi";
import FAQUi from "../FAQPage/FAQUi";
import LoginUi from "../LoginPage/LoginUi";

const routeUiMap: Record<string, React.ReactNode> = {
  "/": <EventCardUi />,
  "/detail": <TicketDetailUi />,
  "/nfc": <NfcUi />,
  "/faq": <FAQUi />,
  "/login": <LoginUi />,
};

const PageHtmlUi = () => {
  const pathname = useAtomValue(pathnameAtom);

  return (
    <div className="page-ui-containers">{routeUiMap[pathname] ?? null}</div>
  );
};

export default PageHtmlUi;
