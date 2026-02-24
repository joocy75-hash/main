import http from 'http';

const BASE_URL = 'http://localhost:8003';
const TEST_USER = { username: 'testuser', password: 'test1234!' };
const NEW_USER = {
  username: `e2euser${Date.now() % 100000}`,
  nickname: 'E2E테스트',
  password: 'Test1234!',
  phone: '01012345678',
  referrerCode: '', // filled after login
};

let accessToken = '';
let testResults = [];
let referralCode = '';

const request = (method, path, body, token) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const recordResult = (step, name, passed, detail = '') => {
  const status = passed ? 'PASS' : 'FAIL';
  const icon = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`  ${icon} Step ${step}: ${name}${detail ? ` - ${detail}` : ''}`);
  testResults.push({ step, name, passed, detail });
};

// ============================================================
// Test Steps
// ============================================================

const step1_healthCheck = async () => {
  try {
    const res = await request('GET', '/health');
    const ok =
      res.status === 200 &&
      res.body.success === true &&
      res.body.data?.status === 'ok';
    recordResult(1, 'Health Check (GET /health)', ok, `status=${res.status}`);
    return ok;
  } catch (err) {
    recordResult(1, 'Health Check (GET /health)', false, err.message);
    return false;
  }
};

const step2_register = async () => {
  try {
    // First login to get referral code for new user registration
    const loginRes = await request('POST', '/api/auth/login', {
      username: TEST_USER.username,
      password: TEST_USER.password,
    });

    if (loginRes.status === 200 && loginRes.body.success) {
      referralCode = loginRes.body.data.user.myReferralCode;
      NEW_USER.referrerCode = referralCode;
    } else {
      recordResult(
        2,
        'Register (POST /api/auth/register)',
        false,
        'Could not get referral code from testuser login',
      );
      return false;
    }

    const res = await request('POST', '/api/auth/register', NEW_USER);
    const ok =
      (res.status === 201 && res.body.success === true) ||
      (res.status === 409 && res.body.error?.includes('이미 사용'));
    const detail =
      res.status === 201
        ? `new user: ${NEW_USER.username}`
        : `status=${res.status}, ${res.body.error || ''}`;
    recordResult(2, 'Register (POST /api/auth/register)', ok, detail);
    return ok;
  } catch (err) {
    recordResult(2, 'Register (POST /api/auth/register)', false, err.message);
    return false;
  }
};

const step3_login = async () => {
  try {
    const res = await request('POST', '/api/auth/login', {
      username: TEST_USER.username,
      password: TEST_USER.password,
    });
    const ok =
      res.status === 200 &&
      res.body.success === true &&
      res.body.data?.accessToken;
    if (ok) {
      accessToken = res.body.data.accessToken;
    }
    recordResult(
      3,
      'Login (POST /api/auth/login)',
      ok,
      ok ? `user=${res.body.data.user.username}` : `status=${res.status}, ${res.body.error || ''}`,
    );
    return ok;
  } catch (err) {
    recordResult(3, 'Login (POST /api/auth/login)', false, err.message);
    return false;
  }
};

const step4_gameLobby = async () => {
  try {
    const catRes = await request('GET', '/api/games/categories');
    const catOk =
      catRes.status === 200 &&
      catRes.body.success === true &&
      Array.isArray(catRes.body.data);
    const catCount = catOk ? catRes.body.data.length : 0;

    const popRes = await request('GET', '/api/games/popular');
    const popOk =
      popRes.status === 200 &&
      popRes.body.success === true;

    const ok = catOk && popOk;
    recordResult(
      4,
      'Game Lobby (categories + popular)',
      ok,
      `categories=${catCount}, popular=${popOk ? 'ok' : 'fail'}`,
    );
    return ok;
  } catch (err) {
    recordResult(4, 'Game Lobby', false, err.message);
    return false;
  }
};

const step5_deposit = async () => {
  try {
    const res = await request(
      'POST',
      '/api/wallet/deposit',
      { coinType: 'USDT', network: 'TRC20', amount: 100 },
      accessToken,
    );
    const ok =
      res.status === 201 &&
      res.body.success === true &&
      res.body.data?.status === 'PENDING';
    recordResult(
      5,
      'Deposit (POST /api/wallet/deposit)',
      ok,
      ok
        ? `id=${res.body.data.id}, status=${res.body.data.status}`
        : `status=${res.status}, ${res.body.error || ''}`,
    );
    return ok;
  } catch (err) {
    recordResult(5, 'Deposit (POST /api/wallet/deposit)', false, err.message);
    return false;
  }
};

