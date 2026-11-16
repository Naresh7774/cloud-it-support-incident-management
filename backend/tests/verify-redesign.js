const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:3000';

const results = {
  passed: 0,
  failed: 0,
};

const assert = (condition, testName, details = '') => {
  if (condition) {
    console.log(`  [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    results.passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    results.failed++;
  }
};

async function testLoginSecurityAndCodebase() {
  console.log('\n--- 1. Verifying Complete Removal of Demo Autofill & Credentials ---');

  // Check Login.jsx source code directly
  const loginSrc = fs.readFileSync(
    path.resolve(__dirname, '../../frontend/src/pages/Login.jsx'),
    'utf8'
  );

  assert(!loginSrc.includes('setDemoAccount'), 'Source Code: setDemoAccount completely removed');
  assert(!loginSrc.includes('Admin@123'), 'Source Code: Hardcoded Admin@123 password removed');
  assert(!loginSrc.includes('Engineer@123'), 'Source Code: Hardcoded Engineer@123 password removed');
  assert(!loginSrc.includes('User@123'), 'Source Code: Hardcoded User@123 password removed');
  assert(!loginSrc.includes('Quick Test Credentials'), 'Source Code: Quick Test Credentials banner removed');
  assert(loginSrc.includes('showPassword'), 'Source Code: Password show/hide eye toggle control implemented');
  assert(loginSrc.includes("const [email, setEmail] = useState('')"), 'Source Code: Email field starts empty');
  assert(loginSrc.includes("const [password, setPassword] = useState('')"), 'Source Code: Password field starts empty');

  // Check compiled frontend dist bundle
  const distDir = path.resolve(__dirname, '../../frontend/dist/assets');
  if (fs.existsSync(distDir)) {
    const jsFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.js'));
    for (const jsFile of jsFiles) {
      const code = fs.readFileSync(path.join(distDir, jsFile), 'utf8');
      assert(!code.includes('setDemoAccount'), `Dist Bundle (${jsFile}): Zero demo account autofill functions`);
    }
  }
}

async function testAuthenticationFlows() {
  console.log('\n--- 2. Testing Authentication & Role Validation ---');

  // Test invalid credentials
  const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cloudsupport.local', password: 'IncorrectPassword999!' }),
  });
  const badLoginData = await badLoginRes.json();
  assert(
    badLoginRes.status === 401 && !badLoginData.success,
    'Invalid credentials rejected with 401 Unauthorized'
  );

  // Test valid manual Admin login
  const adminRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cloudsupport.local', password: 'Admin@123' }),
  });
  const adminData = await adminRes.json();
  assert(
    adminRes.status === 200 && adminData.data.user.role === 'admin',
    'Admin authenticated manually -> role: admin from MySQL'
  );

  // Test valid manual Engineer login
  const engRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'engineer@cloudsupport.local', password: 'Engineer@123' }),
  });
  const engData = await engRes.json();
  assert(
    engRes.status === 200 && engData.data.user.role === 'engineer',
    'Engineer authenticated manually -> role: engineer from MySQL'
  );

  // Test valid manual User login
  const userRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@cloudsupport.local', password: 'User@123' }),
  });
  const userData = await userRes.json();
  assert(
    userRes.status === 200 && userData.data.user.role === 'user',
    'End User authenticated manually -> role: user from MySQL'
  );

  return {
    adminToken: adminData.data.token,
    engToken: engData.data.token,
    userToken: userData.data.token,
  };
}

async function testDatabaseDrivenDashboard(tokens) {
  console.log('\n--- 3. Verifying Admin Dashboard Live Database Data & Date Filters ---');
  const headers = { Authorization: `Bearer ${tokens.adminToken}` };

  // All time
  const allStats = await (await fetch(`${API_BASE}/dashboard/stats`, { headers })).json();
  assert(allStats.success && allStats.data.summary.total >= 0, 'Dashboard Stats: All Time returns real DB counts');

  // Today
  const todayStats = await (await fetch(`${API_BASE}/dashboard/stats?dateRange=today`, { headers })).json();
  assert(todayStats.success && typeof todayStats.data.summary.total === 'number', 'Dashboard Stats: Date Filter Today');

  // 7 Days
  const sevenStats = await (await fetch(`${API_BASE}/dashboard/stats?dateRange=7d`, { headers })).json();
  assert(sevenStats.success && typeof sevenStats.data.summary.total === 'number', 'Dashboard Stats: Date Filter 7 Days');

  // 30 Days
  const thirtyStats = await (await fetch(`${API_BASE}/dashboard/stats?dateRange=30d`, { headers })).json();
  assert(thirtyStats.success && typeof thirtyStats.data.summary.total === 'number', 'Dashboard Stats: Date Filter 30 Days');

  // Category and priority arrays exist
  assert(Array.isArray(allStats.data.byPriority), 'Real MySQL priority distribution returned');
  assert(Array.isArray(allStats.data.byCategory), 'Real MySQL category distribution returned');
}

async function testFrontendRoutes() {
  console.log('\n--- 4. Verifying All Multi-Page Routes Return 200 with Dark SPA Shell ---');
  const routes = [
    '/login',
    '/register',
    '/admin/dashboard',
    '/admin/incidents',
    '/admin/users',
    '/admin/sla',
    '/admin/analytics',
    '/admin/notifications',
    '/admin/settings',
    '/admin/profile',
    '/engineer/dashboard',
    '/engineer/assigned',
    '/engineer/unassigned',
    '/engineer/history',
    '/engineer/notifications',
    '/engineer/profile',
    '/user/dashboard',
    '/user/create-incident',
    '/user/incidents',
    '/user/notifications',
    '/user/profile',
    '/non-existent-route-404-test',
  ];

  for (const r of routes) {
    const res = await fetch(`${FRONTEND_BASE}${r}`);
    const text = await res.text();
    assert(
      res.status === 200 && text.includes('id="root"'),
      `Route ${r} direct URL / browser refresh loads 200 OK`
    );
  }
}

async function run() {
  try {
    await testLoginSecurityAndCodebase();
    const tokens = await testAuthenticationFlows();
    await testDatabaseDrivenDashboard(tokens);
    await testFrontendRoutes();

    console.log(`\n======================================================`);
    console.log(`REDESIGN VERIFICATION RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
    console.log(`======================================================\n`);

    if (results.failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

run();
