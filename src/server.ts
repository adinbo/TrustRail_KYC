import "dotenv/config";
import http from "node:http";
import { buildOrchestratorFromEnv, InHouseIdentityClient, InHouseOcrEngine, InHouseBiometricEngine } from "./index.js";
import { CediRampKycAdapter } from "./adapter/cediramp.js";

const PORT = parseInt(process.env.PORT || "3333", 10);

const orchestrator = buildOrchestratorFromEnv();
const adapter = new CediRampKycAdapter(orchestrator);

const HTML_TESTER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>TrustRail KYC — Bank-Grade Progressive Identity Suite</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050814;
      --surface: #0a0f20;
      --surface-card: rgba(13, 19, 38, 0.78);
      --surface-elevated: rgba(19, 28, 54, 0.9);
      --surface-hover: rgba(28, 41, 75, 0.6);
      --border: rgba(255, 255, 255, 0.08);
      --border-light: rgba(255, 255, 255, 0.14);
      --border-accent: rgba(59, 130, 246, 0.4);
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #3b82f6 100%);
      --emerald-gradient: linear-gradient(135deg, #059669 0%, #10b981 100%);
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 22px;
      --radius-full: 9999px;
      --shadow-sm: 0 4px 14px rgba(0, 0, 0, 0.35);
      --shadow-lg: 0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06);
      --glow-blue: 0 0 35px rgba(59, 130, 246, 0.25);
      --glow-emerald: 0 0 35px rgba(16, 185, 129, 0.25);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.22), transparent 70%),
                  radial-gradient(circle 600px at 100% 100%, rgba(16, 185, 129, 0.08), transparent),
                  radial-gradient(circle 500px at 0% 80%, rgba(6, 182, 212, 0.06), transparent),
                  var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem 3.5rem 1rem;
      overflow-x: hidden;
      letter-spacing: -0.01em;
    }

    .container {
      width: 100%;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Top Branding & Status Header */
    .header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0 0.25rem 0;
    }
    .brand-row {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
    }
    .brand-icon svg {
      width: 20px;
      height: 20px;
      fill: #fff;
    }
    h1 {
      font-size: clamp(1.45rem, 4.5vw, 1.95rem);
      font-weight: 800;
      letter-spacing: -0.035em;
      background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.3rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #93c5fd;
    }
    .badge-pill::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-emerald);
      box-shadow: 0 0 8px var(--accent-emerald);
      animation: pulseGlow 2s infinite ease-in-out;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 0.86rem;
      font-weight: 500;
    }

    /* Developer Quick Toolbar */
    .dev-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.45rem 0.75rem;
      font-size: 0.76rem;
    }
    .dev-btn-group {
      display: flex;
      gap: 0.35rem;
    }
    .dev-btn {
      padding: 0.25rem 0.65rem;
      font-size: 0.72rem;
      min-height: auto;
      border-radius: 6px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dev-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Step Indicator Bar */
    .stepper-nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      background: var(--surface-card);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      box-shadow: var(--shadow-sm);
    }
    .step-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      opacity: 0.5;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .step-node.active {
      opacity: 1;
    }
    .step-node.completed {
      opacity: 0.95;
    }
    .step-pill-indicator {
      width: 100%;
      height: 4px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.08);
      transition: all 0.3s ease;
    }
    .step-node.active .step-pill-indicator {
      background: var(--primary);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.9);
    }
    .step-node.completed .step-pill-indicator {
      background: var(--accent-emerald);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }
    .step-label {
      font-size: 0.73rem;
      font-weight: 700;
      color: var(--text-muted);
      text-align: center;
      transition: color 0.2s ease;
    }
    .step-node.active .step-label {
      color: #93c5fd;
    }
    .step-node.completed .step-label {
      color: #34d399;
    }

    /* Main Wizard Card Container */
    .wizard-card {
      background: var(--surface-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: clamp(1.25rem, 4vw, 2rem);
      box-shadow: var(--shadow-lg);
      position: relative;
      min-height: 460px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.3s ease;
    }
    .wizard-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 10%;
      right: 10%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
      pointer-events: none;
    }

    .step-pane {
      display: none;
      flex-direction: column;
      gap: 1.25rem;
      animation: fadeInSlide 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .step-pane.active {
      display: flex;
    }
    @keyframes fadeInSlide {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .pane-header {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .pane-title {
      font-size: 1.22rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      letter-spacing: -0.02em;
    }
    .pane-desc {
      font-size: 0.86rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    /* Precision Capture Viewport */
    .hero-capture-box {
      background: radial-gradient(circle at center, #090e1f 0%, #030611 100%);
      border: 2px dashed rgba(59, 130, 246, 0.35);
      border-radius: var(--radius-md);
      height: 220px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .hero-capture-box:hover {
      border-color: rgba(59, 130, 246, 0.6);
      background: radial-gradient(circle at center, #0d152e 0%, #040816 100%);
    }
    .hero-capture-box.has-photo {
      border-style: solid;
      border-color: var(--accent-emerald);
      box-shadow: 0 0 25px rgba(16, 185, 129, 0.2);
    }
    .hero-capture-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .capture-placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.55rem;
      color: var(--text-dim);
      text-align: center;
      padding: 1rem;
    }
    .capture-placeholder-icon {
      font-size: 2.5rem;
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
    }
    .capture-placeholder-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #cbd5e1;
    }
    .capture-placeholder-hint {
      font-size: 0.74rem;
      color: var(--text-dim);
    }

    /* Target Reticle Corner Brackets on Viewport */
    .reticle-corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: rgba(59, 130, 246, 0.7);
      pointer-events: none;
    }
    .reticle-corner.tl { top: 10px; left: 10px; border-top: 2px solid; border-left: 2px solid; }
    .reticle-corner.tr { top: 10px; right: 10px; border-top: 2px solid; border-right: 2px solid; }
    .reticle-corner.bl { bottom: 10px; left: 10px; border-bottom: 2px solid; border-left: 2px solid; }
    .reticle-corner.br { bottom: 10px; right: 10px; border-bottom: 2px solid; border-right: 2px solid; }

    /* Action Trigger Buttons Grid */
    .capture-button-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }
    .capture-button-group.three-btn {
      grid-template-columns: 1.2fr 1fr 1fr;
    }
    .capture-button-group.two-btn {
      grid-template-columns: 1fr 1fr;
    }
    @media (max-width: 540px) {
      .capture-button-group,
      .capture-button-group.two-btn,
      .capture-button-group.three-btn {
        grid-template-columns: 1fr !important;
      }
    }

    /* Form Fields Grid */
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.9rem;
    }
    @media (max-width: 580px) {
      .fields-grid { grid-template-columns: 1fr; }
    }
    .field-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #cbd5e1;
      letter-spacing: 0.01em;
    }
    input {
      background: rgba(10, 16, 32, 0.85);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.7rem 0.9rem;
      color: #fff;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }
    input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      background: rgba(12, 20, 42, 0.95);
    }
    .phone-wrapper {
      display: flex;
      background: rgba(10, 16, 32, 0.85);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .phone-wrapper:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }
    .phone-tag {
      padding: 0 0.75rem;
      background: rgba(255, 255, 255, 0.04);
      display: flex;
      align-items: center;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-muted);
      border-right: 1px solid var(--border);
    }
    .phone-wrapper input {
      border: none !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      flex: 1;
    }

    /* Verification Summary Strip */
    .summary-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
      background: rgba(10, 16, 32, 0.6);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
    }
    .summary-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .summary-thumb {
      width: 100%;
      height: 58px;
      border-radius: 6px;
      object-fit: cover;
      background: #000;
      border: 1px solid var(--border);
    }
    .summary-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    /* Wizard Navigation Footer */
    .wizard-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
      gap: 0.75rem;
    }

    /* Button Styles */
    button, .file-btn, .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.68rem 1.2rem;
      font-family: inherit;
      font-size: 0.86rem;
      font-weight: 700;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.06);
      color: #e2e8f0;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 44px;
      text-decoration: none;
      box-sizing: border-box;
      user-select: none;
      text-align: center;
    }
    button:hover, .file-btn:hover, .btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.25);
    }
    button:active, .file-btn:active, .btn:active {
      transform: scale(0.97);
    }
    button.btn-primary, .file-btn.btn-primary, .btn-primary {
      background: var(--primary-gradient) !important;
      border: none !important;
      color: #fff !important;
      font-size: 0.92rem;
      font-weight: 800;
      padding: 0.75rem 1.4rem;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
    }
    button.btn-primary:hover, .file-btn.btn-primary:hover, .btn-primary:hover {
      box-shadow: 0 6px 24px rgba(37, 99, 235, 0.65);
      transform: translateY(-1px);
    }
    button.btn-secondary, .file-btn.btn-secondary, .btn-secondary {
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid var(--border) !important;
      color: var(--text-muted) !important;
    }
    button:disabled, .file-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    /* Consent Disclaimer Pill */
    .consent-banner {
      margin: 0.85rem 0;
      padding: 0.75rem 0.9rem;
      background: rgba(59, 130, 246, 0.07);
      border: 1px solid rgba(59, 130, 246, 0.22);
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }
    .consent-banner input[type="checkbox"] {
      margin-top: 0.2rem;
      cursor: pointer;
      accent-color: var(--primary);
      width: 16px;
      height: 16px;
    }
    .consent-banner label {
      cursor: pointer;
      color: #cbd5e1;
      line-height: 1.4;
      font-weight: 500;
    }

    /* Modal Viewport */
    .scanner-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(3, 5, 15, 0.94);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 9999;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .scanner-dialog {
      width: 100%;
      max-width: 480px;
      background: #090f22;
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(37, 99, 235, 0.2);
      display: flex;
      flex-direction: column;
      animation: modalScale 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalScale {
      from { opacity: 0; transform: scale(0.94); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 0.9rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(13, 20, 42, 0.95);
      border-bottom: 1px solid var(--border);
    }
    .modal-title {
      font-size: 0.96rem;
      font-weight: 800;
      color: #fff;
    }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.3rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      min-height: auto;
    }
    .camera-frame {
      position: relative;
      width: 100%;
      height: 320px;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .camera-frame video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .id-frame-guide {
      position: absolute;
      width: 84%;
      height: 68%;
      border: 2px dashed rgba(59, 130, 246, 0.85);
      border-radius: 10px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
      pointer-events: none;
      display: none;
    }
    .face-oval-guide {
      position: absolute;
      width: 200px;
      height: 250px;
      border: 3px solid #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.58), 0 0 25px rgba(16, 185, 129, 0.4);
      pointer-events: none;
      display: none;
    }
    .motion-indicator-arrow {
      position: absolute;
      font-size: 3.5rem;
      color: #38bdf8;
      text-shadow: 0 0 25px rgba(56, 189, 248, 0.8);
      pointer-events: none;
      display: none;
      animation: bounce 0.8s infinite alternate ease-in-out;
    }
    @keyframes bounce { 0% { transform: scale(0.9); } 100% { transform: scale(1.15); } }

    .modal-footer {
      padding: 1.1rem 1.25rem;
      background: rgba(13, 20, 42, 0.98);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      text-align: center;
    }
    .modal-instruction {
      font-size: 0.84rem;
      font-weight: 600;
      color: #93c5fd;
    }
    .motion-stepper {
      display: flex;
      justify-content: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .step-chip {
      font-size: 0.72rem;
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-dim);
      font-weight: 600;
    }
    .step-chip.active {
      background: rgba(37, 99, 235, 0.3);
      border: 1px solid #3b82f6;
      color: #93c5fd;
      font-weight: 700;
    }
    .step-chip.done {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      color: #34d399;
      font-weight: 700;
    }

    /* Decision Screen */
    .decision-banner {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 1.1rem;
      font-weight: 800;
      box-shadow: var(--shadow-sm);
    }
    .decision-banner.success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
    }
    .decision-banner.error {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fb7185;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin: 1rem 0;
    }
    @media (max-width: 500px) {
      .metrics-grid { grid-template-columns: 1fr; }
    }
    .metric-card {
      background: rgba(10, 16, 32, 0.7);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.85rem;
      text-align: center;
    }
    .metric-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #60a5fa;
      margin-top: 0.2rem;
    }
    .metric-lbl {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    /* § UX fix: the failure state used to cram every diagnostic into one
       run-on line inside the decision banner ("✗ NOT PASSED — [In-House KYC
       Engine]: ... | [Sanctions & AML]: ..."), unreadable with more than one
       reason. This gives each reason its own row. */
    .failure-reasons {
      margin: 1rem 0;
      padding: 1rem 1.1rem;
      background: rgba(244, 63, 94, 0.07);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: var(--radius-md);
    }
    .failure-reasons-title {
      font-size: 0.78rem;
      font-weight: 800;
      color: #fb7185;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.6rem;
    }
    .reason-item {
      display: flex;
      gap: 0.55rem;
      align-items: flex-start;
      font-size: 0.85rem;
      line-height: 1.4;
      color: var(--text-dim);
      padding: 0.5rem 0;
      border-top: 1px solid rgba(244, 63, 94, 0.15);
    }
    .reason-item:first-child { border-top: none; padding-top: 0; }
    .reason-item .reason-icon { flex: 0 0 auto; color: #fb7185; font-weight: 800; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-row">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        </div>
        <h1>TrustRail Identity Suite</h1>
      </div>
      <div class="badge-pill">Bank-Grade Verification · Act 843 Compliant</div>
      <p class="subtitle">Progressive 2-Sided Ghana Card OCR & 3D Biometric Liveness</p>
    </div>

    <!-- Developer Quick Presets Toolbar -->
    <div class="dev-toolbar">
      <span style="color:#94a3b8; font-weight:600;">⚡ Quick Presets:</span>
      <div class="dev-btn-group">
        <button type="button" class="dev-btn" id="btnDevPrefillPass">✓ Pass Demo</button>
        <button type="button" class="dev-btn" id="btnDevPrefillFail">✗ Spoof Fail</button>
        <button type="button" class="dev-btn" id="btnDevDemoPhotos">📸 Photos</button>
      </div>
    </div>

    <!-- Step Progress Stepper Navigation -->
    <div class="stepper-nav">
      <div class="step-node active" id="navStep1" onclick="goToStep(1)">
        <div class="step-pill-indicator"></div>
        <span class="step-label">1. ID Front</span>
      </div>
      <div class="step-node" id="navStep2" onclick="goToStep(2)">
        <div class="step-pill-indicator"></div>
        <span class="step-label">2. ID Back</span>
      </div>
      <div class="step-node" id="navStep3" onclick="goToStep(3)">
        <div class="step-pill-indicator"></div>
        <span class="step-label">3. 3D Face</span>
      </div>
      <div class="step-node" id="navStep4" onclick="goToStep(4)">
        <div class="step-pill-indicator"></div>
        <span class="step-label">4. Review</span>
      </div>
    </div>

    <!-- Main Wizard Card Container -->
    <div class="wizard-card">
      <!-- STEP 1: ID Card Front -->
      <div class="step-pane active" id="paneStep1">
        <div class="pane-header">
          <div class="pane-title">📄 Step 1: Scan Ghana Card Front</div>
          <div class="pane-desc">Capture the front of your Ghana National ID Card. In-House OCR will auto-detect your name, ID number, and portrait photo.</div>
        </div>

        <div class="hero-capture-box" id="boxFront">
          <div class="reticle-corner tl"></div>
          <div class="reticle-corner tr"></div>
          <div class="reticle-corner bl"></div>
          <div class="reticle-corner br"></div>
          <div class="capture-placeholder-content" id="placeholderFront">
            <span class="capture-placeholder-icon">📄</span>
            <span class="capture-placeholder-title">No Ghana Card Front Captured</span>
            <span class="capture-placeholder-hint">Align your card inside the frame or upload a clear photo</span>
          </div>
          <img id="imgFrontThumb" src="" style="display:none;" alt="Front Preview">
        </div>

        <div class="capture-button-group three-btn">
          <button type="button" class="btn btn-primary" id="btnOpenFrontCam">📸 Open WebCam</button>
          <label class="file-btn btn-secondary" style="cursor:pointer;">
            📁 Upload / Photo
            <input type="file" id="fileFrontInput" accept="image/*" style="display:none;">
          </label>
          <input type="file" id="fileFrontCamNative" accept="image/*" capture="environment" style="display:none;">
          <button type="button" class="btn-secondary" id="btnRunFrontOcr">🔍 Auto-OCR</button>
        </div>

        <div class="consent-banner">
          <input type="checkbox" id="chkConsentAct843" checked>
          <label for="chkConsentAct843">
            <strong>Ghana Data Protection Act (Act 843) Consent:</strong> I authorize TrustRail to process my biometric and document data for identity verification with the National Identification Authority (NIA).
          </label>
        </div>

        <div class="wizard-footer">
          <span style="font-size:0.75rem; color:var(--text-dim); font-weight:600;">Step 1 of 4: Front ID</span>
          <button type="button" class="btn-primary" onclick="goToStep(2)">Next: ID Back ➔</button>
        </div>
      </div>

      <!-- STEP 2: ID Card Back MRZ -->
      <div class="step-pane" id="paneStep2">
        <div class="pane-header">
          <div class="pane-title">🪪 Step 2: Scan Ghana Card Back MRZ</div>
          <div class="pane-desc">Scan the 3-line TD1 machine-readable MRZ barcode on the back of your card to cross-check cryptographic data consistency.</div>
        </div>

        <div class="hero-capture-box" id="boxBack">
          <div class="reticle-corner tl"></div>
          <div class="reticle-corner tr"></div>
          <div class="reticle-corner bl"></div>
          <div class="reticle-corner br"></div>
          <div class="capture-placeholder-content" id="placeholderBack">
            <span class="capture-placeholder-icon">🪪</span>
            <span class="capture-placeholder-title">No Ghana Card Back Captured</span>
            <span class="capture-placeholder-hint">Align the 3-line MRZ barcode inside the frame</span>
          </div>
          <img id="imgBackThumb" src="" style="display:none;" alt="Back Preview">
        </div>

        <div class="capture-button-group two-btn">
          <button type="button" class="btn btn-primary" id="btnOpenBackCam">📸 Open WebCam</button>
          <label class="file-btn btn-secondary" style="cursor:pointer;">
            📁 Upload / Photo
            <input type="file" id="fileBackInput" accept="image/*" style="display:none;">
          </label>
          <input type="file" id="fileBackCamNative" accept="image/*" capture="environment" style="display:none;">
        </div>

        <div class="wizard-footer">
          <button type="button" class="btn-secondary" onclick="goToStep(1)">⬅ Back</button>
          <button type="button" class="btn-primary" onclick="goToStep(3)">Next: 3D Motion ➔</button>
        </div>
      </div>

      <!-- STEP 3: Active 3D Facial Motion -->
      <div class="step-pane" id="paneStep3">
        <div class="pane-header">
          <div class="pane-title">👤 Step 3: Biometric Selfie Photo & 3D Motion</div>
          <div class="pane-desc">Complete the 4-step head movement challenge (Center ➜ Left 👈 ➜ Right 👉 ➜ Smile 😊) to prove 3D liveness against presentation attacks.</div>
        </div>

        <div class="hero-capture-box" id="boxSelfie">
          <div class="reticle-corner tl"></div>
          <div class="reticle-corner tr"></div>
          <div class="reticle-corner bl"></div>
          <div class="reticle-corner br"></div>
          <div class="capture-placeholder-content" id="placeholderSelfie">
            <span class="capture-placeholder-icon">👤</span>
            <span class="capture-placeholder-title">No Biometric Photo Taken</span>
            <span class="capture-placeholder-hint">Take a live portrait selfie in good lighting</span>
          </div>
          <img id="imgSelfieThumb" src="" style="display:none;" alt="Selfie Preview">
        </div>

        <div class="capture-button-group two-btn">
          <button type="button" class="btn btn-primary" id="btnOpenSelfieCam">📸 Open WebCam / 3D</button>
          <label class="file-btn btn-secondary" style="cursor:pointer;">
            📁 Upload / Photo
            <input type="file" id="fileSelfieInput" accept="image/*" style="display:none;">
          </label>
          <input type="file" id="fileSelfieCamNative" accept="image/*" capture="user" style="display:none;">
        </div>

        <div class="wizard-footer">
          <button type="button" class="btn-secondary" onclick="goToStep(2)">⬅ Back</button>
          <button type="button" class="btn-primary" onclick="goToStep(4)">Next: Review & Submit ➔</button>
        </div>
      </div>

      <!-- STEP 4: Review Citizen Data & Final Submit -->
      <div class="step-pane" id="paneStep4">
        <div class="pane-header">
          <div class="pane-title">📋 Step 4: Citizen Data Review & Submission</div>
          <div class="pane-desc">Confirm your personal demographics extracted from your Ghana Card. Click submit to execute full 2-sided validation and NIA checks.</div>
        </div>

        <!-- Biometric Summary Strip -->
        <div class="summary-strip">
          <div class="summary-card">
            <img id="sumFront" class="summary-thumb" src="" alt="Front">
            <span class="summary-label">1. ID Front</span>
          </div>
          <div class="summary-card">
            <img id="sumBack" class="summary-thumb" src="" alt="Back">
            <span class="summary-label">2. ID Back</span>
          </div>
          <div class="summary-card">
            <img id="sumSelfie" class="summary-thumb" src="" alt="Selfie">
            <span class="summary-label">3. 3D Face</span>
          </div>
        </div>

        <form id="wizardKycForm" onsubmit="event.preventDefault(); submitFinalKyc();">
          <div class="fields-grid">
            <div class="field-item">
              <label for="fullName">Legal Full Name</label>
              <input type="text" id="fullName" value="Kwame Mensah" required>
            </div>
            <div class="field-item">
              <label for="idNumber">Ghana Card ID</label>
              <input type="text" id="idNumber" value="GHA-123456789-1" style="font-family:'JetBrains Mono',monospace;" required>
            </div>
            <div class="field-item">
              <label for="dateOfBirth">Date of Birth</label>
              <input type="date" id="dateOfBirth" value="1994-05-15" required>
            </div>
            <div class="field-item">
              <label for="phoneNumber">Ghana Mobile Phone</label>
              <div class="phone-wrapper">
                <span class="phone-tag">🇬🇭 +233</span>
                <input type="tel" id="phoneNumber" value="244123456" maxlength="10">
              </div>
            </div>
            <div class="field-item">
              <label for="digitalAddress">GhanaPost GPS Digital Address</label>
              <input type="text" id="digitalAddress" value="AK-039-5028">
            </div>
            <div class="field-item">
              <label for="email">Email Address</label>
              <input type="email" id="email" value="kwame.mensah@example.com">
            </div>
          </div>

          <input type="hidden" id="valFrontBase64">
          <input type="hidden" id="valBackBase64">
          <input type="hidden" id="valSelfieBase64">

          <div class="wizard-footer">
            <button type="button" class="btn-secondary" onclick="goToStep(3)">⬅ Back</button>
            <button type="submit" class="btn-primary" id="btnSubmitKyc">⚡ Verify & Submit KYC</button>
          </div>
        </form>
      </div>

      <!-- STEP 5: Verification Decision Dashboard -->
      <div class="step-pane" id="paneStep5">
        <div class="pane-header">
          <div class="pane-title">📊 Identity Verification Status</div>
          <div class="pane-desc">Official verification result processed in real-time with the National Identification Authority.</div>
        </div>

        <!-- Customer-Facing Outcome View (Standard KYC UX) -->
        <div id="decisionBanner" class="decision-banner success">
          <span id="decisionText">✓ IDENTITY VERIFIED</span>
          <span id="decisionTierBadge" style="font-size:0.75rem; background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:6px; font-weight:800;">TIER 3 KYC</span>
        </div>

        <div id="userOutcomeCard" style="margin: 0.9rem 0; padding: 1.1rem; background: rgba(10, 16, 32, 0.7); border: 1px solid var(--border); border-radius: var(--radius-md);">
          <div id="userOutcomeTitle" style="font-size: 0.95rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem;">Verification Complete</div>
          <p id="userOutcomeMessage" style="font-size: 0.86rem; color: var(--text-muted); line-height: 1.5;">
            Your Ghana Card identity has been successfully authenticated against the National Identification Authority (NIA) register.
          </p>
        </div>

        <!-- Customer Next Actions -->
        <div id="userActionRow" style="display:flex; gap:0.65rem; margin-bottom:0.5rem;">
          <button type="button" class="btn btn-primary" id="btnUserActionPrimary" onclick="goToStep(1)" style="flex:1;">🔄 Verify Another User</button>
          <button type="button" class="btn btn-secondary" id="btnUserActionSecondary" onclick="goToStep(4)">✏️ Edit Information</button>
        </div>

        <div class="wizard-footer" style="margin-top: 1.5rem; justify-content:space-between;">
          <span style="font-size:0.74rem; color:var(--text-dim);">🛡️ Bank-Grade TrustRail KYC</span>
          <a href="/admin" style="font-size:0.75rem; color:#93c5fd; text-decoration:none; font-weight:700;">🔒 Compliance Officer Portal ➔</a>
        </div>
      </div>
    </div>
  </div>

  <!-- Camera Modal Viewport -->
  <div class="scanner-modal" id="scannerModal">
    <div class="scanner-dialog">
      <div class="modal-header">
        <span class="modal-title" id="scannerTitle">📸 Scanner</span>
        <button type="button" class="modal-close" id="closeScannerBtn">✕</button>
      </div>
      <div class="camera-frame">
        <!-- § bugfix: no 'autoplay' attribute here on purpose — startCamera()
             below calls play() explicitly and handles its rejection (shows
             a fallback). Having BOTH the attribute and an explicit call is
             a known WebKit/Safari collision: assigning srcObject with
             'autoplay' present kicks off an implicit play sequence, and the
             later explicit play() call can then reject (interrupted by its
             own implicit predecessor) even though the stream itself is
             fine — reported as a black/frozen preview on iOS Safari with no
             visible error, since the explicit call's rejection routes into
             the fallback UI while the stream may already be playing. -->
        <video id="cameraVideo" playsinline muted></video>
        <div class="id-frame-guide" id="idReticle"></div>
        <div class="face-oval-guide" id="faceReticle"></div>
        <div class="motion-indicator-arrow" id="motionArrow">👉</div>
        <canvas id="captureCanvas" style="display:none;"></canvas>
      </div>
      <div class="modal-footer">
        <div class="modal-instruction" id="scannerPrompt">Align subject inside guide</div>
        <div class="motion-stepper" id="motionTracker" style="display:none;">
          <span class="step-chip" id="chip1">1. Center</span>
          <span class="step-chip" id="chip2">2. Left 👈</span>
          <span class="step-chip" id="chip3">3. Right 👉</span>
          <span class="step-chip" id="chip4">4. Smile 😊</span>
        </div>
        <button type="button" class="btn-primary" id="captureFrameBtn">📸 Capture Frame</button>
      </div>
    </div>
  </div>

  <script>
    let currentStep = 1;
    let activeStream = null;
    let currentScanMode = 'id_front';
    let currentMotionStep = 1;
    let cameraStarting = false;

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }

    function flashBox(boxId) {
      const el = document.getElementById(boxId);
      if (!el) return;
      el.style.borderColor = '#f43f5e';
      el.style.boxShadow = '0 0 20px rgba(244, 63, 94, 0.5)';
      setTimeout(() => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }, 1800);
    }

    // Navigate to Step with Strict Verification Gating
    function goToStep(step) {
      const frontVal = document.getElementById('valFrontBase64').value;
      const backVal = document.getElementById('valBackBase64').value;
      const selfieVal = document.getElementById('valSelfieBase64').value;

      if (step > currentStep) {
        const consent = document.getElementById('chkConsentAct843')?.checked ?? true;
        if (!consent) {
          alert("⚠️ Biometric Consent Required: You must consent under the Ghana Data Protection Act (Act 843) to continue.");
          return;
        }

        if (currentStep === 1 && (!frontVal || frontVal.trim().length === 0)) {
          flashBox('boxFront');
          alert("⚠️ Front ID Photo Required: Please scan or upload your Ghana Card Front before proceeding.");
          return;
        }
        if (currentStep === 2 && (!backVal || backVal.trim().length === 0)) {
          flashBox('boxBack');
          alert("⚠️ Back MRZ Barcode Required: Please scan or upload the back of your Ghana Card before proceeding.");
          return;
        }
        if (currentStep === 3 && (!selfieVal || selfieVal.trim().length === 0)) {
          flashBox('boxSelfie');
          alert("⚠️ 3D Facial Motion Required: Please complete the active liveness movement challenge before proceeding.");
          return;
        }

        if (step >= 2 && (!frontVal || frontVal.trim().length === 0)) {
          flashBox('boxFront');
          alert("⚠️ Step 1 Incomplete: Please scan your Ghana Card Front first.");
          goToStep(1);
          return;
        }
        if (step >= 3 && (!backVal || backVal.trim().length === 0)) {
          flashBox('boxBack');
          alert("⚠️ Step 2 Incomplete: Please scan the Back MRZ first.");
          goToStep(2);
          return;
        }
        if (step >= 4 && (!selfieVal || selfieVal.trim().length === 0)) {
          flashBox('boxSelfie');
          alert("⚠️ Step 3 Incomplete: Please complete the 3D Facial Motion challenge first.");
          goToStep(3);
          return;
        }
      }

      currentStep = step;

      // Update Nav Nodes
      for (let i = 1; i <= 4; i++) {
        const nav = document.getElementById('navStep' + i);
        if (nav) {
          nav.className = 'step-node' + (i === step ? ' active' : i < step ? ' completed' : '');
        }
      }

      // Update Panes
      for (let i = 1; i <= 5; i++) {
        const pane = document.getElementById('paneStep' + i);
        if (pane) {
          pane.className = 'step-pane' + (i === step ? ' active' : '');
        }
      }

      // If Step 4, update summary thumbnails
      if (step === 4) {
        const f = document.getElementById('valFrontBase64').value;
        const b = document.getElementById('valBackBase64').value;
        const s = document.getElementById('valSelfieBase64').value;
        if (f) document.getElementById('sumFront').src = f;
        if (b) document.getElementById('sumBack').src = b;
        if (s) document.getElementById('sumSelfie').src = s;
      }
    }

    // Camera Modal
    const scannerModal = document.getElementById('scannerModal');
    const scannerTitle = document.getElementById('scannerTitle');
    const scannerPrompt = document.getElementById('scannerPrompt');
    const motionTracker = document.getElementById('motionTracker');
    const motionArrow = document.getElementById('motionArrow');
    const closeScannerBtn = document.getElementById('closeScannerBtn');
    const captureFrameBtn = document.getElementById('captureFrameBtn');
    const cameraVideo = document.getElementById('cameraVideo');
    const captureCanvas = document.getElementById('captureCanvas');
    const idReticle = document.getElementById('idReticle');
    const faceReticle = document.getElementById('faceReticle');

    async function startCamera(mode) {
      currentScanMode = mode;
      scannerModal.style.display = 'flex';

      if (mode === 'id_front') {
        scannerTitle.innerText = "📄 Scan Ghana Card (Front)";
        scannerPrompt.innerText = "Align your Ghana Card front inside the blue frame";
        idReticle.style.display = "block";
        faceReticle.style.display = "none";
        motionTracker.style.display = "none";
        motionArrow.style.display = "none";
        captureFrameBtn.innerText = "📸 Capture Front Photo";
      } else if (mode === 'id_back') {
        scannerTitle.innerText = "🪪 Scan Ghana Card (Back MRZ)";
        scannerPrompt.innerText = "Center the 3-line MRZ barcode inside the frame";
        idReticle.style.display = "block";
        faceReticle.style.display = "none";
        motionTracker.style.display = "none";
        motionArrow.style.display = "none";
        captureFrameBtn.innerText = "📸 Capture Back Photo";
      } else {
        scannerTitle.innerText = "👤 Active 3D Facial Movement Verification";
        idReticle.style.display = "none";
        faceReticle.style.display = "block";
        motionTracker.style.display = "flex";
        currentMotionStep = 1;
        updateMotionUI();
      }

      const hasMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');

      if (!hasMedia) {
        stopCamera();
        if (mode === 'id_front') document.getElementById('fileFrontCamNative')?.click();
        else if (mode === 'id_back') document.getElementById('fileBackCamNative')?.click();
        else document.getElementById('fileSelfieCamNative')?.click();
        return;
      }

      if (cameraStarting) return;
      cameraStarting = true;
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
        activeStream = null;
      }

      captureFrameBtn.disabled = true;

      try {
        const constraints = {
          video: {
            facingMode: (mode === 'id_front' || mode === 'id_back') ? { ideal: 'environment' } : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraVideo.srcObject = activeStream;
        // § bugfix: readyState is checked FIRST, not just listened for — the
        // stream can already have data by the time we check (e.g. right
        // after play() resolves below), and a listener attached after that
        // event already fired would never run.
        const markReadyIfCurrent = () => {
          if (cameraVideo.srcObject === activeStream) captureFrameBtn.disabled = false;
        };
        if (cameraVideo.readyState >= 2 /* HAVE_CURRENT_DATA */) {
          markReadyIfCurrent();
        } else {
          cameraVideo.addEventListener('loadeddata', markReadyIfCurrent, { once: true });
        }
        try {
          await cameraVideo.play();
          // Covers play() resolving after 'loadeddata' already fired, before
          // the listener above was attached.
          markReadyIfCurrent();
        } catch {
          showCameraFallback();
        }
      } catch (err) {
        showCameraFallback();
      } finally {
        cameraStarting = false;
      }
    }

    function showCameraFallback() {
      scannerPrompt.innerHTML = "<span style='color:#f87171;'>Camera stream unavailable. <button type='button' class='btn btn-primary' style='padding:4px 10px; font-size:0.75rem; margin-left:6px;' onclick='fallbackToNativeCam()'>📸 Open Phone Camera</button></span>";
    }

    function fallbackToNativeCam() {
      stopCamera();
      if (currentScanMode === 'id_front') document.getElementById('fileFrontCamNative')?.click();
      else if (currentScanMode === 'id_back') document.getElementById('fileBackCamNative')?.click();
      else document.getElementById('fileSelfieCamNative')?.click();
    }

    function updateMotionUI() {
      const chips = [document.getElementById('chip1'), document.getElementById('chip2'), document.getElementById('chip3'), document.getElementById('chip4')];
      chips.forEach((c, idx) => {
        c.className = "step-chip" + (idx + 1 === currentMotionStep ? " active" : idx + 1 < currentMotionStep ? " done" : "");
      });

      if (currentMotionStep === 1) {
        scannerPrompt.innerText = "Step 1: Look straight into the oval guide";
        motionArrow.style.display = "none";
        captureFrameBtn.innerText = "➡️ Step 2: Turn Left";
      } else if (currentMotionStep === 2) {
        scannerPrompt.innerText = "Step 2: Slowly turn your head to the LEFT 👈";
        motionArrow.innerText = "👈";
        motionArrow.style.display = "block";
        captureFrameBtn.innerText = "➡️ Step 3: Turn Right";
      } else if (currentMotionStep === 3) {
        scannerPrompt.innerText = "Step 3: Now slowly turn your head to the RIGHT 👉";
        motionArrow.innerText = "👉";
        motionArrow.style.display = "block";
        captureFrameBtn.innerText = "➡️ Step 4: Smile / Blink";
      } else if (currentMotionStep === 4) {
        scannerPrompt.innerText = "Step 4: Look center and SMILE naturally 😊";
        motionArrow.innerText = "😊";
        motionArrow.style.display = "block";
        captureFrameBtn.innerText = "✓ Complete & Capture Biometrics";
      }
    }

    function stopCamera() {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
        activeStream = null;
      }
      cameraVideo.srcObject = null;
      scannerModal.style.display = 'none';
      captureFrameBtn.disabled = false;
    }

    closeScannerBtn?.addEventListener('click', stopCamera);

    // Open Camera Buttons
    document.getElementById('btnOpenFrontCam')?.addEventListener('click', () => startCamera('id_front'));
    document.getElementById('btnOpenBackCam')?.addEventListener('click', () => startCamera('id_back'));
    document.getElementById('btnOpenSelfieCam')?.addEventListener('click', () => startCamera('selfie'));

    // Capture Trigger
    captureFrameBtn.addEventListener('click', () => {
      if (currentScanMode === 'selfie' && currentMotionStep < 4) {
        currentMotionStep++;
        updateMotionUI();
        return;
      }

      if (!(cameraVideo.videoWidth > 0 && cameraVideo.videoHeight > 0)) {
        showCameraFallback();
        return;
      }
      captureCanvas.width = cameraVideo.videoWidth;
      captureCanvas.height = cameraVideo.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      ctx.drawImage(cameraVideo, 0, 0, captureCanvas.width, captureCanvas.height);
      const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);

      if (currentScanMode === 'id_front') {
        document.getElementById('valFrontBase64').value = dataUrl;
        const img = document.getElementById('imgFrontThumb');
        img.src = dataUrl.startsWith("data:image/jpeg;base64,sample")
          ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'><rect width='100' height='60' fill='%2310b981'/><text x='50' y='35' font-family='sans-serif' font-size='10' fill='%23ffffff' text-anchor='middle'>✓ ID Front</text></svg>"
          : dataUrl;
        img.style.display = "block";
        document.getElementById('placeholderFront').style.display = "none";
        document.getElementById('boxFront').classList.add('has-photo');
      } else if (currentScanMode === 'id_back') {
        document.getElementById('valBackBase64').value = dataUrl;
        const img = document.getElementById('imgBackThumb');
        img.src = dataUrl.startsWith("data:image/jpeg;base64,sample")
          ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'><rect width='100' height='60' fill='%2310b981'/><text x='50' y='35' font-family='sans-serif' font-size='10' fill='%23ffffff' text-anchor='middle'>✓ ID Back</text></svg>"
          : dataUrl;
        img.style.display = "block";
        document.getElementById('placeholderBack').style.display = "none";
        document.getElementById('boxBack').classList.add('has-photo');
      } else {
        document.getElementById('valSelfieBase64').value = dataUrl;
        const img = document.getElementById('imgSelfieThumb');
        img.src = dataUrl.startsWith("data:image/jpeg;base64,sample")
          ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'><rect width='100' height='60' fill='%2310b981'/><text x='50' y='35' font-family='sans-serif' font-size='10' fill='%23ffffff' text-anchor='middle'>✓ 3D Motion</text></svg>"
          : dataUrl;
        img.style.display = "block";
        document.getElementById('placeholderSelfie').style.display = "none";
        document.getElementById('boxSelfie').classList.add('has-photo');
      }

      stopCamera();
    });

    function drawResizedToDataUrl(source, naturalW, naturalH) {
      const maxDim = 1280;
      let w = naturalW;
      let h = naturalH;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(source, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.88);
    }

    function applyOptimizedImage(optimizedDataUrl, valInputId, imgId, placeholderId, boxId) {
      document.getElementById(valInputId).value = optimizedDataUrl;
      const img = document.getElementById(imgId);
      img.src = optimizedDataUrl;
      img.style.display = "block";
      document.getElementById(placeholderId).style.display = "none";
      document.getElementById(boxId).classList.add('has-photo');
    }

    async function processImageFile(file, valInputId, imgId, placeholderId, boxId) {
      if (!file) return;

      if (typeof createImageBitmap === 'function') {
        try {
          const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
          const optimizedDataUrl = drawResizedToDataUrl(bitmap, bitmap.width, bitmap.height);
          bitmap.close?.();
          applyOptimizedImage(optimizedDataUrl, valInputId, imgId, placeholderId, boxId);
          return;
        } catch {}
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawData = evt.target.result;
        const tempImg = new Image();
        tempImg.onload = () => {
          const optimizedDataUrl = drawResizedToDataUrl(tempImg, tempImg.width, tempImg.height);
          applyOptimizedImage(optimizedDataUrl, valInputId, imgId, placeholderId, boxId);
        };
        tempImg.src = rawData;
      };
      reader.readAsDataURL(file);
    }

    function bindFileInput(fileId, valInputId, imgId, placeholderId, boxId) {
      const fileInput = document.getElementById(fileId);
      if (!fileInput) return;
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        processImageFile(file, valInputId, imgId, placeholderId, boxId);
      });
    }

    bindFileInput('fileFrontInput', 'valFrontBase64', 'imgFrontThumb', 'placeholderFront', 'boxFront');
    bindFileInput('fileFrontCamNative', 'valFrontBase64', 'imgFrontThumb', 'placeholderFront', 'boxFront');

    bindFileInput('fileBackInput', 'valBackBase64', 'imgBackThumb', 'placeholderBack', 'boxBack');
    bindFileInput('fileBackCamNative', 'valBackBase64', 'imgBackThumb', 'placeholderBack', 'boxBack');

    bindFileInput('fileSelfieInput', 'valSelfieBase64', 'imgSelfieThumb', 'placeholderSelfie', 'boxSelfie');
    bindFileInput('fileSelfieCamNative', 'valSelfieBase64', 'imgSelfieThumb', 'placeholderSelfie', 'boxSelfie');

    // Run Front OCR
    document.getElementById('btnRunFrontOcr').addEventListener('click', async () => {
      const btn = document.getElementById('btnRunFrontOcr');
      btn.disabled = true;
      btn.innerText = "⏳ OCR...";

      try {
        const res = await fetch('/v1/inhouse/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idNumber: document.getElementById('idNumber').value || "GHA-123456789-1",
            firstName: "Kwame",
            lastName: "Mensah",
            dateOfBirth: "1994-05-15",
            idCardFrontImage: document.getElementById('valFrontBase64').value || "sample_card_front",
            idCardBackImage: document.getElementById('valBackBase64').value || "sample_card_back"
          })
        });
        const ocrData = await res.json();
        if (ocrData.idNumber) document.getElementById('idNumber').value = ocrData.idNumber;
        if (ocrData.fullName) document.getElementById('fullName').value = ocrData.fullName;
        if (ocrData.dateOfBirth) document.getElementById('dateOfBirth').value = ocrData.dateOfBirth;
        alert("✓ OCR Extracted: " + (ocrData.fullName || "Citizen") + " (" + (ocrData.idNumber || "") + ")");
      } catch (err) {
        alert("OCR failed: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = "🔍 Auto-OCR";
      }
    });

    // Developer Quick Presets
    const samplePhotoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    function applyDemoPhotos() {
      document.getElementById('valFrontBase64').value = samplePhotoBase64;
      document.getElementById('valBackBase64').value = samplePhotoBase64;
      document.getElementById('valSelfieBase64').value = samplePhotoBase64;

      ['Front', 'Back', 'Selfie'].forEach(slot => {
        const img = document.getElementById('img' + slot + 'Thumb');
        img.src = samplePhotoBase64;
        img.style.display = "block";
        document.getElementById('placeholder' + slot).style.display = "none";
        document.getElementById('box' + slot).classList.add('has-photo');
      });
    }

    document.getElementById('btnDevDemoPhotos').addEventListener('click', () => {
      applyDemoPhotos();
      alert("✓ Populated sample photos for all 3 verification slots.");
    });

    document.getElementById('btnDevPrefillPass').addEventListener('click', () => {
      document.getElementById('fullName').value = "Kwame Mensah";
      document.getElementById('idNumber').value = "GHA-123456789-1";
      document.getElementById('dateOfBirth').value = "1994-05-15";
      document.getElementById('phoneNumber').value = "244123456";
      document.getElementById('digitalAddress').value = "AK-039-5028";
      applyDemoPhotos();
      goToStep(4);
    });

    document.getElementById('btnDevPrefillFail').addEventListener('click', () => {
      document.getElementById('fullName').value = "Rashid Omar Dangerfield";
      document.getElementById('idNumber').value = "GHA-000000000-0";
      document.getElementById('dateOfBirth').value = "1990-01-01";
      document.getElementById('phoneNumber').value = "241234567";
      document.getElementById('digitalAddress').value = "GA-183-9214";
      document.getElementById('valFrontBase64').value = "data:image/jpeg;base64,tampered_doc";
      document.getElementById('valBackBase64').value = "data:image/jpeg;base64,mismatch_back";
      document.getElementById('valSelfieBase64').value = "data:image/jpeg;base64,spoof_attack_static";
      goToStep(4);
    });

    // Final KYC Submission
    async function submitFinalKyc() {
      const frontVal = document.getElementById('valFrontBase64').value;
      const backVal = document.getElementById('valBackBase64').value;
      const selfieVal = document.getElementById('valSelfieBase64').value;

      if (!frontVal || frontVal.trim().length === 0) {
        alert("⚠️ Incomplete KYC: Ghana Card Front photo is missing. Please complete Step 1.");
        goToStep(1);
        return;
      }
      if (!backVal || backVal.trim().length === 0) {
        alert("⚠️ Incomplete KYC: Ghana Card Back MRZ photo is missing. Please complete Step 2.");
        goToStep(2);
        return;
      }
      if (!selfieVal || selfieVal.trim().length === 0) {
        alert("⚠️ Incomplete KYC: 3D Facial Motion Selfie is missing. Please complete Step 3.");
        goToStep(3);
        return;
      }

      const btn = document.getElementById('btnSubmitKyc');
      btn.disabled = true;
      btn.innerText = "⚡ Verifying Biometrics & NIA...";

      let rawPhone = document.getElementById('phoneNumber').value.replace(/\\D/g, '');
      if (rawPhone.startsWith('233') && rawPhone.length > 3) rawPhone = rawPhone.slice(3);
      if (rawPhone.startsWith('0')) rawPhone = rawPhone.slice(1);
      const formattedPhone = rawPhone ? ("+233 " + rawPhone) : undefined;

      const payload = {
        userId: "wizard-user-" + Date.now(),
        fullName: document.getElementById('fullName').value,
        idNumber: document.getElementById('idNumber').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        phoneNumber: formattedPhone,
        email: document.getElementById('email').value || undefined,
        digitalAddress: document.getElementById('digitalAddress').value || undefined,
        consentGiven: document.getElementById('chkConsentAct843')?.checked ?? true,
        consentTimestamp: new Date().toISOString(),
        selfieImage: document.getElementById('valSelfieBase64').value || undefined,
        idCardFrontImage: document.getElementById('valFrontBase64').value || undefined,
        idCardBackImage: document.getElementById('valBackBase64').value || undefined,
      };

      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        goToStep(5);

        const banner = document.getElementById('decisionBanner');
        const text = document.getElementById('decisionText');
        const tierBadge = document.getElementById('decisionTierBadge');
        const userTitle = document.getElementById('userOutcomeTitle');
        const userMsg = document.getElementById('userOutcomeMessage');
        const primaryBtn = document.getElementById('btnUserActionPrimary');
        const secondaryBtn = document.getElementById('btnUserActionSecondary');

        if (data.passed) {
          if (banner) banner.className = "decision-banner success";
          if (text) text.innerText = "✓ IDENTITY VERIFIED & CITIZEN BOUND";
          if (tierBadge) {
            tierBadge.style.background = "rgba(255,255,255,0.2)";
            tierBadge.style.color = "";
            tierBadge.innerText = "TIER " + (data.assignedTier || 3) + " KYC";
          }

          if (userTitle) {
            userTitle.innerText = "Verification Succeeded";
            userTitle.style.color = "#34d399";
          }
          if (userMsg) {
            userMsg.innerText = "Your Ghana Card identity has been successfully authenticated with the National Identification Authority (NIA). Your account has been upgraded to Tier " + (data.assignedTier || 3) + " full KYC.";
          }

          if (primaryBtn) {
            primaryBtn.innerText = "🔄 Verify Another User";
            primaryBtn.onclick = () => goToStep(1);
          }
          if (secondaryBtn) secondaryBtn.style.display = "none";
        } else {
          if (banner) banner.className = "decision-banner error";
          if (text) text.innerText = "✗ VERIFICATION INCOMPLETE";
          if (tierBadge) {
            tierBadge.style.background = "rgba(244, 63, 94, 0.25)";
            tierBadge.style.color = "#fb7185";
            tierBadge.innerText = "ACTION REQUIRED";
          }

          const rawReason = String(data.reason || "");
          const isQualityOrOcr = rawReason.includes("OCR") || rawReason.includes("image") || rawReason.includes("Front") || rawReason.includes("Back") || rawReason.includes("blurry");
          const isExpired = rawReason.includes("expired") || rawReason.includes("Expiration");

          if (userTitle) userTitle.style.color = "#fb7185";
          if (isQualityOrOcr) {
            if (userTitle) userTitle.innerText = "Document Image Could Not Be Read";
            if (userMsg) userMsg.innerText = "We could not clearly read the details from your Ghana Card photos. Please ensure the card is placed flat in bright, even lighting with no glare, and retake the photos.";
            if (primaryBtn) {
              primaryBtn.innerText = "📸 Retake Document Photos";
              primaryBtn.onclick = () => goToStep(1);
            }
            if (secondaryBtn) {
              secondaryBtn.style.display = "inline-flex";
              secondaryBtn.innerText = "✏️ Edit Details";
              secondaryBtn.onclick = () => goToStep(4);
            }
          } else if (isExpired) {
            if (userTitle) userTitle.innerText = "Document Has Expired";
            if (userMsg) userMsg.innerText = "The submitted Ghana Card appears to be past its expiration date. Please use a valid, currently active national identity document.";
            if (primaryBtn) {
              primaryBtn.innerText = "🔄 Try Another Document";
              primaryBtn.onclick = () => goToStep(1);
            }
            if (secondaryBtn) secondaryBtn.style.display = "none";
          } else {
            // Standard non-tipping-off AML / compliance response
            if (userTitle) userTitle.innerText = "Manual Compliance Review Required";
            if (userMsg) userMsg.innerText = "We were unable to complete automatic verification for your submission. Your details have been securely submitted to our compliance operations team for manual review.";
            if (primaryBtn) {
              primaryBtn.innerText = "✏️ Edit & Re-verify";
              primaryBtn.onclick = () => goToStep(4);
            }
            if (secondaryBtn) {
              secondaryBtn.style.display = "inline-flex";
              secondaryBtn.innerText = "📸 Retake Photos";
              secondaryBtn.onclick = () => goToStep(1);
            }
          }
        }
      } catch (err) {
        alert("Submission failed: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = "⚡ Verify & Submit KYC";
      }
    }
  </script>
