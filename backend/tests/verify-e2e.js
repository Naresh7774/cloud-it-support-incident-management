const request = require('supertest');
const app = require('../src/app');

async function runE2ETests() {
  console.log('====================================================================');
  console.log('STARTING END-TO-END APPLICATION & API VERIFICATION');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify /health
    console.log('\n--- 1. Testing /health Endpoint ---');
    const healthRes = await request(app).get('/health');
    assert(healthRes.status === 200, `/health responded with status 200 (received: ${healthRes.status})`);
    assert(healthRes.body.status === 'healthy', `System status is 'healthy' (received: ${healthRes.body.status})`);
    assert(healthRes.body.services.database.status === 'connected', `Database service reports 'connected'`);

    // 2. Test Login for All Three Roles
    console.log('\n--- 2. Testing Authentication for All 3 Roles ---');
    
    // Admin Login
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cloudsupport.local', password: 'Admin@123' });
    assert(adminLoginRes.status === 200, `Admin login successful (200 OK)`);
    assert(adminLoginRes.body.data.user.role === 'admin', `Admin role verified in JWT profile`);
    const adminToken = adminLoginRes.body.data.token;

    // Engineer Login
    const engLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'engineer@cloudsupport.local', password: 'Engineer@123' });
    assert(engLoginRes.status === 200, `Engineer login successful (200 OK)`);
    assert(engLoginRes.body.data.user.role === 'engineer', `Engineer role verified in JWT profile`);
    const engToken = engLoginRes.body.data.token;

    // User Login
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@cloudsupport.local', password: 'User@123' });
    assert(userLoginRes.status === 200, `User login successful (200 OK)`);
    assert(userLoginRes.body.data.user.role === 'user', `User role verified in JWT profile`);
    const userToken = userLoginRes.body.data.token;

    // 3. Test Ticket Lifecycle & SLA Tracking
    console.log('\n--- 3. Testing Ticket Creation, SLA Tracking & Assignment ---');
    
    // User creates a Critical priority incident
    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'E2E Test: Redis Cluster Failover Alert',
        description: 'Redis primary node disconnected, failover replica election initiated.',
        category: 'Cloud/Infrastructure',
        priority: 'Critical'
      });
    assert(createRes.status === 201, `User successfully raised ticket (201 Created)`);
    const ticketId = createRes.body.data.ticket.id;
    const ticketNumber = createRes.body.data.ticket.ticket_number;
    const slaDeadline = new Date(createRes.body.data.ticket.sla_deadline);
    const createdAt = new Date(createRes.body.data.ticket.created_at);
    const diffMinutes = Math.round((slaDeadline - createdAt) / 60000);
    assert(diffMinutes === 15, `Critical SLA deadline is exactly 15 minutes after creation (calculated: ${diffMinutes}m)`);
    console.log(`Created Ticket ${ticketNumber} (ID: ${ticketId}) with SLA target: ${slaDeadline.toISOString()}`);

    // Engineer views unassigned queue
    const queueRes = await request(app)
      .get('/api/tickets?queue=unassigned')
      .set('Authorization', `Bearer ${engToken}`);
    assert(queueRes.status === 200, `Engineer successfully retrieved unassigned queue (200 OK)`);
    const foundInQueue = queueRes.body.data.tickets.some(t => t.id === ticketId);
    assert(foundInQueue, `Newly created ticket appears in engineer unassigned queue`);

    // Engineer accepts and self-assigns ticket
    const assignRes = await request(app)
      .put(`/api/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${engToken}`)
      .send({});
    assert(assignRes.status === 200, `Engineer successfully accepted ticket assignment (200 OK)`);
    assert(assignRes.body.data.ticket.status === 'Assigned', `Ticket status updated to 'Assigned' upon assignment`);

    // Engineer changes status to In Progress
    const progressRes = await request(app)
      .put(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${engToken}`)
      .send({ status: 'In Progress' });
    assert(progressRes.status === 200, `Ticket status updated to 'In Progress'`);

    // 4. Test Comments (Public vs Internal)
    console.log('\n--- 4. Testing Comments & Internal Notes ---');
    
    // User posts public comment
    const userCommentRes = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ comment: 'Application latency returned to normal after 5 minutes.' });
    assert(userCommentRes.status === 201, `User posted public comment (201 Created)`);

    // Engineer posts internal note
    const engInternalNoteRes = await request(app)
      .post(`/api/tickets/${ticketId}/comments`)
      .set('Authorization', `Bearer ${engToken}`)
      .send({ comment: 'Root cause was network blip between AWS AZs.', isInternal: true });
    assert(engInternalNoteRes.status === 201, `Engineer posted internal staff note (201 Created)`);

    // Verify security: End user fetching ticket details should NOT see internal note
    const userFetchRes = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${userToken}`);
    const userComments = userFetchRes.body.data.comments;
    const containsInternal = userComments.some(c => c.is_internal === true || c.is_internal === 1);
    assert(!containsInternal, `Security verified: Internal note is HIDDEN from end user`);

    // Engineer fetching ticket details DOES see internal note
    const engFetchRes = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${engToken}`);
    const engComments = engFetchRes.body.data.comments;
    const engSeesInternal = engComments.some(c => c.is_internal === true || c.is_internal === 1);
    assert(engSeesInternal, `Engineer can view internal notes`);

    // 5. Test Resolution & Lifecycle Closure
    console.log('\n--- 5. Testing Incident Resolution & Closure ---');
    
    // Resolving without resolution notes should fail (validation check)
    const resolveFailRes = await request(app)
      .put(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${engToken}`)
      .send({ status: 'Resolved', resolutionNotes: '' });
    assert(resolveFailRes.status === 400, `Validation check: Resolving without notes rejected with 400 Bad Request`);

    // Resolving with resolution notes
    const resolveSuccessRes = await request(app)
      .put(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${engToken}`)
      .send({
        status: 'Resolved',
        resolutionNotes: 'Completed graceful failover to secondary replica. Cluster healthy.'
      });
    assert(resolveSuccessRes.status === 200, `Incident successfully marked 'Resolved' with resolution notes`);
    assert(resolveSuccessRes.body.data.ticket.resolved_at !== null, `resolved_at timestamp recorded`);

    // End user closes their resolved ticket
    const closeRes = await request(app)
      .put(`/api/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'Closed' });
    assert(closeRes.status === 200, `End user successfully confirmed and closed ticket (Status: Closed)`);

    // 6. Verify Complete Audit History
    console.log('\n--- 6. Verifying Audit History Log ---');
    const historyRes = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const history = historyRes.body.data.history;
    const actions = history.map(h => h.action);
    console.log('Recorded historical actions:', actions);
    assert(actions.includes('CREATED'), `History contains CREATED`);
    assert(actions.includes('ASSIGNED'), `History contains ASSIGNED`);
    assert(actions.includes('STATUS_CHANGED'), `History contains STATUS_CHANGED`);
    assert(actions.includes('COMMENT_ADDED'), `History contains COMMENT_ADDED`);

    // 7. Verify Dashboard Statistics
    console.log('\n--- 7. Verifying Dashboard Statistics ---');
    const adminStatsRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(adminStatsRes.status === 200, `Admin stats API responded 200 OK`);
    assert(adminStatsRes.body.data.summary.total > 0, `Total tickets count > 0`);
    assert(adminStatsRes.body.data.byPriority.length > 0, `Priority breakdown data present`);

    // Summary
    console.log('\n====================================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================================');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during E2E verification:', err);
    process.exit(1);
  }
}

runE2ETests();
