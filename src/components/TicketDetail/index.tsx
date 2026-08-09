import React, { useEffect, useRef, useState } from "react";
import GroupOfSphere from "../General/GroupOfSphere";
import * as THREE from "three";

const index = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const time = window.setTimeout(() => {
      setShow(true);
    }, 1000);

    return () => {
      window.clearTimeout(time);
    };
  }, []);

  return (
    <>
      {show && (
        <group>
          <GroupOfSphere configKey="Detail" configOffset={0} />
          <GroupOfSphere configKey="Detail2" configOffset={3} />
        </group>
      )}
    </>
  );
};

export default index;