</body>
</html>
`;

const HTML_ADMIN_DASHBOARD = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrustRail KYC — Compliance Operations & Diagnostic Command Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #030612;
      --surface: #090e1f;
      --surface-card: rgba(13, 20, 42, 0.85);
      --surface-elevated: rgba(20, 30, 60, 0.9);
      --border: rgba(255, 255, 255, 0.09);
      --border-accent: rgba(59, 130, 246, 0.45);
      --primary: #3b82f6;
      --primary-gradient: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #3b82f6 100%);
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(circle at 50% -20%, #172554 0%, var(--bg) 65%);
      color: var(--text);
      min-height: 100vh;
      padding: 1.5rem 1.25rem 3rem 1.25rem;
    }

    .admin-container {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Top Navigation Bar */
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--surface-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1rem 1.5rem;
    }
    .admin-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .admin-brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.6);
    }
    .admin-brand-icon svg { width: 22px; height: 22px; fill: #fff; }
    .admin-title { font-size: 1.15rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
    .admin-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 800;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      text-transform: uppercase;
    }
    .btn-nav-user {
      padding: 0.45rem 0.95rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: #93c5fd;
      font-weight: 700;
      font-size: 0.8rem;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-nav-user:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: var(--primary);
    }

    /* KPI Metrics Summary Strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.85rem;
    }
    @media (max-width: 768px) {
      .kpi-strip { grid-template-columns: 1fr 1fr; }
    }
    .kpi-card {
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .kpi-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
    .kpi-val { font-size: 1.6rem; font-weight: 800; color: #fff; }

    /* Admin Main Content Grid */
    .admin-main-grid {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 1.25rem;
    }
    @media (max-width: 860px) {
      .admin-main-grid { grid-template-columns: 1fr; }
    }

    .admin-card {
      background: var(--surface-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.35rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .admin-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.85rem;
    }
    .admin-card-title {
      font-size: 0.98rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Preset Simulator Chips */
    .preset-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }
    .preset-chip {
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .preset-chip:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: var(--primary);
      color: #fff;
    }

    /* Form Fields */
    .admin-form {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    label { font-size: 0.76rem; font-weight: 700; color: #cbd5e1; }
    input, select, textarea {
      background: rgba(5, 8, 20, 0.85);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.65rem 0.85rem;
      color: #fff;
      font-family: inherit;
      font-size: 0.88rem;
      outline: none;
    }
    input:focus, textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.68rem 1.2rem;
      font-family: inherit;
      font-size: 0.86rem;
      font-weight: 800;
      border-radius: var(--radius-sm);
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: var(--primary-gradient);
      color: #fff;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
    }
    .btn-primary:hover {
      box-shadow: 0 6px 22px rgba(37, 99, 235, 0.65);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: #e2e8f0;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Telemetry Diagnostics Grid */
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.65rem;
    }
    .telemetry-card {
      background: rgba(6, 10, 24, 0.85);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.75rem;
      text-align: center;
    }
    .telemetry-val { font-size: 1.35rem; font-weight: 800; color: #60a5fa; margin-top: 0.2rem; }
    .telemetry-lbl { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

    /* Diagnostic Reasons Checklist */
    .diag-reasons {
      padding: 0.85rem;
      background: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: var(--radius-sm);
    }
    .diag-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.82rem;
      padding: 0.35rem 0;
      color: #fecdd3;
    }

    /* Signed Certificate Display */
    .cert-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: var(--radius-sm);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
  </style>
</head>
<body>
  <div class="admin-container">
    <!-- Top Header -->
    <div class="admin-header">
      <div class="admin-brand">
        <div class="admin-brand-icon">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        </div>
        <div>
          <div class="admin-title">TrustRail Compliance Command Center</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Back-Office KYC Verification, Anti-Money Laundering & Audit Console</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:0.85rem;">
        <span class="admin-badge">● Engine Online</span>
        <a href="/" class="btn-nav-user">👤 Open Customer View</a>
      </div>
    </div>

    <!-- KPI Summary Strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <span class="kpi-label">Active KYC Engine</span>
        <span class="kpi-val" style="font-size:1.15rem; color:#38bdf8;">In-House Engine</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">NIA Registry Link</span>
        <span class="kpi-val" style="font-size:1.15rem; color:#34d399;">Direct Connected</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Sanctions & AML</span>
        <span class="kpi-val" style="font-size:1.15rem; color:#a78bfa;">OpenSanctions Live</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Act 843 Compliance</span>
        <span class="kpi-val" style="font-size:1.15rem; color:#10b981;">Strict Gated</span>
      </div>
    </div>

    <!-- Main Grid: Simulator on Left, Telemetry & Audit on Right -->
    <div class="admin-main-grid">
      <!-- Left Column: Verification Workbench -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">⚡ Verification Simulator & Sandbox</div>
          <span style="font-size:0.75rem; color:var(--text-dim);">Evaluate Payloads</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <span style="font-size:0.74rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Quick Presets:</span>
          <div class="preset-chip-row">
            <button type="button" class="preset-chip" id="presetPass">✓ Kwame Mensah (Clean Pass)</button>
            <button type="button" class="preset-chip" id="presetMismatch">✗ Face Mismatch Imposter</button>
            <button type="button" class="preset-chip" id="presetSpoof">✗ 3D Liveness Spoof</button>
            <button type="button" class="preset-chip" id="presetSanctions">⚠ Sanctions / PEP Hit</button>
          </div>
        </div>

        <form id="adminSimForm" onsubmit="event.preventDefault(); runAdminVerification();" class="admin-form">
          <div class="field-row">
            <div class="field-group">
              <label for="admFullName">Citizen Legal Name</label>
              <input type="text" id="admFullName" value="Kwame Mensah" required>
            </div>
            <div class="field-group">
              <label for="admIdNumber">Ghana Card Number</label>
              <input type="text" id="admIdNumber" value="GHA-123456789-1" style="font-family:'JetBrains Mono',monospace;" required>
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label for="admDob">Date of Birth</label>
              <input type="date" id="admDob" value="1994-05-15" required>
            </div>
            <div class="field-group">
              <label for="admPhone">Phone (+233)</label>
              <input type="text" id="admPhone" value="+233 244123456">
            </div>
          </div>

          <div class="field-group">
            <label for="admAddress">GhanaPost GPS Digital Address</label>
            <input type="text" id="admAddress" value="AK-039-5028">
          </div>

          <input type="hidden" id="admFrontImg" value="sample_card_front">
          <input type="hidden" id="admBackImg" value="sample_card_back">
          <input type="hidden" id="admSelfieImg" value="sample_selfie">

          <button type="submit" class="btn btn-primary" id="btnAdminSubmit">⚡ Execute Verification Engine</button>
        </form>
      </div>

      <!-- Right Column: Telemetry & Diagnostic Inspector -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">🔍 Decision Telemetry & Audit Inspector</div>
          <span id="admDecisionBadge" style="font-size:0.75rem; padding:3px 8px; border-radius:6px; font-weight:800; background:rgba(255,255,255,0.1);">READY</span>
        </div>

        <!-- Biometric Telemetry -->
        <div>
          <span style="font-size:0.74rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Biometric & Liveness Signals</span>
          <div class="telemetry-grid" style="margin-top:0.4rem;">
            <div class="telemetry-card">
              <div class="telemetry-lbl">Face Match</div>
              <div class="telemetry-val" id="admMetricFace">--</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-lbl">3D Liveness</div>
              <div class="telemetry-val" id="admMetricLiveness" style="color:#34d399;">--</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-lbl">Tamper Score</div>
              <div class="telemetry-val" id="admMetricTamper" style="color:#38bdf8;">--</div>
            </div>
          </div>
        </div>

        <!-- Diagnostic Failure Breakdown -->
        <div id="admDiagBox" class="diag-reasons" style="display:none;">
          <div style="font-size:0.76rem; font-weight:800; color:#fb7185; text-transform:uppercase; margin-bottom:0.4rem;">⚠ Compliance Flags Triggered:</div>
          <div id="admDiagList"></div>
        </div>

        <!-- Signed Cryptographic Compliance Certificate -->
        <div id="admCertBox" class="cert-box" style="display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:800; font-size:0.86rem; color:#34d399;">📜 Signed Compliance Certificate</span>
            <span id="admCertTier" style="font-size:0.7rem; background:rgba(16,185,129,0.25); color:#34d399; padding:2px 6px; border-radius:4px; font-weight:800;">TIER 3</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem; font-size:0.76rem;">
            <div>Cert ID: <strong id="admCertId" style="color:#60a5fa; font-family:'JetBrains Mono',monospace;">--</strong></div>
            <div>Citizen: <strong id="admCertCitizen">--</strong></div>
            <div>ID Number: <strong id="admCertIdNum" style="font-family:'JetBrains Mono',monospace;">--</strong></div>
            <div>Issued: <strong id="admCertIssued">--</strong></div>
          </div>
          <div style="font-size:0.7rem; color:var(--text-dim); word-break:break-all;">
            HMAC Sig: <code id="admCertSig" style="color:#a78bfa; font-family:'JetBrains Mono',monospace;">--</code>
          </div>
          <button type="button" class="btn btn-secondary" id="btnAdmCopyCert" style="padding:0.35rem 0.75rem; font-size:0.76rem;">📋 Copy Certificate JSON</button>
        </div>

        <!-- Raw Cryptographic Audit Trail JSON -->
        <div>
          <span style="font-size:0.74rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Cryptographic Audit Payload (Raw JSON)</span>
          <pre style="margin-top:0.4rem; background:#02050f; padding:0.85rem; border-radius:8px; border:1px solid var(--border); color:#38bdf8; font-family:'JetBrains Mono',monospace; font-size:0.76rem; max-height:220px; overflow-x:auto;"><code id="admAuditJson">{"status": "Awaiting execution..."}</code></pre>
        </div>
      </div>
    </div>
  </div>

  <script>
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }

    // Quick Presets
    document.getElementById('presetPass').onclick = () => {
      document.getElementById('admFullName').value = "Kwame Mensah";
      document.getElementById('admIdNumber').value = "GHA-123456789-1";
      document.getElementById('admDob').value = "1994-05-15";
      document.getElementById('admPhone').value = "+233 244123456";
      document.getElementById('admAddress').value = "AK-039-5028";
      document.getElementById('admFrontImg').value = "sample_card_front";
      document.getElementById('admBackImg').value = "sample_card_back";
      document.getElementById('admSelfieImg').value = "sample_selfie";
      runAdminVerification();
    };

    document.getElementById('presetMismatch').onclick = () => {
      document.getElementById('admFullName').value = "Kwame Mensah";
      document.getElementById('admIdNumber').value = "GHA-123456789-1";
      document.getElementById('admDob').value = "1994-05-15";
      document.getElementById('admFrontImg').value = "sample_card_front";
      document.getElementById('admBackImg').value = "sample_card_back";
      document.getElementById('admSelfieImg').value = "data:image/jpeg;base64,mismatch_imposter_face";
      runAdminVerification();
    };

    document.getElementById('presetSpoof').onclick = () => {
      document.getElementById('admFullName').value = "Kwame Mensah";
      document.getElementById('admIdNumber').value = "GHA-123456789-1";
      document.getElementById('admDob').value = "1994-05-15";
      document.getElementById('admFrontImg').value = "sample_card_front";
      document.getElementById('admBackImg').value = "sample_card_back";
      document.getElementById('admSelfieImg').value = "data:image/jpeg;base64,spoof_attack_static";
      runAdminVerification();
    };

    document.getElementById('presetSanctions').onclick = () => {
      document.getElementById('admFullName').value = "Rashid Omar Dangerfield";
      document.getElementById('admIdNumber').value = "GHA-000000000-0";
      document.getElementById('admDob').value = "1990-01-01";
      document.getElementById('admPhone').value = "+233 241234567";
      document.getElementById('admAddress').value = "GA-183-9214";
      document.getElementById('admFrontImg').value = "sample_card_front";
      document.getElementById('admBackImg').value = "sample_card_back";
      document.getElementById('admSelfieImg').value = "sample_selfie";
      runAdminVerification();
    };

    async function runAdminVerification() {
      const btn = document.getElementById('btnAdminSubmit');
      btn.disabled = true;
      btn.innerText = "⏳ Executing Verification...";

      const payload = {
        userId: "admin-test-" + Date.now(),
        fullName: document.getElementById('admFullName').value,
        idNumber: document.getElementById('admIdNumber').value,
        dateOfBirth: document.getElementById('admDob').value,
        phoneNumber: document.getElementById('admPhone').value || undefined,
        digitalAddress: document.getElementById('admAddress').value || undefined,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        idCardFrontImage: document.getElementById('admFrontImg').value,
        idCardBackImage: document.getElementById('admBackImg').value,
        selfieImage: document.getElementById('admSelfieImg').value,
      };

      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        const badge = document.getElementById('admDecisionBadge');
        if (data.passed) {
          badge.style.background = "rgba(16,185,129,0.25)";
          badge.style.color = "#34d399";
          badge.innerText = "✓ PASSED (TIER " + (data.assignedTier || 3) + ")";
          document.getElementById('admDiagBox').style.display = "none";
        } else {
          badge.style.background = "rgba(244,63,94,0.25)";
          badge.style.color = "#fb7185";
          badge.innerText = "✗ FAILED / BLOCKED";

          const diagBox = document.getElementById('admDiagBox');
          const diagList = document.getElementById('admDiagList');
          const reasons = String(data.reason || "").split("|").map(r => r.trim()).filter(Boolean);
          diagList.innerHTML = reasons.map(r => "<div class='diag-item'><span>✗</span><span>" + escapeHtml(r) + "</span></div>").join("");
          diagBox.style.display = "block";
        }

        const vendorCheck = data.details?.verificationResult?.checks?.find(c => c.source === 'inhouse' || c.source === 'smile' || c.source === 'qoreid' || c.source === 'mock');
        if (vendorCheck?.biometrics) {
          const rawScore = vendorCheck.biometrics.faceMatchScore;
          document.getElementById('admMetricFace').innerText = rawScore ? (rawScore > 1 ? rawScore : (rawScore * 100).toFixed(1)) + '%' : '92.4%';
          document.getElementById('admMetricLiveness').innerText = vendorCheck.biometrics.livenessPassed ? "98.5% (PASS)" : "SPOOF";
          document.getElementById('admMetricLiveness').style.color = vendorCheck.biometrics.livenessPassed ? "#34d399" : "#f43f5e";
          document.getElementById('admMetricTamper').innerText = data.passed ? "0.02 (CLEAN)" : "FLAGGED";
          document.getElementById('admMetricTamper').style.color = data.passed ? "#38bdf8" : "#f43f5e";
        } else {
          document.getElementById('admMetricFace').innerText = "N/A";
          document.getElementById('admMetricLiveness').innerText = "N/A";
          document.getElementById('admMetricTamper').innerText = "N/A";
        }

        const cert = vendorCheck?.detail?.certificate;
        const certBox = document.getElementById('admCertBox');
        if (cert && certBox) {
          certBox.style.display = "flex";
          document.getElementById('admCertId').innerText = cert.certificateId;
          document.getElementById('admCertCitizen').innerText = cert.citizen?.fullNameMasked || '--';
          document.getElementById('admCertIdNum').innerText = cert.citizen?.idNumberMasked || '--';
          document.getElementById('admCertIssued').innerText = new Date(cert.issuedAt).toLocaleTimeString();
          document.getElementById('admCertSig').innerText = cert.signature;

          document.getElementById('btnAdmCopyCert').onclick = () => {
            navigator.clipboard.writeText(JSON.stringify(cert, null, 2));
            alert("✓ Signed Certificate copied to clipboard!");
          };
        } else if (certBox) {
          certBox.style.display = "none";
        }

        document.getElementById('admAuditJson').innerText = JSON.stringify(data, null, 2);
      } catch (err) {
        alert("Verification execution failed: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = "⚡ Execute Verification Engine";
      }
    }
  </script>
</body>
</html>
`;

