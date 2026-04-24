export default function App() {
  const aiStudioLink =
    "https://ai.studio/apps/ee0b21de-b9f1-41e2-a6d4-e2be73c485a7";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
        padding: "40px",
      }}
    >
      <h1>🚀 My AI Dashboard</h1>

      <p>
        Google AI Studio cannot be embedded directly here, but you can open it
        using the button below.
      </p>

      <a
        href={aiStudioLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "14px 22px",
          background: "#38bdf8",
          color: "#020617",
          borderRadius: "10px",
          textDecoration: "none",
          fontWeight: "bold",
        }}
      >
        Open AI Studio Dashboard
      </a>
    </div>
  );
}
