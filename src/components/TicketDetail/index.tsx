import React, { Suspense, useEffect, useState } from "react";
import GroupOfSphere from "../General/GroupOfSphere";

const TicketDetail = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShow(true);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Suspense fallback={null}>
      {show && (
        <group>
          <GroupOfSphere configKey="Detail" configOffset={0} />
          <GroupOfSphere configKey="Detail2" configOffset={9} />
        </group>
      )}
    </Suspense>
  );
};

export default TicketDetail;
