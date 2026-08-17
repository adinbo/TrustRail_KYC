import "dotenv/config";
import http from "node:http";
import { buildOrchestratorFromEnv } from "./index.js";
import { CediRampKycAdapter } from "./adapter/cediramp.js";

const PORT = parseInt(process.env.PORT || "3333", 10);

const orchestrator = buildOrchestratorFromEnv();
const adapter = new CediRampKycAdapter(orchestrator);

const HTML_TESTER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrustRail KYC — Standalone Testing Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 30, 49, 0.75);
      --border: rgba(255, 255, 255, 0.08);
      --accent: #2563eb;
      --accent-glow: rgba(37, 99, 235, 0.35);
      --text: #f8fafc;
      --text-dim: #94a3b8;
      --success: #10b981;
      --error: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(circle at top, #131d36 0%, var(--bg) 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.5rem 1rem;
    }
    .container {
      width: 100%;
      max-width: 800px;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(37, 99, 235, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
      margin-bottom: 0.75rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    p.subtitle {
      color: var(--text-dim);
      font-size: 0.95rem;
    }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      margin-bottom: 2rem;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-group.full {
      grid-column: 1 / -1;
    }
    label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    input {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #fff;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }
    input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }
    .btn-row {
      margin-top: 1.5rem;
      display: flex;
      gap: 1rem;
    }
    button {
      flex: 1;
      padding: 0.85rem 1.5rem;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      font-weight: 700;
      font-size: 1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 14px var(--accent-glow);
      transition: all 0.2s ease;
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--accent-glow);
    }
    button.secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text-dim);
      box-shadow: none;
      flex: 0 0 auto;
    }
    button.secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
    .results {
      display: none;
      margin-top: 2rem;
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
    }
    .result-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 1.25rem;
    }
    .result-badge.success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--success);
    }
    .result-badge.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--error);
    }
    pre {
      background: #050811;
      padding: 1.25rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      overflow-x: auto;
      max-height: 400px;
    }
    .config-box {
      font-size: 0.85rem;
      color: var(--text-dim);
      background: rgba(15, 23, 42, 0.4);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Standalone Verification Testbed</div>
      <h1>TrustRail-KYC Engine</h1>
      <p class="subtitle">Direct identity validation & sanctions screening console (zero partner dependency)</p>
    </div>

    <div class="card">
      <form id="kycForm">
        <div class="grid">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" value="Amina Fatou Clearwater" required>
          </div>
          <div class="form-group">
            <label for="idNumber">Ghana Card ID</label>
            <input type="text" id="idNumber" value="GHA-712345678-1" required placeholder="GHA-XXXXXXXXX-X">
          </div>
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth</label>
            <input type="date" id="dateOfBirth" value="1992-04-12" required>
          </div>
          <div class="form-group">
            <label for="phoneNumber">Phone Number (Optional)</label>
            <input type="tel" id="phoneNumber" value="+233241234567">
          </div>
          <div class="form-group full">
            <label for="email">Email Address (Optional)</label>
            <input type="email" id="email" value="amina.clearwater@example.com">
          </div>
        </div>

        <div class="btn-row">
          <button type="submit" id="submitBtn">⚡ Run KYC Verification</button>
          <button type="button" class="secondary" id="fillPassBtn">Prefill Pass</button>
          <button type="button" class="secondary" id="fillFailBtn">Prefill Fail</button>
        </div>
      </form>

      <div class="results" id="resultsSection">
        <div id="statusBadge" class="result-badge"></div>
        <pre><code id="jsonOutput"></code></pre>
      </div>

      <div class="config-box">
        <strong>Runtime Configuration:</strong>
        <code>KYC_VENDOR=${process.env.KYC_VENDOR || "smile"}</code> |
        <code>SANCTIONS_MODE=${process.env.SANCTIONS_MODE || "mock"}</code> |
        <code>NIA_MODE=${process.env.NIA_MODE || "mock"}</code>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('kycForm');
    const submitBtn = document.getElementById('submitBtn');
    const resultsSection = document.getElementById('resultsSection');
    const statusBadge = document.getElementById('statusBadge');
    const jsonOutput = document.getElementById('jsonOutput');

    document.getElementById('fillPassBtn').addEventListener('click', () => {
      document.getElementById('fullName').value = "Amina Fatou Clearwater";
      document.getElementById('idNumber').value = "GHA-712345678-1";
      document.getElementById('dateOfBirth').value = "1992-04-12";
      document.getElementById('email').value = "amina.clearwater@example.com";
      document.getElementById('phoneNumber').value = "+233241234567";
    });

    document.getElementById('fillFailBtn').addEventListener('click', () => {
      document.getElementById('fullName').value = "Rashid Omar Dangerfield";
      document.getElementById('idNumber').value = "GHA-000000000-0";
      document.getElementById('dateOfBirth').value = "1990-01-01";
      document.getElementById('email').value = "rashid.dangerfield@example.com";
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.innerText = "Verifying...";
      resultsSection.style.display = "none";

      const payload = {
        userId: "test-" + Date.now(),
        fullName: document.getElementById('fullName').value,
        idNumber: document.getElementById('idNumber').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        phoneNumber: document.getElementById('phoneNumber').value || undefined,
        email: document.getElementById('email').value || undefined,
      };

      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        resultsSection.style.display = "block";
        if (data.passed) {
          statusBadge.className = "result-badge success";
          statusBadge.innerHTML = "✓ PASSED — Identity Verified & Cleared";
        } else {
          statusBadge.className = "result-badge error";
          statusBadge.innerHTML = "✗ NOT PASSED — " + (data.reason || "Verification Failed");
        }
        jsonOutput.innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        resultsSection.style.display = "block";
        statusBadge.className = "result-badge error";
        statusBadge.innerHTML = "✗ Error: " + err.message;
        jsonOutput.innerText = err.stack || String(err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "⚡ Run KYC Verification";
      }
    });
  </script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML_TESTER);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        vendor: process.env.KYC_VENDOR || "smile",
        sanctions: process.env.SANCTIONS_MODE || "mock",
        nia: process.env.NIA_MODE || "mock",
      }),
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/kyc") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const sourceHeader = (req.headers["x-kyc-source"] as string) || "smile";
        const signature = (req.headers["x-smile-signature"] as string) || (req.headers["signature"] as string);
        const { processVendorWebhook } = await import("./webhooks/receiver.js");

        const result = processVendorWebhook({
          source: sourceHeader === "qoreid" ? "qoreid" : "smile",
          signature,
          rawBody: body,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/verify") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const json = JSON.parse(body || "{}");
        const decision = await adapter.evaluateUser({
          userId: json.userId || `user-${Date.now()}`,
          fullName: json.fullName || `${json.firstName || ""} ${json.lastName || ""}`.trim(),
          idNumber: json.idNumber,
          dateOfBirth: json.dateOfBirth,
          phoneNumber: json.phoneNumber,
          email: json.email,
          expiryDate: json.expiryDate,
          digitalAddress: json.digitalAddress,
          selfieImage: json.selfieImage,
          idCardFrontImage: json.idCardFrontImage,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(decision, null, 2));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            passed: false,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` TrustRail-KYC Standalone Server running on http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
