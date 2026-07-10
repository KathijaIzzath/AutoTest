# Test File: 04_ClaimsArch_Menu_test.spec.ts

Module: Claim Archive Menu on Dashboard search results - Timely Filing Report
Location: tests/Claims/04_ClaimsArch_Menu_test.spec.ts
Test Data: testData/ClaimsArchMenuTestData.json
Fixture: loginAsAdmin from tests/myTestData.ts
Navigation Helper: navigateToClaimsArchiveDashboard from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Claim Archive filter controls and date range fields are visible and available | Visibility |
| 2 | Apply Filter with claim/group/date values succeeds and preserves entered values | Functional |
| 3 | Apply Filter with claim/group/date values returns row that exists in DB | Functional + DB assertion |
| 4 | Timely Filing report opens from filtered archive row and required fields are visible | End-to-end |
| 5 | Timely Filing report key values are validated against DB projection | End-to-end + DB assertion |
| 6 | Timely Filing optional fields are validated when visible | End-to-end + conditional DB assertion |
| 7 | Empty/blank filters keep archive dashboard stable when Apply Filter is clicked | Edge case |
| 8 | Invalid claim id returns no rows or empty state and DB returns null | Edge case + DB assertion |
| 9 | Whitespace claim id keeps archive dashboard stable and searchable | Edge case |

## DB Query Coverage

Primary query used by DB utility:

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
from sc_app_archive.claims
where claimid = 'G310922512100853040Y'

Implemented DB helpers:
1. fetchClaimArchiveMenuRowByClaimId(claimId)
2. fetchClaimArchiveTimelyFilingRowByClaimId(claimId)

## Reusable Helpers in Spec

1. openClaimsArchive(page)
2. applyFilterAndWait(page)
3. setDateRange(page, startDate, endDate)
4. setArchiveFilters(page, claimId, groupId)
5. searchArchiveByClaim(page, claimId, groupId)
6. openArchiveRowActionMenu(page)
7. openTimelyFilingReport(page)
8. assertTimelyFilingRequiredLabelsVisible(page)
9. assertTimelyFilingCoreValuesMatchDb(page, dbRow)
10. assertOptionalTimelyFilingValuesWhenPresent(page, dbRow)

## Notes

1. Hardcoded recorder values were externalized to testData/ClaimsArchMenuTestData.json.
2. Login uses the shared login fixture and no inline credentials are used.
3. The spec asserts no browser runtime page errors after each test.
4. Recorder flow is preserved in comments and translated into reusable helper-based tests.
