# Test File: 02_ClaimsArch_Dshbd_test.spec.ts

Module: Claims Archive Dashboard
Location: tests/Claims/02_ClaimsArch_Dshbd_test.spec.ts
Test Data: testData/ClaimsArchDshbdTestData.json
Fixture: loginAsAdmin from tests/myTestData.ts
Navigation Helper: navigateToClaimsArchiveDashboard from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Claims Archive controls, fields, and actions are visible and available | Visibility |
| 2 | Apply filter with claim id and group id validates archive UI row against DB values | Functional + DB assertion |
| 3 | Patient account plus group filter works and sorting headers remain functional | Functional + Sorting |
| 4 | Expanded archive claim shows message history and details panel options | End-to-end functional |
| 5 | Invalid claim id returns no rows or empty state | Edge case |
| 6 | Whitespace claim id keeps archive dashboard stable | Edge case |

## DB Query Coverage

Primary archive query used:

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

Implemented DB helper:
1. fetchClaimArchiveDashboardRowByClaimId(claimId, groupId)

## Reusable Helpers in Spec

1. openClaimsArchiveDashboard(page)
2. applyFilterAndWait(page)
3. setFilterValue(page, name, value)
4. clearArchiveFilters(page)
5. searchByClaimAndGroup(page, claimId, groupId)
6. searchByPatientAccountAndGroup(page, patientAccount, groupId)
7. assertGridHeadersVisible(page)
8. assertArchiveClaimRowMatchesDb(page, claimId, groupId)
9. openArchiveClaimDetailsPanel(page)

## Notes

1. Hardcoded values are externalized in testData/ClaimsArchDshbdTestData.json.
2. Login uses fixture-based authentication from tests/myTestData.ts.
3. Assertions include afterEach browser runtime error checks.
4. Test design supports stable reruns and environment variation in details panel rendering.
