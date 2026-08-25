import React, { useEffect, useState } from "react";
import Input from "./Input";
import GroupOfSphere from "../General/GroupOfSphere";
import { isLoadingDoneAtom } from "../../libs/atoms";
import { useAtomValue } from "jotai";

const index = () => {
  const isLoadingDone = useAtomValue(isLoadingDoneAtom);
  const [show, setShow] = useState(isLoadingDone);

  useEffect(() => {
    if (isLoadingDone && !show) {
      const timer = window.setTimeout(() => {
        setShow(true);
      }, 1000);
      return () => window.clearTimeout(timer);
    }
  }, [isLoadingDone, show]);

  return (
    <>
      {show && (
        <>
          <Input />
          <GroupOfSphere />
        </>
      )}
    </>
  );
};

export default index;
