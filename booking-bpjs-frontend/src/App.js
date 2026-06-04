import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/mainpage';
import MonitoringPage from './components/pages/MonitoringPage';
import AdminWablas from './components/pages/Adminwablas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Langsung redirect ke dashboard kalau akses root / */}
        <Route path="/" element={<Navigate to="/bookingbpjs" replace />} />

        {/* Route booking antrol (existing) */}
        <Route path="/bookingbpjs" element={<MainPage />} />

        {/* Route monitoring kepatuhan BPJS */}
        <Route path="/monitoring" element={<MonitoringPage />} />

        {/* Route admin wablas (reminder & NPS) */}
        <Route path="/admin-wablas" element={<AdminWablas />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/bookingbpjs" replace />} />
      </Routes>
    </Router>
  );
}

export default App;