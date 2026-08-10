import React, { useEffect } from "react";
import { useNavigate } from "react-router";

const PageNavigator = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSubmit = (e: Event) => {
      const { nextPathname } = (e as CustomEvent).detail;
      navigate(nextPathname);
    };

    window.addEventListener("page-transition-end", handleSubmit);

    return () => {
      window.removeEventListener("page-transition-end", handleSubmit);
    };
  }, []);

  return <></>;
};

export default PageNavigator;
