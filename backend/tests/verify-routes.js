const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:3000';

const results = {
  passed: 0,
  failed: 0,
  routesTested: [],
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

const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return {
    token: data.data.token,
    user: data.data.user,
  };
};

async function testFrontendRoutes() {
  console.log('\n--- 1. Testing Frontend SPA Route Availability (Direct URL / Refresh) ---');
  const routes = [
    // Public
    '/login',
    '/register',
    // Admin
    '/admin/dashboard',
    '/admin/incidents',
    '/admin/incidents/1',
    '/admin/users',
    '/admin/sla',
    '/admin/analytics',
    '/admin/notifications',
    '/admin/settings',
    '/admin/profile',
    // Engineer
    '/engineer/dashboard',
    '/engineer/assigned',
    '/engineer/unassigned',
    '/engineer/incidents/1',
    '/engineer/history',
    '/engineer/notifications',
    '/engineer/profile',
    // User
    '/user/dashboard',
    '/user/create-incident',
    '/user/incidents',
    '/user/incidents/1',
    '/user/notifications',
    '/user/profile',
    // 404 fallback test
    '/some-non-existent-page',
  ];

  for (const r of routes) {
    try {
      const res = await fetch(`${FRONTEND_BASE}${r}`);
      const text = await res.text();
      assert(
        res.status === 200 && text.includes('<div id="root"></div>'),
        `Frontend Route HTTP GET ${r}`,
        `Status ${res.status}`
      );
      results.routesTested.push({ route: r, type: 'Frontend Route', status: '200 OK (SPA)' });
    } catch (err) {
      assert(false, `Frontend Route HTTP GET ${r}`, err.message);
      results.routesTested.push({ route: r, type: 'Frontend Route', status: 'Failed: ' + err.message });
    }
  }
}

