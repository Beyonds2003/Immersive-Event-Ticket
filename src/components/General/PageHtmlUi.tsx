import { useAtomValue } from "jotai";
import React from "react";
import { pathnameAtom } from "../../libs/atoms";
import EventCardUi from "../HomePage/EventCardUi";
import TicketDetailUi from "../TicketDetail/TicketDetailUi";

const routeUiMap: Record<string, React.ReactNode> = {
  "/": <EventCardUi />,
  "/detail": <TicketDetailUi />,
};

const PageHtmlUi = () => {
  const pathname = useAtomValue(pathnameAtom);

  return (
    <div className="page-ui-container">
      {routeUiMap[pathname] ?? null}
    </div>
  );
};

export default PageHtmlUi;
