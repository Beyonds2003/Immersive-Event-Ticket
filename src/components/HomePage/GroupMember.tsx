import React, { useEffect } from "react";
import gsap from "gsap";

const GroupMember = () => {
  useEffect(() => {
    const handler = () => {
      gsap.to(".group-member-container", {
        y: 100,
        opacity: 0,
        duration: 0.65,
        ease: "power3.in",
      });
    };

    window.addEventListener("ripple-click", handler);
    return () => window.removeEventListener("ripple-click", handler);
  }, []);

  return (
    // <div className="group-member-container">
    //   <span className="group-member-title">Created by</span>
    //   <span className="group-member-name">Group 1</span>
    // </div>
    <div className="group-member-container">
      <span className="group-member-title">Created by</span>
      <div className="group-member-name">
        <span id="s1">Lae Wutt Yee Aung</span>
        <span id="s2">Phyo Khant Thu Kyaw</span>
        <span id="s3">Aung Swan Paing</span>
        <span id="s4">Nay Myo Aung</span>
        <span id="s5">Aung Moe Myint Thu</span>
        <span id="s6">Moe Myint Phyu Sin</span>
        <span id="s7">Nweh Khaing Htae</span>
        <span id="s8">Aung Thet Lwin</span>
        <span id="s9">Therapy Thant</span>
      </div>
    </div>
  );
};

export default GroupMember;
