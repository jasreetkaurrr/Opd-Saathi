import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HospitalProvider } from './context/HospitalContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { SlipPage } from './pages/SlipPage.jsx';
import { MyTurnPage } from './pages/MyTurnPage.jsx';
import { HaveSlipPage } from './pages/HaveSlipPage.jsx';
import { WayfindingPage } from './pages/WayfindingPage.jsx';
import { EmergencyPage } from './pages/EmergencyPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { StaffDashboardPage } from './pages/StaffDashboardPage.jsx';
import { StaffCounterPage } from './pages/StaffCounterPage.jsx';
import { WaitingBoardPage } from './pages/WaitingBoardPage.jsx';
import { stopSpeech } from './utils/sound.js';

function RouteChangeHelper() {
  const { pathname } = useLocation();
  useEffect(() => {
    stopSpeech();
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HospitalProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteChangeHelper />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/slip/:token" element={<SlipPage />} />
          <Route path="/turn/:token" element={<MyTurnPage />} />
          <Route path="/have-slip" element={<HaveSlipPage />} />
          <Route path="/find" element={<WayfindingPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/counter" element={<StaffCounterPage />} />
          <Route path="/board" element={<WaitingBoardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HospitalProvider>
  );
}
