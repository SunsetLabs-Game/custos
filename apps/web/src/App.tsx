import { useState, useEffect } from "react";
import { Navbar, type TabId } from "./components/Navbar.js";
import { Landing } from "./Landing.js";
import { ProtectorTab } from "./components/ProtectorTab.js";
import { VisionTab } from "./components/VisionTab.js";
import { PresetsTab } from "./components/PresetsTab.js";
import { AuditLogTab } from "./components/AuditLogTab.js";
import { P2pSwarmTab } from "./components/P2pSwarmTab.js";
import { InfoTab } from "./components/InfoTab.js";
import { Footer } from "./components/Footer.js";
import { auditLog } from "./compositionRoot.js";

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("landing");
  const [presetData, setPresetData] = useState<{ address: string; context: string; amount: string }>({
    address: "",
    context: "",
    amount: "1",
  });
  const [auditCount, setAuditCount] = useState<number>(0);

  const refreshAuditCount = () => {
    setAuditCount(auditLog.list().length);
  };

  useEffect(() => {
    refreshAuditCount();
  }, []);

  const handleLoadPreset = (data: { address: string; context: string; amount: string }) => {
    setPresetData(data);
    setActiveTab("protector");
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", background: "var(--upguard-bg)" }}>
      {/* Background ambient lighting effects */}
      <div className="app-bg-glow" />
      <div className="app-bg-grid" />

      {/* Sticky Full-Width Header Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        auditCount={auditCount}
      />

      {/* Main Centered App Content Container */}
      <div style={{ width: "100%", maxWidth: "1140px", margin: "0 auto", padding: "32px 20px 60px", flex: 1, position: "relative", zIndex: 1 }}>
        <main>
          {activeTab === "landing" && (
            <Landing
              onStart={() => setActiveTab("protector")}
              onLoadPreset={handleLoadPreset}
            />
          )}

          {activeTab === "protector" && (
            <ProtectorTab
              initialAddress={presetData.address}
              initialContext={presetData.context}
              initialAmount={presetData.amount}
              onDecisionRecorded={refreshAuditCount}
            />
          )}

          {activeTab === "vision" && (
            <VisionTab onSelectScam={handleLoadPreset} />
          )}

          {activeTab === "presets" && (
            <PresetsTab onLoadPreset={handleLoadPreset} />
          )}

          {activeTab === "audit" && (
            <AuditLogTab onClear={refreshAuditCount} />
          )}

          {activeTab === "p2p" && (
            <P2pSwarmTab />
          )}

          {activeTab === "info" && (
            <InfoTab onStart={() => setActiveTab("protector")} />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
