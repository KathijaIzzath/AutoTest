import { Page } from '@playwright/test';
import * as userData from './UserInfo.json';

class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    console.log('Navigating to admin login page');
    await this.page.goto(userData.admin.url);
  }

  async login(username: string, password: string) {
    console.log('Submitting login form');

    await this.page.getByRole('textbox', { name: 'Enter Username' }).click();
    await this.page.getByRole('textbox', { name: 'Enter Username' }).fill(username);
    await this.page.getByRole('textbox', { name: 'Enter Password' }).click();
    await this.page.getByRole('textbox', { name: 'Enter Password' }).fill(password);

    await this.page.getByRole('button', { name: 'Log In' }).click();
    await this.page.setDefaultNavigationTimeout(1200000);
  }
}

export default LoginPage;
