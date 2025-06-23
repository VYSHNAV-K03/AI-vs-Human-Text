import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Analytics from "../components/Analytics";
import axiosInstance from "../axiosInstance";

const AdminPanel = () => {
  const [organisers, setOrganisers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchOrganisers = async () => {
      try {
        const response = await axiosInstance.get("/admin/organisers");
        setOrganisers(response.data.reverse());
      } catch (err) {
        setError("Failed to fetch users");
      }
    };
    fetchOrganisers();
  }, []);

  const handleToggleVerification = async (id, isVerified) => {
    try {
      await axiosInstance.patch(`/admin/organisers/${id}/verify`);
      setSuccess(`User ${isVerified ? "unverified" : "verified"} successfully`);

      setOrganisers(
        organisers.map((org) =>
          org._id === id ? { ...org, isVerified: !org.isVerified } : org
        )
      );
    } catch (err) {
      setError(`Failed to ${isVerified ? "unverify" : "verify"} users`);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Admin Panel</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Business Analytics Section */}
      <Analytics organisers={organisers} />

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {organisers.map((org) => (
            <tr key={org._id}>
              <td>{org.username}</td>
              <td>{org.email}</td>
              <td>{org.isVerified ? "Verified" : "Unverified"}</td>
              <td>
                <button
                  className={`btn ${
                    org.isVerified ? "btn-danger" : "btn-success"
                  }`}
                  onClick={() =>
                    handleToggleVerification(org._id, org.isVerified)
                  }
                >
                  {org.isVerified ? "Unverify" : "Verify"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
