import React, { useState } from "react";
import "./Login.css"; // your enhanced UI CSS

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple frontend validation
    const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
    const passwordPattern = /^.{6,}$/;

    if (!usernamePattern.test(username)) {
      setMessage({ text: "Username must be 3-20 chars (letters, numbers, _ or -)", type: "error" });
      return;
    }
    if (!passwordPattern.test(password)) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        credentials: "include", //important to include cookies/session
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message || "Login successful!", type: "success" });

        setTimeout(() => {
          if (data.role === "COE") {
            window.location.href = "http://localhost:5000/coeHome"; 
          } else if (data.role === "Teacher") {
            window.location.href = "http://localhost:5000/teacherHome"; 
          }
        }, 800);
      } else {
        setMessage({ text: data.message || "Invalid credentials", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error. Please try again.", type: "error" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box">
      <img src="/collegelogo.png" alt="College Logo" className="logo" />
      <h2>Welcome back!</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className={`message ${message.type}`}>{message.text}</div>
      </form>
    </div>
  );
}

export default Login;
