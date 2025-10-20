/**
 * PathAliasTest Component
 * Demonstrates both workspace imports (@ffp/core) and internal aliases (@/) work correctly
 */
import { APP_NAME, testPathAliases } from "@ffp/core";

export function PathAliasTest() {
  const testData = testPathAliases();

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>TypeScript Path Alias Test</h2>

      <div style={{ marginTop: "20px" }}>
        <h3>✅ Workspace Import (@ffp/core)</h3>
        <p>
          App Name: <strong>{APP_NAME}</strong>
        </p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>✅ Internal Path Aliases</h3>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
          }}
        >
          {JSON.stringify(
            {
              tenant: {
                id: testData.tenant.id,
                name: testData.tenant.name,
                type: testData.tenant.type,
              },
              user: {
                id: testData.user.id,
                email: testData.user.email,
                role: testData.user.role,
              },
            },
            null,
            2
          )}
        </pre>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#e8f5e9",
          borderRadius: "4px",
        }}
      >
        <strong>✅ All path aliases working correctly!</strong>
      </div>
    </div>
  );
}
