import logo from './logo.svg';
import './App.css';

function App() {
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
        <button className="filter-button">Filter</button>
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
