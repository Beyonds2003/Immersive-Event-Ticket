import { useAtomValue } from "jotai";
import React from "react";
import { pathnameAtom } from "../../libs/atoms";
import EventCardUi from "../HomePage/EventCardUi";

const PageHtmlUi = () => {
  const pathname = useAtomValue(pathnameAtom);

  return (
    <div className="page-ui-container">
      {pathname === "/" ? (
        <>
          <EventCardUi />
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default PageHtmlUi;