const step6_transactions = async () => {
  try {
    const res = await request(
      'GET',
      '/api/wallet/transactions?type=all&page=1&limit=10',
      null,
      accessToken,
    );
    const ok =
      res.status === 200 &&
      res.body.success === true &&
      res.body.data?.items !== undefined &&
      res.body.data?.pagination !== undefined;
    recordResult(
      6,
      'Transactions (GET /api/wallet/transactions)',
      ok,
      ok
        ? `total=${res.body.data.pagination.total}`
        : `status=${res.status}, ${res.body.error || ''}`,
    );
    return ok;
  } catch (err) {
    recordResult(6, 'Transactions (GET /api/wallet/transactions)', false, err.message);
    return false;
  }
};

const step7_attendance = async () => {
  try {
    const res = await request(
      'POST',
      '/api/attendance/check-in',
      {},
      accessToken,
    );
    // check-in may succeed (200) or fail if already checked in today (400)
    const ok =
      (res.status === 200 && res.body.success === true) ||
      (res.status === 400 && res.body.error?.includes('이미 출석'));
    const detail =
      res.status === 200
        ? `day=${res.body.data?.dayNumber || '?'}, reward=${res.body.data?.rewardAmount || '?'}`
        : res.body.error || '';
    recordResult(7, 'Attendance Check-in (POST /api/attendance/check-in)', ok, detail);
    return ok;
  } catch (err) {
    recordResult(7, 'Attendance Check-in', false, err.message);
    return false;
  }
};

const step8_missions = async () => {
  try {
    const res = await request('GET', '/api/missions', null, accessToken);
    const ok =
      res.status === 200 &&
      res.body.success === true &&
      Array.isArray(res.body.data);
    recordResult(
      8,
      'Missions (GET /api/missions)',
      ok,
      ok
        ? `count=${res.body.data.length}`
        : `status=${res.status}, ${res.body.error || ''}`,
    );
    return ok;
  } catch (err) {
    recordResult(8, 'Missions (GET /api/missions)', false, err.message);
    return false;
  }
};

const step9_messages = async () => {
  try {
    const res = await request(
      'GET',
      '/api/messages?page=1&limit=10',
      null,
      accessToken,
    );
    const ok =
      res.status === 200 &&
      res.body.success === true &&
      res.body.data?.items !== undefined;
    recordResult(
      9,
      'Messages (GET /api/messages)',
      ok,
      ok
        ? `total=${res.body.data.pagination?.total || 0}`
        : `status=${res.status}, ${res.body.error || ''}`,
    );
    return ok;
  } catch (err) {
    recordResult(9, 'Messages (GET /api/messages)', false, err.message);
    return false;
  }
};

const step10_profile = async () => {
  try {
    const res = await request('GET', '/api/profile', null, accessToken);
    const ok =
      res.status === 200 &&
      res.body.success === true &&
      res.body.data?.username !== undefined;
    recordResult(
      10,
      'Profile (GET /api/profile)',
      ok,
      ok
        ? `username=${res.body.data.username}, vip=${res.body.data.vipLevel}`
        : `status=${res.status}, ${res.body.error || ''}`,
    );
    return ok;
  } catch (err) {
    recordResult(10, 'Profile (GET /api/profile)', false, err.message);
    return false;
  }
};

// ============================================================
// Main Runner
// ============================================================

const main = async () => {
  console.log('\n========================================');
  console.log('  E2E Integration Test - User Page');
  console.log('  Target: http://localhost:8003');
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('========================================\n');

  await step1_healthCheck();
  await step2_register();
  await step3_login();

  if (!accessToken) {
    console.log('\n\x1b[31m[ABORT] Login failed. Cannot continue auth-required tests.\x1b[0m\n');
  } else {
    await step4_gameLobby();
    await step5_deposit();
    await step6_transactions();
    await step7_attendance();
    await step8_missions();
    await step9_messages();
    await step10_profile();
  }

  // Summary
  console.log('\n========================================');
  console.log('  Test Summary');
  console.log('========================================');

  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const total = testResults.length;

  console.log(`  Total: ${total}`);
  console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`);
  console.log(`  \x1b[31mFailed: ${failed}\x1b[0m`);
  console.log(`  Pass Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
  console.log('========================================\n');

  if (failed > 0) {
    console.log('  Failed tests:');
    testResults
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`    - Step ${r.step}: ${r.name} (${r.detail})`);
      });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('E2E test runner error:', err);
  process.exit(1);
});
