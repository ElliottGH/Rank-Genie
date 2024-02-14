import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react";
import BarChart from './components/BarChart';
import {UserData} from './Data' // Replace this with the connection to the database/dataset that will be represented by graphs

function App() {
  const [data, setData] = useState("");
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState("");

  //This calls backend on load/refresh of the react page

  //useEffect(() => {
  //fetch("/back").then(
  //res => res.json()
  //).then(
  //data => {
  //setData(data)
  //console.log(data)
  //}
  //)

  //}, [])
  
    // //Below is a state for UserData, will hold the data formatted for the chart (bar chart for now)
  // const [UserData, setUserData] = useState({
  //   //labels is a list of all labels that represent each bar in the chart
  //   labels: UserData.map((data) => data.year),     //will create a new array that will contain, in this case, year for each element.Loops through dataset to get each 
  //   datasets: [{
  //     label: "Users ____",   //What does this piece of data represent?
  //     data: UserData.map((data) => data.user____),
  //     backgroundColor: ["red", "blue"]  //Changes bar colors, can use rgba and hexadecimal as well
  //   }]  
  // })

  // Temporary backend call for demo
  const handleClick = async () => {
    try {
      const data = await (await fetch("/back")).json();
      setData(data);
      console.log(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileSelected(true);
      setFileName(event.target.files[0].name); // Set the file name
      // Other file processing here
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setFileSelected(true);
      setFileName(event.dataTransfer.files[0].name);
      // Other file processing here
    }
  };

  return (
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
          <a href="#home">Home</a> • <a href="#logout">Logout</a> •
          <a href="#settings">Account Settings</a>
        </nav>
      </header>

      <div className="main-content">
        <aside className="user-info">
          <div className="profile-card">
            <img
              src="images/avatar.png"
              alt="User Avatar"
              className="avatar-image"
            />
            <h2>Username</h2>
            <p>Company Name</p>
          </div>
          <div className="subscription-info">
            <h3>Subscription Options</h3>
            <p>Current Plan: Free</p>
            <button className="upgrade-button">Upgrade Now</button>
          </div>
        </aside>

        <aside className="data-trends">
          <h3>Data Trends</h3>
          {/* <!-- data trends stuff --> */}
          <button type="submit" onClick={handleClick} className="basic-button">
            Filter
          </button>
          <p>{data.backString}</p>
        </aside>

        <section
          className="data-visualization-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!fileSelected ? (
            <div>
              <input
                type="file"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                id="file-input"
                accept=".csv"
              />
              <div className="file-input-container">
                <br />
                <label htmlFor="file-input" className="basic-button">
                  Browse File
                </label>
                <p className="drag-drop-prompt">or Drag & Drop here</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="data-header">
                <div>
                  <p>Selected Data: {fileName}</p>
                </div>
                <div>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                    id="file-input-reselect"
                    accept=".csv" // Only accept CSV files
                  />
                  <label htmlFor="file-input-reselect" className="basic-button">
                    Browse New File
                  </label>
                </div>
              </div>
              <div className="data-visualization">
                <div className="info-panel">Panel 1</div>
                <div className="info-panel">Panel 2</div>
                <div className="info-panel">Panel 3</div>
                <div className="info-panel">Panel 4</div>
              </div>
            </div>
          )}
        </section>
      </div>

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
  );
}

export default App;
