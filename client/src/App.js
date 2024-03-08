import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";

// import {UserData} from './Data' // Replace this with the connection to the database/dataset that will be represented by graphs

function App() {
  // STATE HOOKS
  const [fileSelected, setFileSelected] = useState(null); // Is there a file selected?
  const [selectedFile, setSelectedFile] = useState(null); // What is the selected file
  const [fileName, setFileName] = useState(""); // File properties v v v
  const [fileSize, setFileSize] = useState("---");
  const [fileType, setFileType] = useState("---");
  const [fileLastModified, setFileLastModified] = useState("---");
  const [fileExtension, setFileExtension] = useState("---");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulate authentication state
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'files'
  const [predictionResults, setPredictionResults] = useState([]);
  const [predictionError, setPredictionError] = useState("");
  // Search
  const [searchID, setSearchID] = useState("");
  const [showPrediction0, setShowPrediction0] = useState(true);
  const [showPrediction1, setShowPrediction1] = useState(true);
  const [filteredResults, setFilteredResults] = useState([]);

  // Search and filters
  useEffect(() => {
    const filtered = predictionResults.filter((result) => {
      const matchesID = searchID === "" || result.id.toString() === searchID;
      const matchesPrediction =
        (result.prediction === 0 && showPrediction0) ||
        (result.prediction === 1 && showPrediction1);

      return matchesID && matchesPrediction;
    });
    setFilteredResults(filtered);
  }, [searchID, showPrediction0, showPrediction1, predictionResults]);

  const fileInputRef = useRef(null);

  // Straight to model
  const handlePredict = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    console.log("Sending file to server:", selectedFile.name);

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const results = result.prediction.map((prediction, index) => ({
          id: index,
          prediction,
        }));
        setPredictionResults(results);
        setPredictionError(""); // Clear old errors
      } else {
        console.error("Prediction failed");
        const errorResult = await response.json();
        setPredictionResults([]);
        setPredictionError(
          `Error: ${errorResult.error || "Prediction failed"}`
        );
      }
    } catch (error) {
      console.error("Error during prediction", error);
      setPredictionError(`Error: ${error.message || "Failed to fetch"}`);
    }
  };

  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
  };

  const handleBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]; // You never know if we'll get a file upload in ZB
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Adding a file and its properties to the page
  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFileSelected(true);
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(handleBytes(file.size));
      setFileType(file.type || "---");
      setFileLastModified(
        file.lastModifiedDate
          ? new Date(file.lastModifiedDate).toLocaleDateString("en-US")
          : "---"
      );
      setFileExtension("." + file.name.split(".").pop() || "---");
    } else {
      setFileSelected(false);
      setSelectedFile(null);
      setFileName("");
      setFileSize("---");
      setFileType("---");
      setFileLastModified("---");
      setFileExtension("---");
    }
    setPredictionError("");
    setPredictionResults([]);
    setFilteredResults([]);
    setSearchID("");
    setShowPrediction0(true);
    setShowPrediction1(true);
  };

  // Clearing a file from the page
  const handleFileClear = () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to clear the uploaded file?"
    );
    if (isConfirmed) {
      setFileSelected(false);
      setSelectedFile(null);
      setFileName("");
      setFileSize("---");
      setFileType("---");
      setFileLastModified("---");
      setFileExtension("---");
      setPredictionError("");
      setPredictionResults([]);
      setFilteredResults([]);
      setSearchID("");
      setShowPrediction0(true);
      setShowPrediction1(true);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      setFileSelected(true);
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(handleBytes(file.size));
      setFileType(file.type || "---");
      setFileLastModified(
        file.lastModified
          ? new Date(file.lastModified).toLocaleDateString("en-US")
          : "---"
      );
      setFileExtension("." + file.name.split(".").pop() || "---");
    }
  };

  return (
    <Router>
      <div>
        <header>
          <div className="logo-container">
            <img
              src="images/logo_cropped.png"
              alt="RankGenie Logo"
              className="header-logo"
            />
          </div>
          <nav className="header-nav">
            <Link to="/">Home</Link>
            {!isLoggedIn ? (
              <>
                {" • "}
                <Link to="/login">Log In</Link>
              </>
            ) : (
              <>
                {" • "}
                <a href="#logout" onClick={() => setIsLoggedIn(false)}>
                  Logout
                </a>
                {" • "}
                <Link to="/admin" className="username-link">
                  Admin
                </Link>
                <div className="avatar-container">
                  <img
                    src="images/avatar.png"
                    alt="Avatar"
                    className="avatar-image"
                  />
                </div>
              </>
            )}
          </nav>
        </header>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/login"
            element={
              <Login onLogin={(isLoggedIn) => setIsLoggedIn(isLoggedIn)} />
            }
          />
          <Route
            path="/"
            element={
              <div className="main-content">
                <aside className="left-panel">
                  <div className="left-panel-container">
                    <div className="tab-buttons">
                      <button
                        onClick={() => handleTabSwitch("upload")}
                        className={activeTab === "upload" ? "active" : ""}
                      >
                        Upload File
                      </button>
                      <button
                        onClick={() => handleTabSwitch("files")}
                        className={activeTab === "files" ? "active" : ""}
                        disabled={!isLoggedIn}
                      >
                        Saved CSVs
                      </button>
                    </div>
                    {activeTab === "upload" && (
                      <div className="upload-content">
                        <div>
                          <p className="light-header">File Upload</p>
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                            id="file-input"
                            accept=".csv"
                            ref={fileInputRef}
                          />
                          <div
                            className="file-input-container"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                          >
                            <br />
                            <label
                              htmlFor="file-input"
                              className="basic-button"
                            >
                              Browse File
                            </label>
                            <p className="drag-drop-prompt">
                              or Drag & Drop here
                            </p>
                          </div>
                        </div>
                        {fileSelected && (
                          <>
                            <p className="light-header">Properties</p>
                            <table className="file-details-table">
                              <tbody>
                                <tr>
                                  <th>Name</th>
                                  <td>{fileName}</td>
                                </tr>
                                <tr>
                                  <th>Size</th>
                                  <td>{fileSize ? `${fileSize}` : "---"}</td>
                                </tr>
                                <tr>
                                  <th>Type</th>
                                  <td>{fileType}</td>
                                </tr>
                                <tr>
                                  <th>Last Modified</th>
                                  <td>{fileLastModified}</td>
                                </tr>
                                <tr>
                                  <th>Extension</th>
                                  <td>{fileExtension}</td>
                                </tr>
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    )}
                    {activeTab === "files" && (
                      <div className="files-content">
                        <p className="light-header">Uploaded CSVs</p>
                      </div>
                    )}
                  </div>
                </aside>
                <aside className="right-panel">
                  <div className="right-panel-container">
                    {fileSelected && (
                      <>
                        <p className="bold-header">
                          Selected File: {fileName}
                          <span
                            className="delete-icon-container"
                            onClick={handleFileClear}
                          >
                            <img
                              src="images/delete.png"
                              alt="Delete"
                              className="delete-icon-image"
                            />
                          </span>
                        </p>
                        <div className="file-header">
                          <button
                            onClick={handlePredict}
                            className="basic-button"
                            type="button"
                          >
                            Predict
                          </button>
                          <input
                            type="text"
                            placeholder="Filter by ID..."
                            value={searchID}
                            onChange={(e) => setSearchID(e.target.value)}
                            style={{ marginLeft: "20px" }}
                          />
                          <label className="extralight-header">
                            Only show predictions of&nbsp;
                          </label>
                          <label>
                            0
                            <input
                              type="checkbox"
                              checked={showPrediction0}
                              onChange={() =>
                                setShowPrediction0(!showPrediction0)
                              }
                            />
                          </label>
                          <label>
                            1
                            <input
                              type="checkbox"
                              checked={showPrediction1}
                              onChange={() =>
                                setShowPrediction1(!showPrediction1)
                              }
                            />
                          </label>
                        </div>

                        {predictionResults.length > 0 && (
                          <div className="results-container">
                            <div className="prediction-results">
                              <p className="light-header">Prediction Results</p>
                              {predictionError && (
                                <p className="error-message">
                                  {predictionError}
                                </p>
                              )}
                              {filteredResults.length > 0 ? (
                                <table className="file-details-table">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Prediction</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredResults.map((result) => (
                                      <tr key={result.id}>
                                        <td>{result.id}</td>
                                        <td>{result.prediction}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : predictionResults.length > 0 ? (
                                <p className="extralight-header">
                                  No results found
                                </p>
                              ) : null}
                            </div>

                            <div className="chart-results">
                              {predictionResults.length > 0 && (
                                <>
                                  <p className="light-header">Chart.js</p>
                                  {/* Insert Chart.js visualization here */}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </aside>
              </div>
            }
          />
        </Routes>

        <footer>
          <h3>Contact Us</h3>
          <div className="button-container">
            {/* <!-- contact buttons - could show our emails or something --> */}
            <button className="contact-button">EC</button>
            <button className="contact-button">LS</button>
            <button className="contact-button">RK</button>
            <button className="contact-button">LW</button>
            <button className="contact-button">SM</button>
            <button className="contact-button">AT</button>
          </div>
          <hr />
          <p>&copy; 2023-2024 RankGenie. All rights reserved.</p>
        </footer>

        <script src="js/script.js"></script>
      </div>
    </Router>
  );
}

export default App;
