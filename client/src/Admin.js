import React, { useState, useRef, useEffect } from "react";
import "./Admin.css";

function Admin() {
  const [registrationDataFile, setRegistrationDataFile] = useState(null);
  const [paymentDataFile, setPaymentDataFile] = useState(null);
  const [trainMessage, setTrainMessage] = useState(""); // Training results (success/fail)
  const [resetEnabled, setResetEnabled] = useState(true);
  const registrationFileInputRef = useRef(null);
  const paymentFileInputRef = useRef(null);

  // Check if the model files exist on load and setup reset button
  useEffect(() => {
    const checkModelExistence = async () => {
      try {
        const response = await fetch("http://localhost:5000/do_models_exist");
        const result = await response.json();
        if (response.ok) {
          setResetEnabled(result.model_exists);
        }
      } catch (error) {
        console.error("Couldn't check model file existence:", error);
      }
    };

    checkModelExistence();
  }, []);

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
        setResetEnabled(true);
      } else {
        setTrainMessage(`${result.error}: ${result.details}`);
      }
    } catch (error) {
      setTrainMessage("Failed to communicate with the server.");
    }
  };

  const handleReset = async () => {
    try {
      const response = await fetch("http://localhost:5000/reset_models", {
        method: "POST",
      });
      const result = await response.json();

      if (response.ok) {
        setTrainMessage(result.message);
        setResetEnabled(false);
      } else {
        setTrainMessage(result.error || "Failed to reset model files.");
      }
    } catch (error) {
      setTrainMessage("Failed to communicate with the server for model reset.");
    }
  };

  return (
    <div className="admin-container">
      <h1>Admin Panel</h1>
      <p className="light-header">
        Model Status: {resetEnabled ? "TRAINED" : "NOT TRAINED"}
      </p>
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
      <button
        onClick={handleReset}
        className="basic-button"
        type="button"
        disabled={!resetEnabled}
      >
        Reset
      </button>
      <p className="error-message">{trainMessage}</p>
    </div>
  );
}

export default Admin;
