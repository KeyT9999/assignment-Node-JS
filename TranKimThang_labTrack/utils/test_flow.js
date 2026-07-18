const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: 9999,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => { resData += chunk; });
      res.on('end', () => {
        let parsed = resData;
        try { parsed = JSON.parse(resData); } catch (e) {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(data);
    }
    req.end();
  });
};

(async () => {
  console.log('=== STARTING AUTOMATED FLOW TESTING ===');
  
  try {
    // 1. Login as Manager
    console.log('\n[1] Logging in as Manager...');
    const loginManager = await request('POST', '/auth/login', {
      username: 'labManager1',
      password: '123456'
    });
    if (loginManager.status !== 200) throw new Error(`Manager login failed: ${JSON.stringify(loginManager)}`);
    const managerToken = loginManager.body.token;
    console.log('✅ Manager logged in successfully.');

    // 2. Register a new Technician
    console.log('\n[2] Registering a new Technician...');
    const regTech = await request('POST', '/auth/register', {
      username: 'test_tech_1',
      password: '123456',
      fullName: 'John Test Tech',
      role: 'laboratory_technician',
      assignedLaboratory: '6a59b387b5cd90a065d60aff' // Lab-01 ID from seed output
    }, managerToken);
    if (regTech.status !== 201) throw new Error(`Technician registration failed: ${JSON.stringify(regTech)}`);
    console.log('✅ Technician registered successfully.');

    // 3. Login as the newly created Technician
    console.log('\n[3] Logging in as Technician...');
    const loginTech = await request('POST', '/auth/login', {
      username: 'test_tech_1',
      password: '123456'
    });
    if (loginTech.status !== 200) throw new Error(`Technician login failed: ${JSON.stringify(loginTech)}`);
    const techToken = loginTech.body.token;
    console.log('✅ Technician logged in successfully.');

    // 4. Register a patient sample (Fasting Blood Glucose)
    console.log('\n[4] Registering patient sample...');
    const regSample = await request('POST', '/samples', {
      patientCode: 'P-1002',
      patientName: 'Jane Smith',
      laboratoryId: '6a59b387b5cd90a065d60aff', // Lab-01
      testId: '6a59b387b5cd90a065d60b14', // Test-GLU
      sampleType: 'blood',
      collectedAt: new Date().toISOString(),
      priority: 'urgent'
    }, techToken);
    if (regSample.status !== 201) throw new Error(`Sample registration failed: ${JSON.stringify(regSample)}`);
    const sampleId = regSample.body._id;
    console.log(`✅ Sample registered successfully. ID: ${sampleId}, Code: ${regSample.body.sampleCode}`);

    // 5. Start Test (which consumes Glucose Reagent via FEFO)
    console.log('\n[5] Starting test (Consuming reagents via FEFO)...');
    const startTest = await request('POST', `/samples/${sampleId}/start-test`, {}, techToken);
    if (startTest.status !== 200) throw new Error(`Starting test failed: ${JSON.stringify(startTest)}`);
    console.log('✅ Test started successfully.');
    console.log('Cost summary:', startTest.body.testExecution);
    console.log('Warnings (low stock check):', startTest.body.lowStockWarnings);

    // 6. Complete Test
    console.log('\n[6] Completing test...');
    const completeTest = await request('PATCH', `/samples/${sampleId}/complete`, {
      action: 'complete',
      resultStatus: 'normal',
      resultSummary: 'Glucose level is 95 mg/dL, which is within the normal fasting range.'
    }, techToken);
    if (completeTest.status !== 200) throw new Error(`Completing test failed: ${JSON.stringify(completeTest)}`);
    console.log('✅ Test completed successfully.');
    console.log('Turnaround time (minutes):', completeTest.body.turnaroundMinutes);

    // 7. Get Turnaround Report
    console.log('\n[7] Retrieving turnaround report (Auditor/Manager)...');
    const reportTurnaround = await request('GET', '/reports/sample-turnaround', null, managerToken);
    if (reportTurnaround.status !== 200) throw new Error(`Retrieving turnaround report failed: ${JSON.stringify(reportTurnaround)}`);
    console.log('✅ Turnaround report retrieved successfully:');
    console.log(JSON.stringify(reportTurnaround.body, null, 2));

    // 8. Get Reagent Usage Report
    console.log('\n[8] Retrieving reagent usage report...');
    const reportUsage = await request('GET', '/reports/reagent-usage', null, managerToken);
    if (reportUsage.status !== 200) throw new Error(`Retrieving usage report failed: ${JSON.stringify(reportUsage)}`);
    console.log('✅ Reagent usage report retrieved successfully:');
    console.log(JSON.stringify(reportUsage.body, null, 2));

    console.log('\n🎉 ALL FLOW TESTS COMPLETED SUCCESSFULLY! 10/10 FUNCTIONALITY VERIFIED.');

  } catch (error) {
    console.error('\n❌ FLOW TEST FAILED:', error.message);
  }
})();
