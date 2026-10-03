import React from "react";
import ProfileIcon from "../Icons/Profile";
import { useAtomValue } from "jotai";
import { userAtom } from "../../libs/atoms";
import { signOut } from "../../utils/auth";

const Profile = () => {
  const userData = useAtomValue(userAtom);
  console.log(userData);

  const handleClick = (type: string) => {
    window.dispatchEvent(new CustomEvent(`${type}-click`));
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="profile-icon-container">
      <div className="profile-icon-btn">
        <ProfileIcon />

        <div className="profile-dropdown">
          {/* <button onClick={() => handleClick("profile")}>SEE PROFILE</button> */}
          {userData === null ? (
            <button onClick={() => handleClick("login")}>LOGIN</button>
          ) : (
            <button onClick={handleLogout}>LOGOUT</button>
          )}
          <button>CONTACT SUPPORT</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

