import "./App.css";
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./Login";

// import {UserData} from './Data' // Replace this with the connection to the database/dataset that will be represented by graphs

function App() {
  const [data, setData] = useState("");
  const [fileSelected, setFileSelected] = useState(null); // Is there a file selected?
  const [selectedFile, setSelectedFile] = useState(null); // What is the selected file
  const [fileName, setFileName] = useState(""); // File properties
  const [fileSize, setFileSize] = useState("---");
  const [fileType, setFileType] = useState("---");
  const [fileLastModified, setFileLastModified] = useState("---");
  const [fileExtension, setFileExtension] = useState("---");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulate authentication state
  const [userName, setUserName] = useState("User"); // Simulate logged-in user name
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'files'

  // Straight to model
  const handlePredict = async () => {};

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
                <Link to="/" className="username-link">
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
                        <p className="bold-header">Selected File: {fileName}</p>
                        <div className="file-header">
                          <button
                            onClick={handlePredict}
                            className="basic-button"
                          >
                            Predict
                          </button>
                          <button
                            className="basic-button"
                            disabled={!isLoggedIn}
                          >
                            Save
                          </button>
                          {!isLoggedIn && (
                            <p className="login-prompt">
                              Log in to save files to an account
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {/* Additional right panel content */}
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
          <p>&copy; 2023 RankGenie. All rights reserved.</p>
        </footer>

        <script src="js/script.js"></script>
      </div>
    </Router>
  );
}

export default App;
