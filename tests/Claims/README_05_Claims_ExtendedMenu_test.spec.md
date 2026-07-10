# Test File: 05_Claims_ExtendedMenu_test.spec.ts

Module: Claim Menu on Dashboard search results (Extended sub-menu read-only coverage)
Location: tests/Claims/05_Claims_ExtendedMenu_test.spec.ts
Test Data: testData/ClaimsExtendedMenuTestData.json
Fixture: loginAsAdmin from tests/myTestData.ts
Navigation Helper: navigateToClaimsDashboard from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Claim dashboard controls and filters are visible and available | Visibility |
| 2 | Apply Filter by claim id returns successful row and matches DB values | Functional + DB assertion |
| 3 | Provider submenu opens and key sections are visible in read-only mode | Functional + Read-only |
| 4 | Group submenu opens and key sections are visible in read-only mode | Functional + Read-only |
| 5 | Optional submenu items (Payer/Enrollment) are read-only when present | Functional + Read-only |
| 6 | Empty filters keep claims dashboard stable when Apply Filter is clicked | Edge case |
| 7 | Invalid claim id returns no rows or empty state and DB returns null | Edge case + DB assertion |
| 8 | Whitespace claim id keeps claims dashboard stable | Edge case |

## DB Query Coverage

Primary query used for this claim-id flow:

select inputfilename, inputseqnumber, providerid, statusflag, batchstatus, payerid, processorid,
       patientname, dateofservice, patientaccountnumber, modeinfo, hintimestamp, insuredname,
       transmitfilename, totalcharges, inputformat, outputformat, inputclaim, rejecterrors,
       warningerrors, processcode, patientbirthdate, patientgender, patientrelationship,
       insuranceplan, reportid, reportfilename, billed, statementdate, routingmethod,
       payerzipcode, sop, claimid, batchnumber, formattype, outputbatchnumber,
       carrierprocessdate, carrierprocesstime, claimstatus, billingnpi, billingtaxid,
       renderingnpi, providerlastname, providerfirstname, providermi, attachments,
       billingproviderlastname, billingproviderfirstname, billingprovidermi, neicid,
       filename277ca, filename277u, xmlfilename, insuredid, patientlastname,
       patientfirstname, patientmi, ediid2, ediid3, payerresp1, payerresp2, payerresp3,
       paymentfilename, csvfilename, claimstatusfilename, mappedoutput,
       interchangesenderid, applicationsendercode, numberofattachments
from sc_app.claims
where claimid = 'G2349622082513321601'

Implemented DB helper:
1. fetchClaimExtendedMenuRowByClaimId(claimId)

## Notes

1. Login uses fixture-based authentication and no inline credentials are used.
2. Hardcoded values from recorder flow were externalized to testData/ClaimsExtendedMenuTestData.json.
3. Read-only assertions ensure no Save/Add/Update action buttons are available in submenu dialogs.
4. afterEach asserts that no browser runtime page errors were thrown.
