import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Timeline from "./components/Timeline";
import Settings from "./components/Settings";
import About from "./components/About";
import { ThemeProvider } from "./components/ThemeProvider";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState("timeline");

  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
          <main className="main-content">
            <div className="content-wrapper">
              <Routes>
                <Route path="/" element={<Timeline />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
