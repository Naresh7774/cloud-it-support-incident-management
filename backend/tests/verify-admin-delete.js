const BASE_URL = 'http://localhost:5000/api';

const PASS = (msg) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const FAIL = (msg, err) => {
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${msg}`, err || '');
  process.exit(1);
};

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('\n--- 1. Authenticating Roles ---');
  let adminToken, engineerToken, userToken, adminId;

  try {
    const adminRes = await req('/auth/login', {
      method: 'POST',
      body: { email: 'admin@cloudsupport.local', password: 'Admin@123' }
    });
    if (adminRes.status !== 200) FAIL('Admin login failed', adminRes.data);
    adminToken = adminRes.data.data.token;
    adminId = adminRes.data.data.user.id;
    PASS(`Admin authenticated (ID: ${adminId}, Role: ${adminRes.data.data.user.role})`);

    const engRes = await req('/auth/login', {
      method: 'POST',
      body: { email: 'engineer@cloudsupport.local', password: 'Engineer@123' }
    });
    if (engRes.status !== 200) FAIL('Engineer login failed', engRes.data);
    engineerToken = engRes.data.data.token;
    PASS(`Engineer authenticated (Role: ${engRes.data.data.user.role})`);

    const userRes = await req('/auth/login', {
      method: 'POST',
      body: { email: 'user@cloudsupport.local', password: 'User@123' }
    });
    if (userRes.status !== 200) FAIL('User login failed', userRes.data);
    userToken = userRes.data.data.token;
    PASS(`End User authenticated (Role: ${userRes.data.data.user.role})`);
  } catch (err) {
    FAIL('Authentication setup failed', err.message);
  }

  console.log('\n--- 2. Verifying Non-Admin Role Security (RBAC Delete Rejection) ---');
  // Attempt ticket deletion as End User
  const uDel = await req('/tickets/1', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  if (uDel.status === 403) {
    PASS('End User deleting ticket rejected with 403 Forbidden');
  } else {
    FAIL('End user should be rejected with 403', uDel.status);
  }

  // Attempt ticket deletion as Engineer
  const eDel = await req('/tickets/1', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${engineerToken}` }
  });
  if (eDel.status === 403) {
    PASS('Support Engineer deleting ticket rejected with 403 Forbidden');
  } else {
    FAIL('Support Engineer should be rejected with 403', eDel.status);
  }

  // Attempt user deletion as End User
  const uUserDel = await req('/users/2', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  if (uUserDel.status === 403) {
    PASS('End User deleting user account rejected with 403 Forbidden');
  } else {
    FAIL('End user deleting user should be rejected with 403', uUserDel.status);
  }

  // Attempt user deletion as Engineer
  const eUserDel = await req('/users/2', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${engineerToken}` }
  });
  if (eUserDel.status === 403) {
    PASS('Support Engineer deleting user account rejected with 403 Forbidden');
  } else {
    FAIL('Support Engineer deleting user should be rejected with 403', eUserDel.status);
  }

  // Admin attempting to delete own account -> 400
  const selfDel = await req(`/users/${adminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (selfDel.status === 400) {
    PASS('Admin deleting own account rejected with 400 Bad Request (Safety Lockout)');
  } else {
    FAIL('Admin deleting self should be rejected with 400', selfDel.status);
  }

  console.log('\n--- 3. Testing Admin Ticket Lifecycle (Create, Comment, Delete Comment, Delete Ticket) ---');
  let testTicketId, testCommentId;

  // 1. Create ticket
  const createRes = await req('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      title: 'Temporary Test Incident for Deletion Verification',
      description: 'This is a test incident created to verify that the administrator can permanently delete tickets.',
      category: 'Database Services',
      priority: 'Low'
    }
  });
  if (createRes.status !== 201) FAIL('Ticket creation failed', createRes.data);
  testTicketId = createRes.data.data.ticket.id;
  const ticketNumber = createRes.data.data.ticket.ticket_number;
  PASS(`Admin created temporary test ticket: ${ticketNumber} (ID: ${testTicketId})`);

  // 2. Add comment
  const commentRes = await req(`/tickets/${testTicketId}/comments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      comment: 'Temporary comment to verify comment deletion',
      isInternal: true
    }
  });
  if (commentRes.status !== 201) FAIL('Comment creation failed', commentRes.data);
  testCommentId = commentRes.data.data.comment.id;
  PASS(`Admin added test comment ID: ${testCommentId}`);

  // 3. Engineer attempting to delete comment -> 403
  const engDelComment = await req(`/tickets/${testTicketId}/comments/${testCommentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${engineerToken}` }
  });
  if (engDelComment.status === 403) {
    PASS('Engineer deleting comment rejected with 403 Forbidden');
  } else {
    FAIL('Engineer should be rejected with 403', engDelComment.status);
  }

  // 4. Admin deletes comment -> 200
  const adminDelComment = await req(`/tickets/${testTicketId}/comments/${testCommentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (adminDelComment.status === 200) {
    PASS('Admin deleted comment permanently (Status 200 OK)');
  } else {
    FAIL('Admin comment deletion failed', adminDelComment.data);
  }

  // 5. Admin deletes ticket -> 200
  const adminDelTicket = await req(`/tickets/${testTicketId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (adminDelTicket.status === 200) {
    PASS(`Admin deleted ticket permanently (Status 200 OK): ${adminDelTicket.data.message}`);
  } else {
    FAIL('Admin ticket deletion failed', adminDelTicket.data);
  }

  // 6. Verify ticket no longer exists -> 404
  const queryDeleted = await req(`/tickets/${testTicketId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (queryDeleted.status === 404) {
    PASS('Ticket query returned 404 Not Found (confirmed wiped from database)');
  } else {
    FAIL('Deleted ticket should return 404', queryDeleted.status);
  }

  console.log('\n--- 4. Testing Admin User Lifecycle (Create, Reassign, Delete User) ---');
  const tempEmail = `tempuser_${Date.now()}@test.local`;
  const regRes = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Temporary Deletable User',
      email: tempEmail,
      password: 'TempPassword@123',
      department: 'QA Testing'
    }
  });
  if (regRes.status !== 201) FAIL('Temporary user registration failed', regRes.data);
  const tempUserId = regRes.data.data.user.id;
  PASS(`Registered temporary user ${tempEmail} (ID: ${tempUserId})`);

  // Admin deletes user -> 200
  const adminDelUser = await req(`/users/${tempUserId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (adminDelUser.status === 200) {
    PASS(`Admin deleted user permanently (Status 200 OK): ${adminDelUser.data.message}`);
  } else {
    FAIL('Admin user deletion failed', adminDelUser.data);
  }

  // Verify user is gone from user list
  const userListRes = await req('/users', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const foundUser = userListRes.data.data.users.find((u) => u.id === tempUserId);
  if (!foundUser) {
    PASS('User confirmed deleted from MySQL users directory');
  } else {
    FAIL('User still found in users list after deletion');
  }

  console.log('\n======================================================');
  console.log('ALL ADMINISTRATOR DELETE CAPABILITY TESTS PASSED (14/14)');
  console.log('======================================================\n');
}

runTests();
