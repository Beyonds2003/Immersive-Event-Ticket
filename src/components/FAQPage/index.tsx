import React, { Suspense, useEffect, useState } from "react";
import GroupOfSphere from "../General/GroupOfSphere";

const index = () => {
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
          <GroupOfSphere configKey="Detail" configOffset={15} />
          <GroupOfSphere configKey="Detail2" configOffset={1} />
        </group>
      )}
    </Suspense>
  );
};

export default index;
