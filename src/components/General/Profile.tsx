import React from "react";
import ProfileIcon from "../Icons/Profile";

const Profile = () => {
  const handleClick = (type: string) => {
    window.dispatchEvent(new CustomEvent(`${type}-click`));
  };

  return (
    <div className="profile-icon-container">
      <div className="profile-icon-btn">
        <ProfileIcon />

        <div className="profile-dropdown">
          {/* <button onClick={() => handleClick("profile")}>SEE PROFILE</button> */}
          <button onClick={() => handleClick("login")}>LOGIN</button>
          {/* <button>LOGOUT</button> */}
          <button>CONTACT SUPPORT</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