async function testRoleEndpointsAndData() {
  console.log('\n--- 2. Authenticating User Roles (Admin, Engineer, End-User) ---');
  const adminAuth = await loginUser('admin@cloudsupport.local', 'Admin@123');
  const engAuth = await loginUser('engineer@cloudsupport.local', 'Engineer@123');
  const userAuth = await loginUser('user@cloudsupport.local', 'User@123');

  assert(adminAuth.user.role === 'admin', 'Admin authenticated with role=admin');
  assert(engAuth.user.role === 'engineer', 'Engineer authenticated with role=engineer');
  assert(userAuth.user.role === 'user', 'End-user authenticated with role=user');

  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.token}` };
  const engHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${engAuth.token}` };
  const userHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${userAuth.token}` };

  console.log('\n--- 3. Verifying Admin Multi-Page Backend APIs ---');
  // /admin/dashboard
  const adminStats = await (await fetch(`${API_BASE}/dashboard/stats`, { headers: adminHeaders })).json();
  assert(adminStats.success && adminStats.data.summary, 'Admin Dashboard API (/api/dashboard/stats)');

  // /admin/incidents
  const adminIncidents = await (await fetch(`${API_BASE}/tickets?limit=50`, { headers: adminHeaders })).json();
  assert(adminIncidents.success && Array.isArray(adminIncidents.data.tickets), 'Admin Incidents API (/api/tickets)');

  // /admin/users
  const adminUsers = await (await fetch(`${API_BASE}/users`, { headers: adminHeaders })).json();
  assert(adminUsers.success && adminUsers.data.users.length >= 3, 'Admin Users API (/api/users)');

  // /admin/sla
  const adminSla = await (await fetch(`${API_BASE}/sla/configs`, { headers: adminHeaders })).json();
  assert(adminSla.success && adminSla.data.configs.length === 4, 'Admin SLA Configs API (/api/sla/configs)');

  // /admin/analytics
  const adminAnalytics = await (await fetch(`${API_BASE}/analytics`, { headers: adminHeaders })).json();
  assert(adminAnalytics.success && adminAnalytics.data.overview, 'Admin Analytics API (/api/analytics)');

  // /admin/notifications
  const adminNotifs = await (await fetch(`${API_BASE}/notifications`, { headers: adminHeaders })).json();
  assert(adminNotifs.success && Array.isArray(adminNotifs.data.notifications), 'Admin Notifications API (/api/notifications)');

  // /admin/settings
  const adminSettings = await (await fetch(`${API_BASE}/settings`, { headers: adminHeaders })).json();
  assert(adminSettings.success && adminSettings.data && typeof adminSettings.data === 'object', 'Admin Settings API (/api/settings)');

  // /admin/profile
  const adminProfile = await (await fetch(`${API_BASE}/users/profile`, { headers: adminHeaders })).json();
  assert(adminProfile.success && adminProfile.data.user.email === 'admin@cloudsupport.local', 'Admin Profile API (/api/users/profile)');

  console.log('\n--- 4. Verifying Engineer Multi-Page Backend APIs ---');
  // /engineer/dashboard
  const engStats = await (await fetch(`${API_BASE}/dashboard/stats`, { headers: engHeaders })).json();
  assert(engStats.success && engStats.data.summary, 'Engineer Dashboard API (/api/dashboard/stats)');

  // /engineer/assigned
  const engAssigned = await (await fetch(`${API_BASE}/tickets?queue=assigned`, { headers: engHeaders })).json();
  assert(engAssigned.success && Array.isArray(engAssigned.data.tickets), 'Engineer Assigned API (/api/tickets?queue=assigned)');

  // /engineer/unassigned
  const engUnassigned = await (await fetch(`${API_BASE}/tickets?queue=unassigned`, { headers: engHeaders })).json();
  assert(engUnassigned.success && Array.isArray(engUnassigned.data.tickets), 'Engineer Unassigned API (/api/tickets?queue=unassigned)');

  // /engineer/history
  const engHistory = await (await fetch(`${API_BASE}/users/history`, { headers: engHeaders })).json();
  assert(engHistory.success && Array.isArray(engHistory.data.history), 'Engineer History API (/api/users/history)');

  // /engineer/notifications
  const engNotifs = await (await fetch(`${API_BASE}/notifications`, { headers: engHeaders })).json();
  assert(engNotifs.success, 'Engineer Notifications API (/api/notifications)');

  // /engineer/profile
  const engProfile = await (await fetch(`${API_BASE}/users/profile`, { headers: engHeaders })).json();
  assert(engProfile.success && engProfile.data.user.email === 'engineer@cloudsupport.local', 'Engineer Profile API (/api/users/profile)');

  console.log('\n--- 5. Verifying End-User Multi-Page Backend APIs ---');
  // /user/dashboard
  const userStats = await (await fetch(`${API_BASE}/dashboard/stats`, { headers: userHeaders })).json();
  assert(userStats.success, 'User Dashboard API (/api/dashboard/stats)');

  // /user/create-incident
  const newIncidentRes = await (await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      title: 'VPN authentication token failure for remote staff',
      description: 'Employees in remote offices cannot connect to the internal VPN cluster after token rotation.',
      category: 'Network',
      priority: 'High',
    }),
  })).json();
  assert(newIncidentRes.success && newIncidentRes.data.ticket.id, 'User Create Incident API (POST /api/tickets)');
  const createdTicketId = newIncidentRes.data.ticket.id;

  // /user/incidents
  const userIncidents = await (await fetch(`${API_BASE}/tickets`, { headers: userHeaders })).json();
  assert(userIncidents.success && userIncidents.data.tickets.some(t => t.id === createdTicketId), 'User Incidents List API (/api/tickets)');

  // /user/incidents/:id & /engineer/incidents/:id & /admin/incidents/:id
  const ticketDetail = await (await fetch(`${API_BASE}/tickets/${createdTicketId}`, { headers: userHeaders })).json();
  assert(ticketDetail.success && ticketDetail.data.ticket.id === createdTicketId, `Incident Detail API (/api/tickets/${createdTicketId})`);

  // Add comment
  const commentRes = await (await fetch(`${API_BASE}/tickets/${createdTicketId}/comments`, {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({ comment: 'Tested with 5 users; none can authenticate.' }),
  })).json();
  assert(commentRes.success, 'Add Comment API (/api/tickets/:id/comments)');

  // Engineer accepts ticket
  const assignRes = await (await fetch(`${API_BASE}/tickets/${createdTicketId}/assign`, {
    method: 'PUT',
    headers: engHeaders,
    body: JSON.stringify({ assigned_to: engAuth.user.id }),
  })).json();
  assert(assignRes.success, 'Engineer Self-Assign API (/api/tickets/:id/assign)');

  // Engineer updates status to In Progress
  const statusRes = await (await fetch(`${API_BASE}/tickets/${createdTicketId}/status`, {
    method: 'PUT',
    headers: engHeaders,
    body: JSON.stringify({ status: 'In Progress' }),
  })).json();
  assert(statusRes.success, 'Update Status In Progress API (/api/tickets/:id/status)');

  // Engineer resolves ticket with resolution notes
  const resolveRes = await (await fetch(`${API_BASE}/tickets/${createdTicketId}/status`, {
    method: 'PUT',
    headers: engHeaders,
    body: JSON.stringify({
      status: 'Resolved',
      resolution_notes: 'Re-synced radius auth certificate cluster; verified successful token handshake.',
    }),
  })).json();
  assert(resolveRes.success, 'Resolve Incident API with Resolution Notes (/api/tickets/:id/status)');

  // User notifications
  const userNotifs = await (await fetch(`${API_BASE}/notifications`, { headers: userHeaders })).json();
  assert(userNotifs.success, 'User Notifications API (/api/notifications)');

  // User profile
  const userProfile = await (await fetch(`${API_BASE}/users/profile`, { headers: userHeaders })).json();
  assert(userProfile.success && userProfile.data.user.email === 'user@cloudsupport.local', 'User Profile API (/api/users/profile)');

  console.log('\n--- 6. Verifying Strict Role Boundaries & Security Controls ---');
  // User cannot access /api/users
  const userToUsersRes = await fetch(`${API_BASE}/users`, { headers: userHeaders });
  assert(userToUsersRes.status === 403, 'Role Security: User accessing /api/users returns 403 Forbidden');

  // Engineer cannot change user roles (Admin only)
  const engToRoleRes = await fetch(`${API_BASE}/users/1/role`, {
    method: 'PUT',
    headers: engHeaders,
    body: JSON.stringify({ role: 'admin' }),
  });
  assert(engToRoleRes.status === 403, 'Role Security: Engineer changing user roles returns 403 Forbidden');

  // User cannot update SLA configs
  const userToSlaRes = await fetch(`${API_BASE}/sla/configs`, {
    method: 'PUT',
    headers: userHeaders,
    body: JSON.stringify({ priority: 'Critical', targetMinutes: 20 }),
  });
  assert(userToSlaRes.status === 403, 'Role Security: User updating SLA configs returns 403 Forbidden');

  // User cannot access /api/analytics
  const userToAnalyticsRes = await fetch(`${API_BASE}/analytics`, { headers: userHeaders });
  assert(userToAnalyticsRes.status === 403, 'Role Security: User accessing /api/analytics returns 403 Forbidden');

  // User cannot access /api/settings
  const userToSettingsRes = await fetch(`${API_BASE}/settings`, { headers: userHeaders });
  assert(userToSettingsRes.status === 403, 'Role Security: User accessing /api/settings returns 403 Forbidden');

  console.log(`\n======================================================`);
  console.log(`VERIFICATION SUMMARY: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log(`======================================================\n`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

async function run() {
  try {
    await testFrontendRoutes();
    await testRoleEndpointsAndData();
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

run();
