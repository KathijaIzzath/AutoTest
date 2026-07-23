// tests/database-test.spec.ts
import * as dbQuery from './database.utils';
import { test, expect, Page } from '@playwright/test';
import { executeQuery } from './database.utils';
import helperFunction from './helperFunction';
import * as fs from 'fs';
import * as path from 'path';

class DBQueries {
  constructor() {
    // Constructor body
  }

  async beforeAllUpdateQueries() {
    const today = new Date();
    const formattedDate = today.toISOString();
    console.log('formattedDate', formattedDate);

    // Update claims with timestamp and date of service
    const claimsupdate = 'UPDATE claims SET hintimestamp = $1, dateofservice = $2';
    const params = [formattedDate, formattedDate];
    console.log('claimsupdate', claimsupdate, 'params', params);
    await executeQuery(claimsupdate, params);

    // ERA Received - update by ID and payer ID
    const eraupdate = 'UPDATE eramain SET effectivedate = $1 WHERE id = $2 AND payerid = $3';
    const id = 'G26890';
    const payerid1 = 'TREST';
    const params1 = [formattedDate, id, payerid1];
    console.log(eraupdate, params1);
    await executeQuery(eraupdate, params1);

    // ERA Received - update by payer ID
    const erapayerupdate = 'UPDATE eramain SET effectivedate = $1 WHERE payerid = $2';
    const payerid2 = '61101';
    const paramsera = [formattedDate, payerid2];
    console.log(erapayerupdate, paramsera);
    await executeQuery(erapayerupdate, paramsera);

    // Claims sent - update by payer ID and provider ID
    const claimspayerupdate = 'UPDATE claims SET hintimestamp = $1 WHERE payerid = $2 AND providerid = $3';
    const payerid = 'Y00680';
    const providerid = 'P15487';
    const params2 = [formattedDate, payerid, providerid];
    console.log(claimspayerupdate, params2);
    await executeQuery(claimspayerupdate, params2);

    // Enrollment received - update agreement dates for all active statuses (C/D/M/P/A)
    const groupenrollmentupdate =
      'UPDATE groupenrollment SET agreementSentDate = $1, agreementDeniedDate = $2 WHERE enrollmentStatus IN ($3, $4, $5, $6, $7)';
    const params3 = [formattedDate, formattedDate, 'C', 'D', 'M', 'P', 'A'];
    console.log(groupenrollmentupdate, params3);
    await executeQuery(groupenrollmentupdate, params3);

    // Reject claim - update claims with status F2
    const rejectclaimupdate = 'UPDATE claims SET hintimestamp = $1 WHERE claimStatus = $2';
    const params4 = [formattedDate, 'F2'];
    console.log(rejectclaimupdate, params4);
    await executeQuery(rejectclaimupdate, params4);
  }
}

export default DBQueries;