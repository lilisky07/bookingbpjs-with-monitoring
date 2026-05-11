import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/mainpage';
import MonitoringPage from './components/pages/MonitoringPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Langsung redirect ke dashboard kalau akses root / */}
        <Route path="/" element={<Navigate to="/bookingbpjs" replace />} />

        {/* Route booking antrol (existing) */}
        <Route path="/bookingbpjs" element={<MainPage />} />

        {/* Route monitoring kepatuhan BPJS (new) */}
        <Route path="/monitoring" element={<MonitoringPage />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/bookingbpjs" replace />} />
      </Routes>
    </Router>
  );
}

export default App;