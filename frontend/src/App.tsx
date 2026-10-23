import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { OnboardingModal } from "./components/OnboardingModal";
import { HomePage } from "./pages/HomePage";
import { ScanPage } from "./pages/ScanPage";
import { BillSaathiPage } from "./pages/BillSaathiPage";
import { BillComparisonPage } from "./pages/BillComparisonPage";
import { ProofPathPage } from "./pages/ProofPathPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-20 md:pb-8">
          <Navbar />
          <OnboardingModal />

          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/billsaathi/:id" element={<BillSaathiPage />} />
              <Route path="/proofpath/:id" element={<ProofPathPage />} />
              <Route path="/compare" element={<BillComparisonPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
};
