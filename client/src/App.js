import logo from './logo.svg';
import './App.css';
import React, {useState, useEffect} from 'react'

function App() {

  const [data, setData] = useState('')

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

  const handleClick = async() => {
    try{
      const data = await(await fetch("/back")).json()
      setData(data)
      console.log(data)
    } catch(err) {
      console.log(err.message)
    }
  }

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
          <img src="images/avatar.png" alt="User Avatar" className="avatar-image" />
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
        <button type = "submit" onClick = {handleClick} className="filter-button">Filter</button>
        <p>{data.backString}</p>
      </aside>

      <section className="data-visualization-container">
        <div className="data-header">
          <p>Selected Data: Example.csv</p>
        </div>
        <div className="data-visualization">
          <div className="info-panel">Panel 1</div>
          <div className="info-panel">Panel 2</div>
          <div className="info-panel">Panel 3</div>
          <div className="info-panel">Panel 4</div>
        </div>
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
