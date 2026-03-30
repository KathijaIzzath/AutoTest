import { test, expect, Locator, Page } from '@playwright/test';

export interface AccountRecord {
  accountnum: number;
  acctname: string;
  email: string;
  streetaddr1: string;
  city: string;
  state: string;
  zipcode: string;
  contactname: string;
  contactphone: string;
  contactfax: string;
  pmssoftware: string;
  ecsstatus: string;
  ecsdate: string;
  erastatus: string;
  eradate: string;
  claimstatusstatus: string;
  csStatusdate: string;
  elstatus: string;
  elstatusdate: string;
  stmtstatus: string;
  stmtdate: string;
  datesetup: string;
  datelastdbupdate: string;
  lastupdatedby: string;
  notes: string;
  gemsetupflag: string;
  gemsetupupdate: string;
  creditnum: string;
  expiremonth: string;
  expireyear: string;
  creditcardexport: string;
  taxexmpt: string;
  terminatereason: string;
  dateterminate: string;
  isactive: boolean;
}

