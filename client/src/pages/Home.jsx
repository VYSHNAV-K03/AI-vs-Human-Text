import React, { useEffect } from "react";
import axios from "axios";
import backgroundImage from "../assets/img.jpg";

const Home = () => {
  return (
    <div
      className="d-flex justify-content-center align-items-center text-center"
      style={{
        backgroundImage: `url("/images/aitext.jpg")`,
        backgroundSize: "cover",
        height: "92%",
        color: "white",
      }}
    >
      <div>
        <h1 className="display-4 fw-bold">AI text Analyser</h1>
        <p className="">
          A web application that allows users to analyze text using AI.
        </p>
      </div>
    </div>
  );
};

export default Home;
