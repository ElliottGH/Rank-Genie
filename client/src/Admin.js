import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

function Admin() {
  const [registrationDataFile, setRegistrationDataFile] = useState(null);
  const [paymentDataFile, setPaymentDataFile] = useState(null);
  const [trainMessage, setTrainMessage] = useState(""); // Training results (success/fail)
  const registrationFileInputRef = useRef(null);
  const paymentFileInputRef = useRef(null);

  const handleRegistrationFileSelect = (event) => {
    const file = event.target.files[0];
    setRegistrationDataFile(file);
    setTrainMessage("");
  };

  const handlePaymentFileSelect = (event) => {
    const file = event.target.files[0];
    setPaymentDataFile(file);
    setTrainMessage("");
  };

  const clearFile = (type) => {
    if (type === "registration") {
      setRegistrationDataFile(null);
      registrationFileInputRef.current.value = "";
    } else if (type === "payment") {
      setPaymentDataFile(null);
      paymentFileInputRef.current.value = "";
    }
    setTrainMessage("");
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event, type) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (type === "registration") {
      setRegistrationDataFile(file);
    } else if (type === "payment") {
      setPaymentDataFile(file);
    }
  };

  const handleTrain = async () => {
    const formData = new FormData();
    formData.append("regdata", registrationDataFile);
    formData.append("paydata", paymentDataFile);

    try {
      const response = await fetch("http://localhost:5000/train", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (response.ok) {
        setTrainMessage(result.message);
      } else {
        setTrainMessage(`${result.error}: ${result.details}`);
      }
    } catch (error) {
      setTrainMessage("Failed to communicate with the server.");
    }
  };

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>
      <p className="light-header">Train Model</p>
      <div className="file-inputs-container">
        <div className="file-input-container">
          <p className="light-header">Registration Data File</p>
          <input
            type="file"
            onChange={handleRegistrationFileSelect}
            style={{ display: "none" }}
            ref={registrationFileInputRef}
            accept=".csv"
          />
          <div
            className="double-file-input-container"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "registration")}
            onClick={() => registrationFileInputRef.current.click()}
          >
            <label className="basic-button">Browse File</label>
            <p className="drag-drop-prompt">or Drag & Drop here</p>
          </div>
          {registrationDataFile && (
            <div className="selected-file-info">
              {registrationDataFile.name}
              <span
                className="delete-icon-container"
                onClick={() => clearFile("registration")}
              >
                <img
                  src="images/delete.png"
                  alt="Delete"
                  className="delete-icon-image"
                />
              </span>
            </div>
          )}
        </div>
        <div className="file-input-container">
          <p className="light-header">Payment Data File</p>
          <input
            type="file"
            onChange={handlePaymentFileSelect}
            style={{ display: "none" }}
            ref={paymentFileInputRef}
            accept=".csv"
          />
          <div
            className="double-file-input-container"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "payment")}
            onClick={() => paymentFileInputRef.current.click()}
          >
            <label className="basic-button">Browse File</label>
            <p className="drag-drop-prompt">or Drag & Drop here</p>
          </div>
          {paymentDataFile && (
            <div className="selected-file-info">
              {paymentDataFile.name}
              <span
                className="delete-icon-container"
                onClick={() => clearFile("payment")}
              >
                <img
                  src="images/delete.png"
                  alt="Delete"
                  className="delete-icon-image"
                />
              </span>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleTrain}
        className="basic-button"
        type="button"
        disabled={!(registrationDataFile && paymentDataFile)}
      >
        Train
      </button>
      <p className="error-message">{trainMessage}</p>
    </div>
  );
}

export default Admin;
