const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTest() {
  console.log("🚀 Starting E2E Phase 1 Journey Test...");
  const uid = "test-uid-" + Date.now();
  
  // 1. Register
  console.log("1. Registration...");
  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${uid}` },
    body: JSON.stringify({ 
      email: `${uid}@example.com`,
      name: 'Test User',
      mobile: '1234567890',
      college: 'Test University',
      degree: 'BSc Computer Science',
      gradYear: 2025,
      preferredLanguage: 'JavaScript'
    })
  });
  if (!regRes.ok) throw new Error(`Registration failed: ${await regRes.text()}`);
  const regData = await regRes.json();
  console.log("   ✅ Registered.", regData);

  // 2. Fetch User Data
  console.log("2. Fetch /api/me...");
  const meRes = await fetch(`${BASE_URL}/api/me`, {
    headers: { 'Authorization': `Bearer ${uid}` }
  });
  if (!meRes.ok) throw new Error(`/api/me failed: ${await meRes.text()}`);
  const meData = await meRes.json();
  console.log("   ✅ Data recovered. Expected null session initially.", meData.activeSession);

  // 3. Confirm Consent
  console.log("3. Consent (Locking Session)...");
  const consentRes = await fetch(`${BASE_URL}/api/session/confirm-consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${uid}` },
    body: JSON.stringify({ text: 'I Agree', policyVersion: 'v1.1-strict' })
  });
  if (!consentRes.ok) throw new Error(`Consent failed: ${await consentRes.text()}`);
  const consentData = await consentRes.json();
  console.log("   ✅ Consent Recorded. Session Locked:", consentData.session.locked, "Stage:", consentData.session.currentStage);
  const sessionId = consentData.session.id;

  // 4. Try to manual advance 
  console.log("4. Testing Route Guards & Stage Lock...");
  const stageRes = await fetch(`${BASE_URL}/api/session/${sessionId}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${uid}` },
    body: JSON.stringify({ stage: 'interview_instructions', version: consentData.session.version })
  });
  if (stageRes.status === 409 || stageRes.status === 500) {
     console.log("   ✅ Correctly blocked skipping stages:", stageRes.status, await stageRes.text());
  } else {
     console.log("   ⚠️ Warning: Allowed skip?", stageRes.status, await stageRes.text());
  }

  // 5. Upload Resume (Create a valid minimal PDF)
  console.log("5. Upload Resume...");
  const fs = await import('fs');
  const minimalPDF = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >> endobj\n' +
    '4 0 obj << /Length 51 >> stream\n' +
    'BT /F1 12 Tf 100 700 Td (Hello World) Tj ET\n' +
    'endstream endobj\n' +
    'xref\n' +
    '0 5\n' +
    '0000000000 65535 f \n' +
    '0000000009 00000 n \n' +
    '0000000058 00000 n \n' +
    '0000000115 00000 n \n' +
    '0000000288 00000 n \n' +
    'trailer << /Size 5 /Root 1 0 R >>\n' +
    'startxref\n' +
    '388\n' +
    '%%EOF\n'
  );
  
  const blob = new Blob([minimalPDF], { type: 'application/pdf' });
  const form = new globalThis.FormData();
  form.append('resume', blob, 'test.pdf');
  
  const uploadRes = await fetch(`${BASE_URL}/api/session/${sessionId}/upload-resume`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${uid}` },
    body: form
  });
  let currentVersion = consentData.session.version;
  if (!uploadRes.ok) {
     console.log("   ⚠️ Resume Upload Failed:", await uploadRes.text());
  } else {
     const uploadData = await uploadRes.json();
     console.log("   ✅ Resume Uploaded & Parsed. Stage:", uploadData.session.currentStage);
     currentVersion = uploadData.session.version;
  }

  // 6. Transition to device_check
  console.log("6. Transitioning to device_check...");
  const devCheckTransRes = await fetch(`${BASE_URL}/api/session/${sessionId}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${uid}` },
    body: JSON.stringify({ stage: 'device_check', version: currentVersion })
  });
  if (!devCheckTransRes.ok) throw new Error(`Transition to device check failed: ${await devCheckTransRes.text()}`);
  const devCheckTransData = await devCheckTransRes.json();
  console.log("   ✅ Stage is now:", devCheckTransData.currentStage);
  currentVersion = devCheckTransData.version;

  // 7. Save device check status (Success path)
  console.log("7. Testing Device Check API (Success)...");
  const devCheckSaveRes = await fetch(`${BASE_URL}/api/device-check/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${uid}` },
    body: JSON.stringify({
      sessionId,
      status: 'passed',
      camera: 'granted',
      mic: 'granted',
      speaker: true,
      browser: true,
      meta: {}
    })
  });
  if (!devCheckSaveRes.ok) throw new Error(`Failed to save device check: ${await devCheckSaveRes.text()}`);
  const devCheckSaveData = await devCheckSaveRes.json();
  console.log("   ✅ Device check saved, status:", devCheckSaveData.session.deviceCheckStatus);
  
  // 8. Transition to waiting_room
  console.log("8. Transitioning to waiting_room...");
  const waitTransRes = await fetch(`${BASE_URL}/api/session/${sessionId}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${uid}` },
    body: JSON.stringify({ stage: 'waiting_room', version: currentVersion })
  });
  if (!waitTransRes.ok) throw new Error(`Transition to waiting room failed: ${await waitTransRes.text()}`);
  console.log("   ✅ Reached Waiting Room:", (await waitTransRes.json()).currentStage);

  console.log("🎉 E2E Phase 2 Device Check Flow Completed Successfully!");
}

runTest().catch(console.error);
