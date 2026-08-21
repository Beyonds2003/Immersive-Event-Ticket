import { useAtomValue } from "jotai";
import React from "react";
import { pathnameAtom } from "../../libs/atoms";
import EventCardUi from "../ExplorePage/EventCardUi";
import TicketDetailUi from "../TicketDetail/TicketDetailUi";
import NfcUi from "../NfcPage/NfcUi";
import FAQUi from "../FAQPage/FAQUi";
import LoginUi from "../HomePage/LoginUi";

const routeUiMap: Record<string, React.ReactNode> = {
  "/explore": <EventCardUi />,
  "/detail": <TicketDetailUi />,
  "/nfc": <NfcUi />,
  "/faq": <FAQUi />,
  "/": <LoginUi />,
};

const PageHtmlUi = () => {
  const pathname = useAtomValue(pathnameAtom);

  return (
    <div className="page-ui-containers">{routeUiMap[pathname] ?? null}</div>
  );
};

export default PageHtmlUi;
