import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { BsFillTelephoneFill } from "react-icons/bs";
import { MdEmail } from "react-icons/md";

const Profile = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  const getInitials = (username) => {
    const names = username.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4 w-75 w-md-50 w-lg-25 text-center">
        <div className="mb-4">
          {user?.username ? (
            <div
              className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
              style={{ width: "100px", height: "100px", fontSize: "2rem" }}
            >
              {getInitials(user.username)}
            </div>
          ) : (
            <FaUserCircle size={96} className="text-secondary" />
          )}
        </div>
        <h2 className="card-title mb-2">{user?.username || "User"}</h2>
        <p className="text-muted mb-4">{user?.role?.toUpperCase()}</p>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center gap-2 text-muted">
            <MdEmail size={20} />
            <span>{user?.email || "No Email"}</span>
          </div>
          <div className="d-flex align-items-center gap-2 text-muted">
            <BsFillTelephoneFill size={18} />
            <span>{user?.phone || "No Phone"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
