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
    .phone-input-wrapper {
      display: flex;
      align-items: stretch;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .phone-input-wrapper:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }
    .phone-prefix-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(30, 41, 59, 0.8);
      padding: 0 0.85rem;
      font-size: 0.9rem;
      font-weight: 700;
      color: #94a3b8;
      border-right: 1px solid var(--border);
      user-select: none;
    }
    .phone-input-wrapper input {
      flex: 1;
      border: none !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      padding: 0.75rem 0.85rem;
    }
    .helper-text {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.2rem;
    }
    .helper-text strong {
      color: #93c5fd;
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
            <input type="text" id="idNumber" value="GHA-712345678-1" required placeholder="GHA-XXXXXXXXX-X" autocomplete="off">
            <small id="idNumberHelp" class="helper-text">Format: <strong>GHA-XXXXXXXXX-X</strong></small>
          </div>
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth</label>
            <input type="date" id="dateOfBirth" value="1992-04-12" required>
            <small class="helper-text">Must be at least 18 years old</small>
          </div>
          <div class="form-group">
            <label for="phoneNumber">Phone Number (Ghana Mobile)</label>
            <div class="phone-input-wrapper">
              <span class="phone-prefix-badge">🇬🇭 +233</span>
              <input type="tel" id="phoneNumber" value="241234567" placeholder="e.g. 241234567" maxlength="10" autocomplete="tel-national">
            </div>
            <small id="phoneHelp" class="helper-text">Enter 9 or 10 digits (e.g., <strong>241234567</strong> or <strong>0241234567</strong>)</small>
          </div>
          <div class="form-group">
            <label for="digitalAddress">GhanaPost GPS (Proof of Address)</label>
            <input type="text" id="digitalAddress" value="GA-183-9214" placeholder="e.g. AK-039-5028" autocomplete="off">
            <small id="addressHelp" class="helper-text">Format: <strong>XX-NNN-NNNN</strong> (e.g., GA-183-9214)</small>
          </div>
          <div class="form-group full">
            <label for="email">Email Address (Optional)</label>
            <input type="email" id="email" value="amina.clearwater@example.com" placeholder="name@domain.com">
            <small id="emailHelp" class="helper-text">Valid email address for notification & verification</small>
          </div>
          <div class="form-group">
            <label for="selfieFile">User Selfie (Biometric Liveness & Face Match)</label>
            <input type="file" id="selfieFile" accept="image/*">
            <input type="hidden" id="selfieBase64">
          </div>
          <div class="form-group">
            <label for="idCardFile">ID Card Photo (Document OCR & Tamper Check)</label>
            <input type="file" id="idCardFile" accept="image/*">
            <input type="hidden" id="idCardBase64">
          </div>
        </div>

        <div class="btn-row">
          <button type="submit" id="submitBtn">⚡ Run KYC Verification</button>
          <button type="button" class="secondary" id="attachDemoPhotosBtn">📷 Attach Demo Photos</button>
          <button type="button" class="secondary" id="fillPassBtn">Prefill Pass</button>
          <button type="button" class="secondary" id="fillFailBtn">Prefill Fail</button>
        </div>
      </form>

      <div class="results" id="resultsSection">
        <div id="statusBadge" class="result-badge"></div>
        <div id="biometricsCard" style="display:none; background: rgba(37,99,235,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <h4 style="color: #60a5fa; margin-bottom: 0.5rem;">📸 Biometric & Photo Screening Results</h4>
          <div id="biometricsContent" style="font-size: 0.9rem; color: #cbd5e1;"></div>
        </div>
        <pre><code id="jsonOutput"></code></pre>
      </div>

      <div class="config-box">
        <strong>Runtime Configuration:</strong>
        <code>KYC_VENDOR=${process.env.KYC_VENDOR || "qoreid"}</code> |
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
    const biometricsCard = document.getElementById('biometricsCard');
    const biometricsContent = document.getElementById('biometricsContent');

    const idInput = document.getElementById('idNumber');
    const idHelp = document.getElementById('idNumberHelp');
    const phoneInput = document.getElementById('phoneNumber');
    const phoneHelp = document.getElementById('phoneHelp');
    const addressInput = document.getElementById('digitalAddress');
    const addressHelp = document.getElementById('addressHelp');
    const emailInput = document.getElementById('email');
    const emailHelp = document.getElementById('emailHelp');

    // 1. Phone number formatting (frictionless numeric entry for Ghana mobile)
    phoneInput.addEventListener('input', () => {
      let digits = phoneInput.value.replace(/\D/g, '');
      if (digits.startsWith('233') && digits.length > 3) {
        digits = digits.slice(3);
      }
      let subscriber = digits.startsWith('0') ? digits.slice(1) : digits;
      subscriber = subscriber.slice(0, 9);

      phoneInput.value = digits.slice(0, 10);

      if (subscriber.length === 9) {
        const formatted = subscriber.slice(0, 2) + ' ' + subscriber.slice(2, 5) + ' ' + subscriber.slice(5);
        phoneHelp.innerHTML = '<span style="color:#10b981;">✓ Valid Ghana mobile: +233 ' + formatted + '</span>';
      } else if (subscriber.length > 0) {
        phoneHelp.innerHTML = '<span style="color:#f59e0b;">Subscriber digits: ' + subscriber.length + '/9 (e.g. 241234567)</span>';
      } else {
        phoneHelp.innerHTML = 'Enter 9 or 10 digits (e.g., <strong>241234567</strong> or <strong>0241234567</strong>)';
      }
    });

    // 2. Ghana Card formatting & validation
    idInput.addEventListener('input', () => {
      let raw = idInput.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      idInput.value = raw;
      const valid = /^GHA-\d{9}-\d$/.test(raw);
      if (valid) {
        idHelp.innerHTML = '<span style="color:#10b981;">✓ Valid Ghana Card format</span>';
      } else if (raw.length > 0) {
        idHelp.innerHTML = '<span style="color:#f59e0b;">Expected format: GHA-XXXXXXXXX-X (e.g., GHA-712345678-1)</span>';
      } else {
        idHelp.innerHTML = 'Format: <strong>GHA-XXXXXXXXX-X</strong>';
      }
    });

    // 3. GhanaPost GPS Address formatting & validation
    const REGION_LOOKUP = {
      GA: 'Greater Accra (Accra)', GS: 'Greater Accra (South)', GW: 'Greater Accra (West)',
      AK: 'Ashanti (Kumasi)', AS: 'Ashanti (South)', CR: 'Central', ER: 'Eastern',
      WR: 'Western', VR: 'Volta', NR: 'Northern', UW: 'Upper West', UE: 'Upper East', BA: 'Bono'
    };

    addressInput.addEventListener('input', () => {
      let raw = addressInput.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      addressInput.value = raw;
      const valid = /^[A-Z]{1,2}-\d{3,4}-\d{4}$/.test(raw);
      if (valid) {
        const prefix = raw.split('-')[0];
        const reg = REGION_LOOKUP[prefix] || 'Ghana Regional District';
        addressHelp.innerHTML = '<span style="color:#10b981;">✓ Valid Address — ' + reg + '</span>';
      } else if (raw.length > 0) {
        addressHelp.innerHTML = '<span style="color:#f59e0b;">Format: XX-NNN-NNNN (e.g., GA-183-9214, AK-039-5028)</span>';
      } else {
        addressHelp.innerHTML = 'Format: <strong>XX-NNN-NNNN</strong> (e.g., GA-183-9214)';
      }
    });

    // 4. Email validation
    emailInput.addEventListener('input', () => {
      const val = emailInput.value.trim();
      if (!val) {
        emailHelp.innerHTML = 'Valid email address for notification & verification';
        return;
      }
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (valid) {
        emailHelp.innerHTML = '<span style="color:#10b981;">✓ Valid email format</span>';
      } else {
        emailHelp.innerHTML = '<span style="color:#f87171;">Invalid email format (must include @ and valid domain)</span>';
      }
    });

    const samplePhotoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    function handleFile(inputElem, hiddenElem) {
      inputElem.addEventListener('change', () => {
        const file = inputElem.files[0];
        if (!file) {
          hiddenElem.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          hiddenElem.value = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    handleFile(document.getElementById('selfieFile'), document.getElementById('selfieBase64'));
    handleFile(document.getElementById('idCardFile'), document.getElementById('idCardBase64'));

    document.getElementById('attachDemoPhotosBtn').addEventListener('click', () => {
      document.getElementById('selfieBase64').value = samplePhotoBase64;
      document.getElementById('idCardBase64').value = samplePhotoBase64;
      alert("✓ Attached demo selfie and ID card photos for biometric verification testing.");
    });

    document.getElementById('fillPassBtn').addEventListener('click', () => {
      document.getElementById('fullName').value = "Amina Fatou Clearwater";
      document.getElementById('idNumber').value = "GHA-712345678-1";
      document.getElementById('dateOfBirth').value = "1992-04-12";
      document.getElementById('email').value = "amina.clearwater@example.com";
      document.getElementById('phoneNumber').value = "241234567";
      document.getElementById('digitalAddress').value = "GA-183-9214";
      idInput.dispatchEvent(new Event('input'));
      phoneInput.dispatchEvent(new Event('input'));
      addressInput.dispatchEvent(new Event('input'));
      emailInput.dispatchEvent(new Event('input'));
    });

    document.getElementById('fillFailBtn').addEventListener('click', () => {
      document.getElementById('fullName').value = "Rashid Omar Dangerfield";
      document.getElementById('idNumber').value = "GHA-000000000-0";
      document.getElementById('dateOfBirth').value = "1990-01-01";
      document.getElementById('email').value = "rashid.dangerfield@example.com";
      document.getElementById('phoneNumber').value = "241234567";
      document.getElementById('digitalAddress').value = "GA-183-9214";
      idInput.dispatchEvent(new Event('input'));
      phoneInput.dispatchEvent(new Event('input'));
      addressInput.dispatchEvent(new Event('input'));
      emailInput.dispatchEvent(new Event('input'));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.innerText = "Verifying...";
      resultsSection.style.display = "none";
      biometricsCard.style.display = "none";

      let rawPhone = document.getElementById('phoneNumber').value.replace(/\D/g, '');
      if (rawPhone.startsWith('233') && rawPhone.length > 3) rawPhone = rawPhone.slice(3);
      if (rawPhone.startsWith('0')) rawPhone = rawPhone.slice(1);
      const formattedPhone = rawPhone ? ("+233 " + rawPhone) : undefined;

      const payload = {
        userId: "test-" + Date.now(),
        fullName: document.getElementById('fullName').value,
        idNumber: document.getElementById('idNumber').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        phoneNumber: formattedPhone,
        email: document.getElementById('email').value || undefined,
        digitalAddress: document.getElementById('digitalAddress').value || undefined,
        selfieImage: document.getElementById('selfieBase64').value || undefined,
        idCardFrontImage: document.getElementById('idCardBase64').value || undefined,
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

        const vendorCheck = data.details?.verificationResult?.checks?.find(c => c.source === 'smile' || c.source === 'qoreid' || c.source === 'mock');
        if (vendorCheck?.biometrics) {
          biometricsCard.style.display = "block";
          biometricsContent.innerHTML = 
            '<div><strong>Face Match Score:</strong> ' + vendorCheck.biometrics.faceMatchScore + '%</div>' +
            '<div><strong>Liveness Verification:</strong> ' + (vendorCheck.biometrics.livenessPassed ? '✓ Passed (Anti-Spoof Cleared)' : '✗ Failed') + '</div>' +
            '<div><strong>Confidence Level:</strong> ' + (vendorCheck.biometrics.confidenceLevel || 'HIGH') + '</div>';
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
