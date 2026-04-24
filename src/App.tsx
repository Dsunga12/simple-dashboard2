export default function App() {
  const aiStudioLink =
    "https://ai.studio/apps/ee0b21de-b9f1-41e2-a6d4-e2be73c485a7";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #020617 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "24px",
            padding: "40px",
            marginBottom: "24px",
          }}
        >
          <p style={{ color: "#facc15", fontWeight: "bold", letterSpacing: "2px" }}>
            WEEKLY PERFORMANCE DASHBOARD
          </p>

          <h1 style={{ fontSize: "42px", margin: "10px 0" }}>
            GYG Singapore Peak Hour Championship
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: "17px", lineHeight: "1.6" }}>
            A weekly store performance dashboard designed to review transactions,
            sales performance, zone rankings, and weekly growth insights.
          </p>

          <a
            href={aiStudioLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: "24px",
              padding: "14px 22px",
              background: "#facc15",
              color: "#111827",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Open Full AI Studio Dashboard
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div style={cardStyle}>
            <p style={labelStyle}>Report Type</p>
            <h2 style={valueStyle}>Weekly</h2>
          </div>

          <div style={cardStyle}>
            <p style={labelStyle}>Focus</p>
            <h2 style={valueStyle}>Store Performance</h2>
          </div>

          <div style={cardStyle}>
            <p style={labelStyle}>Metrics</p>
            <h2 style={valueStyle}>Sales & Transactions</h2>
          </div>

          <div style={cardStyle}>
            <p style={labelStyle}>Status</p>
            <h2 style={{ ...valueStyle, color: "#22c55e" }}>Ready</h2>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "24px",
            padding: "32px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Weekly Report Summary</h2>

          <ul style={{ color: "#cbd5e1", lineHeight: "1.9", paddingLeft: "20px" }}>
            <li>Tracks weekly store performance across participating outlets.</li>
            <li>Compares transaction volume, sales results, and week-over-week growth.</li>
            <li>Highlights top-performing restaurants and zone rankings.</li>
            <li>Supports management review through a full AI Studio dashboard.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "20px",
  padding: "24px",
};

const labelStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "1.5px",
  textTransform: "uppercase" as const,
};

const valueStyle = {
  fontSize: "24px",
  margin: "8px 0 0",
};
