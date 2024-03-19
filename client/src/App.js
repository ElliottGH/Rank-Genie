import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";

import Chart from "chart.js/auto";
import { CategoryScale } from "chart.js";
import PieChart from "./components/PieChart";
import LineChart from "./components/LineChart";

Chart.register(CategoryScale);

function App() {
  // STATE HOOKS
  const [fileSelected, setFileSelected] = useState(null); // Is there a file selected?
  const [selectedFile, setSelectedFile] = useState(null); // What is the selected file
  const [fileName, setFileName] = useState(""); // File Properties
  const [fileSize, setFileSize] = useState("---");
  const [fileType, setFileType] = useState("---");
  const [fileLastModified, setFileLastModified] = useState("---");
  const [fileExtension, setFileExtension] = useState("---");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulate authentication state

  // Prediction
  const [selectedModel, setSelectedModel] = useState("xgboost"); // Selected model
  const [predictionResults, setPredictionResults] = useState([]); // Results return
  const [predictionError, setPredictionError] = useState(""); // Error

  // Search & Filter
  const [searchID, setSearchID] = useState(""); // Search
  const [showPrediction0, setShowPrediction0] = useState(true); // Filters
  const [showPrediction1, setShowPrediction1] = useState(true);
  const [filteredResults, setFilteredResults] = useState([]); // Results after using search/pred. filter
  const [sortOrder, setSortOrder] = useState("default"); // Table sort order
  const [isReversed, setIsReversed] = useState(false); // Reversed?

  // Contacts
  const [hoveredContact, setHoveredContact] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const contacts = [
    {
      id: "EC",
      name: "Elliott Carter",
      email: "ecarte6@uwo.ca",
      img: "images/avatar.png",
    },
    {
      id: "LS",
      name: "Lauryn Son",
      email: "lson2@uwo.ca",
      img: "images/avatar.png",
    },
    {
      id: "RK",
      name: "Rithik Kalra",
      email: "rkalra24@uwo.ca",
      img: "images/avatar.png",
    },
    {
      id: "LW",
      name: "Lucas Winterburn",
      email: "lwinte@uwo.ca",
      img: "images/avatar.png",
    },
    {
      id: "SM",
      name: "Scott Murray",
      email: "smurr4@uwo.ca",
      img: "images/avatar.png",
    },
    {
      id: "AT",
      name: "Andrew Tobar",
      email: "ahilltob@uwo.ca",
      img: "images/avatar.png",
    },
  ];

  const handleMouseOver = (contact) => {
    setHoveredContact(contact);
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseOut = () => {
    setHoveredContact(null);
  };

  // Search and filters
  useEffect(() => {
    let filtered = predictionResults.filter((result) => {
      const matchesID =
        searchID === "" || result.id.toString().includes(searchID);
      const matchesPrediction =
        (result.prediction === 0 && showPrediction0) ||
        (result.prediction === 1 && showPrediction1);

      return matchesID && matchesPrediction;
    });

    if (sortOrder !== "default") {
      filtered = filtered.sort((a, b) => {
        if (sortOrder === "id") {
          return a.id - b.id;
        } else if (sortOrder === "riskscore") {
          return a.riskScore - b.riskScore;
        }
        return 0; // Keep default order if none match
      });
    }

    if (isReversed) {
      filtered = filtered.reverse();
    }

    setFilteredResults(filtered);
  }, [
    searchID,
    showPrediction0,
    showPrediction1,
    predictionResults,
    sortOrder,
    isReversed,
  ]);

  const fileInputRef = useRef(null);

  // CHARTS & EARNINGS
  const [earnings, setEarnings] = useState(0);
  // Overall data, for the pie chart
  const [chartData, setChartData] = useState({
    labels: ["Under Threshold [0]", "Exceeds Threshold [1]"],
    datasets: [
      {
        label: "Prediction Distribution",
        data: [],
        backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)"],
        borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)"],
        borderWidth: 1,
      },
    ],
  });
  // Line chart data
  const [lineChartData, setLineChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Cumulative Count of '1' Predictions",
        data: [],
        fill: false,
        backgroundColor: "rgb(75, 192, 192)",
        borderColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  });

  // Prediction button
  const handlePredict = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile); // Send model to prediction
    formData.append("modelType", selectedModel); // Specify the model you want to use
    //console.log("Sending file to server:", selectedFile.name);

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { ID, Prediction, RiskScore } = await response.json();
        const results = ID.map((id, index) => ({
          id,
          prediction: Prediction[index],
          riskScore: RiskScore[index],
        }));

        // Update predictions
        setPredictionResults(results);

        // Update chart data
        // Pie
        const counts = results.reduce((acc, curr) => {
          acc[curr.prediction] = (acc[curr.prediction] || 0) + 1;
          return acc;
        }, {});
        setChartData((prevChartData) => ({
          ...prevChartData,
          datasets: [
            {
              ...prevChartData.datasets[0],
              data: [counts[0] || 0, counts[1] || 0],
            },
          ],
        }));

        // Line
        const sampleSize = 100; // Number of points in line graph
        const stepSize = Math.ceil(results.length / sampleSize);
        let sampledResults = [];
        let cumulativeCount = 0;
        for (let i = 0; i < results.length; i += stepSize) {
          for (let j = i; j < Math.min(i + stepSize, results.length); j++) {
            if (results[j].prediction === 1) {
              cumulativeCount++;
            }
          }
          sampledResults.push({ id: results[i].id, cumulativeCount });
        }

        // Get earnings estimation
        if (sampledResults.length > 0) {
          const lastCumulativeCount =
            sampledResults[sampledResults.length - 1].cumulativeCount;
          setEarnings(lastCumulativeCount);
        } else {
          setEarnings(0);
        }

        const labels = sampledResults.map((result) => `ID ${result.id}`);
        const data = sampledResults.map((result) => result.cumulativeCount);

        setLineChartData({
          labels: labels,
          datasets: [
            {
              label: "Cumulative Predictions Over Threshold",
              data: data,
              fill: false,
              backgroundColor: "rgb(75, 192, 192)",
              borderColor: "rgba(75, 192, 192)",
              pointRadius: 0,
            },
          ],
        });

        // Update error message
        setPredictionError("");
      } else {
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

  // Format the bytes text for the Properties window
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
                          <label htmlFor="file-input" className="basic-button">
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
                          <div className="model-selection">
                            <label className="light-header" htmlFor="modelType">
                              Model Type:
                            </label>
                            <select
                              id="modelType"
                              value={selectedModel}
                              onChange={(e) => setSelectedModel(e.target.value)}
                            >
                              <option value="xgboost">XGBoost</option>
                              <option value="randomforest">RandomForest</option>
                            </select>
                          </div>
                          <button
                            onClick={handlePredict}
                            className="basic-button"
                            type="button"
                            disabled={predictionResults.length > 0}
                            style={{ marginLeft: "20px" }}
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
                            Order by:&nbsp;
                          </label>
                          <select
                            id="sortOrderType"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                          >
                            <option value="default">Default</option>
                            <option value="id">ID</option>
                            <option value="riskscore">Risk Score</option>
                          </select>
                          <label className="extralight-header">
                            Reversed:&nbsp;
                          </label>
                          <input
                            type="checkbox"
                            checked={isReversed}
                            onChange={() => setIsReversed(!isReversed)}
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
                        <div>
                          <hr />
                        </div>

                        {predictionError && (
                          <p className="error-message">{predictionError}</p>
                        )}
                        {predictionResults.length > 0 && (
                          <div className="results-container">
                            <div className="prediction-results">
                              <p className="light-header">Prediction Results</p>
                              <div className="results-scrolling-frame">
                                {filteredResults.length > 0 ? (
                                  <table className="file-details-table">
                                    <thead>
                                      <tr>
                                        <th>ID</th>
                                        <th>Prediction</th>
                                        <th>Risk Score</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {filteredResults.map((result) => (
                                        <tr key={result.id}>
                                          <td>{result.id}</td>
                                          <td>{result.prediction}</td>
                                          <td>{result.riskScore}</td>
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
                            </div>

                            <div className="chart-results">
                              <p className="light-header">Estimated Earnings</p>
                              <div class="earnings-value">${earnings},000+</div>

                              {predictionResults.length > 0 && (
                                <>
                                  <p className="light-header">
                                    Chart Visualizations
                                  </p>
                                  <div className="chart-Container">
                                    <div>
                                      <LineChart chartData={lineChartData} />
                                    </div>
                                    <hr />
                                    <div>
                                      <PieChart chartData={chartData} />
                                    </div>
                                  </div>
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
          <p className="contact-header">Contact Us</p>
          <div className="button-container">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                className="contact-button"
                onMouseOver={() => handleMouseOver(contact)}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
              >
                {contact.id}
              </button>
            ))}
          </div>
          {hoveredContact && (
            <div
              className="profile-card"
              style={{ top: `${mousePos.y}px`, left: `${mousePos.x}px` }} // Adjusted
            >
              <div>
                <img
                  src={hoveredContact.img}
                  alt="Avatar"
                  className="avatar-image"
                />
              </div>

              <div>
                <div>{hoveredContact.name}</div>
                <div>{hoveredContact.email}</div>
              </div>
            </div>
          )}
          <hr />
          <p>&copy; 2023-2024 RankGenie. All rights reserved.</p>
        </footer>

        <script src="js/script.js"></script>
      </div>
    </Router>
  );
}

export default App;
