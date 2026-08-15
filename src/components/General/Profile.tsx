import React from "react";
import ProfileIcon from "../Icons/Profile";

const Profile = () => {
  return (
    <div className="profile-icon-container">
      <div className="profile-icon-btn">
        <ProfileIcon />

        <div className="profile-dropdown">
          <button>SEE PROFILE</button>
          <button>LOGOUT</button>
          <button>CONTACT SUPPORT</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
