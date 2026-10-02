$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3002"
$hrUrl = "http://localhost:3001"
$candUrl = "http://localhost:3000"

Write-Host "========================================"
Write-Host "  RAVENGARD QUALITY GATE VERIFICATION"
Write-Host "========================================"
Write-Host ""

# ─── STEP 1: Admin Login (Port 3002) ───
Write-Host "[STEP 1] Admin Login on Port 3002..."
$loginBody = '{"email":"admin@ravengard.com","password":"kartik@doye#26"}'
try {
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "  PASS - Admin login successful"
    Write-Host "  Role: $($loginResp.role) | Specific: $($loginResp.specificRole)"
    Write-Host "  Admin: $($loginResp.admin.email) ($($loginResp.admin.name))"
} catch {
    Write-Host "  FAIL - Admin login failed: $($_.Exception.Message)"
    exit 1
}

$headers = @{Authorization = "Bearer $token"}

# ─── STEP 2: Persona Studio ───
Write-Host ""
Write-Host "[STEP 2] Persona Studio - GET /api/admin/studio/persona..."
try {
    $persona = Invoke-RestMethod -Uri "$baseUrl/api/admin/studio/persona" -Method Get -Headers $headers
    Write-Host "  PASS - Persona config loaded"
    Write-Host "  Name: $($persona.persona.personaName)"
    Write-Host "  Strictness: $($persona.persona.strictnessLevel)"
    Write-Host "  Interruption Policy: $($persona.persona.interruptionPolicy)"
    Write-Host "  Cadence WPM: $($persona.persona.cadenceWordsPerMinute)"
} catch {
    Write-Host "  FAIL - Persona fetch failed: $($_.Exception.Message)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "  Body: $($reader.ReadToEnd())"
}

# ─── STEP 3: FinOps Overview ───
Write-Host ""
Write-Host "[STEP 3] FinOps Overview - GET /api/admin/finops/overview..."
try {
    $finops = Invoke-RestMethod -Uri "$baseUrl/api/admin/finops/overview" -Method Get -Headers $headers
    Write-Host "  PASS - FinOps overview loaded"
    Write-Host "  Departments: $($finops.departments.Count)"
    if ($finops.departments) {
        $finops.departments | ForEach-Object { Write-Host "    - $($_.department): Cap=$($_.monthlyTokenCap) Used=$($_.tokensUsed) Status=$($_.status)" }
    }
} catch {
    Write-Host "  FAIL - FinOps fetch failed: $($_.Exception.Message)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "  Body: $($reader.ReadToEnd())"
}

# ─── STEP 4: FinOps Budget Update (Engineering, 500k cap, DEGRADE_MODEL) ───
Write-Host ""
Write-Host "[STEP 4] FinOps Budget Update - PUT /api/admin/finops/budgets/Engineering..."
$budgetBody = '{"monthlyTokenCap":500000,"hardCapAction":"DEGRADE_MODEL","softWarningThreshold":80}'
try {
    $budgetResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/finops/budgets/Engineering" -Method Put -Headers $headers -Body $budgetBody -ContentType "application/json"
    Write-Host "  PASS - Engineering budget persisted"
    Write-Host "  Action: $($budgetResp.budget.hardCapAction)"
    Write-Host "  Cap: $($budgetResp.budget.monthlyTokenCap)"
} catch {
    Write-Host "  FAIL - Budget update failed: $($_.Exception.Message)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "  Body: $($reader.ReadToEnd())"
}

# ─── STEP 5: EEOC Compliance Export ───
Write-Host ""
Write-Host "[STEP 5] Compliance Export - GET /api/admin/compliance/eeoc-export..."
try {
    $eeoc = Invoke-RestMethod -Uri "$baseUrl/api/admin/compliance/eeoc-export" -Method Get -Headers $headers
    Write-Host "  PASS - Compliance export generated"
    Write-Host "  Standards: $($eeoc.standards -join ', ')"
    if ($eeoc.sha256Seal) { Write-Host "  SHA-256 Seal: $($eeoc.sha256Seal.Substring(0,16))..." }
    if ($eeoc.totalSessions) { Write-Host "  Total Sessions: $($eeoc.totalSessions)" }
} catch {
    Write-Host "  FAIL - Compliance export failed: $($_.Exception.Message)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "  Body: $($reader.ReadToEnd())"
}

# ─── STEP 6: LLM Health ───
Write-Host ""
Write-Host "[STEP 6] LLM Health - GET /api/admin/llm-health..."
try {
    $llmHealth = Invoke-RestMethod -Uri "$baseUrl/api/admin/llm-health" -Method Get -Headers $headers
    Write-Host "  PASS - LLM health retrieved"
    Write-Host "  Gemini: $($llmHealth.providers.gemini.status)"
    Write-Host "  Groq: $($llmHealth.providers.groq.status)"
} catch {
    Write-Host "  FAIL - LLM health failed: $($_.Exception.Message)"
}

# ─── STEP 7: HR Login (Port 3001) ───
Write-Host ""
Write-Host "[STEP 7] HR Login on Port 3001..."
$hrLoginBody = '{"email":"hr@ravengard.com","password":"kartik@doye#26"}'
try {
    $hrResp = Invoke-RestMethod -Uri "$hrUrl/api/hr/login" -Method Post -Body $hrLoginBody -ContentType "application/json"
    $hrToken = $hrResp.token
    Write-Host "  PASS - HR login successful"
    Write-Host "  Role: $($hrResp.role) | Email: $($hrResp.admin.email)"
} catch {
    Write-Host "  FAIL - HR login failed: $($_.Exception.Message)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "  Body: $($reader.ReadToEnd())"
    $hrToken = $null
}

# ─── STEP 8: Candidate Registration (Port 3000) ───
Write-Host ""
Write-Host "[STEP 8] Candidate Registration on Port 3000..."
$regBody = '{"name":"Gate Test Candidate","email":"gatetime@test.com","password":"TestPass#2026","phone":"+919876543210","country":"IN"}'
try {
    $regResp = Invoke-RestMethod -Uri "$candUrl/api/candidate/register" -Method Post -Body $regBody -ContentType "application/json"
    Write-Host "  PASS - Candidate registration successful"
    if ($regResp.candidate) { Write-Host "  Candidate ID: $($regResp.candidate.id)" }
    if ($regResp.token) { Write-Host "  Token: [received]" }
} catch {
    Write-Host "  FAIL - Registration failed: $($_.Exception.Message)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $errBody = $reader.ReadToEnd()
    Write-Host "  Body: $errBody"
}

# ─── STEP 9: Public Jobs ───
Write-Host ""
Write-Host "[STEP 9] Public Jobs - GET /api/jobs..."
try {
    $jobs = Invoke-RestMethod -Uri "$candUrl/api/jobs" -Method Get
    Write-Host "  PASS - Jobs endpoint accessible"
    Write-Host "  Jobs count: $($jobs.Count)"
} catch {
    Write-Host "  FAIL - Jobs fetch failed: $($_.Exception.Message)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "  Body: $($reader.ReadToEnd())"
}

Write-Host ""
Write-Host "========================================"
Write-Host "  VERIFICATION COMPLETE"
Write-Host "========================================"
