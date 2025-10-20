import { APP_NAME, APP_VERSION } from "@ffp/core";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>{APP_NAME}</h1>
      <p>Version: {APP_VERSION}</p>
      <p>
        Multi-tenant physiotherapy SaaS platform - Dynamic assessments,
        personalised programmes, video workouts.
      </p>
      <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "2rem" }}>
        🎯 Phase: Sprint 1 - Application Setup & Foundation
        <br />
        ✅ FFP-17: Turborepo Initialised
        <br />
        🔄 FFP-18: Package Structure Created
      </p>
    </div>
  );
}

export default App;
