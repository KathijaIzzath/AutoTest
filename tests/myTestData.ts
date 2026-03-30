import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface UserInfo {
  username: string;
  password:string;
  url : string;
  dashboardUrl : string;

}

// Resolve the path to the JSON file
//const testDataPath = path.resolve('C:\\', 'AutoTest','testData', 'UserInfo.json');

// Parse the JSON string into a typed TypeScript object
//const userData: UserInfo = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));

// Extend the base test with your new fixture
export const userDatatest = base.extend<{ userData: UserInfo }>({
  // Define the fixture value
 // userData: [userData, { option: true }],
});

export { expect };