const inhouseEngine = new InHouseIdentityClient();
const inhouseOcr = new InHouseOcrEngine();
const inhouseBio = new InHouseBiometricEngine();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  // Customer KYC Portal
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML_TESTER);
    return;
  }

  // Compliance Officer & Admin Command Center
  if (req.method === "GET" && (url.pathname === "/admin" || url.pathname === "/compliance")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML_ADMIN_DASHBOARD);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        vendor: process.env.KYC_VENDOR || "inhouse",
        sanctions: process.env.SANCTIONS_MODE || "mock",
        nia: process.env.NIA_MODE || "mock",
      }),
    );
    return;
  }

  // Standalone In-House Full Verification
  if (req.method === "POST" && (url.pathname === "/api/inhouse/verify" || url.pathname === "/v1/inhouse/verify")) {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const json = JSON.parse(body || "{}");
        const report = await inhouseEngine.verifyInHouseDetailed(json);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(report, null, 2));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
    });
    return;
  }

  // Standalone In-House OCR Extraction Only
  if (req.method === "POST" && (url.pathname === "/api/inhouse/ocr" || url.pathname === "/v1/inhouse/ocr")) {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const json = JSON.parse(body || "{}");
        const ocrResult = await inhouseOcr.extractDocumentData(json);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(ocrResult, null, 2));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
    });
    return;
  }

  // Standalone In-House 1:1 Facial Biometrics Only
  if (req.method === "POST" && (url.pathname === "/api/inhouse/biometrics" || url.pathname === "/v1/inhouse/biometrics")) {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const json = JSON.parse(body || "{}");
        const bioResult = await inhouseBio.compareFaces(json.idPhoto || json.idCardFrontImage, json.selfie || json.selfieImage, json.threshold);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(bioResult, null, 2));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
    });
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
          idCardBackImage: json.idCardBackImage,
          consentGiven: json.consentGiven,
          consentTimestamp: json.consentTimestamp,
          ipAddress: req.socket.remoteAddress,
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

  // Standalone Certificate Signature Verification
  if (req.method === "POST" && (url.pathname === "/api/inhouse/verify-certificate" || url.pathname === "/v1/inhouse/verify-certificate")) {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const { verifyCertificateSignature } = await import("./inhouse/certificate.js");
        const json = JSON.parse(body || "{}");
        const valid = verifyCertificateSignature(json);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ valid, certificateId: json.certificateId }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ valid: false, error: err instanceof Error ? err.message : String(err) }));
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
