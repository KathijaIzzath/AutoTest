# Test File: 01_Claims_Dshbd_test.spec.ts

Module: Claims Dashboard
Location: tests/Claims/01_Claims_Dshbd_test.spec.ts
Test Data: testData/ClaimsDshbdTestData.json
Fixture: loginAsAdmin from tests/myTestData.ts
Navigation Helpers:
1. navigateToClaimsDashboard from tests/framework/navigation.helper.ts
2. navigateToClaimStatusRouting from tests/framework/navigation.helper.ts

## Test Cases Implemented

| # | Test Name | Type |
|---|-----------|------|
| 1 | Claims Dashboard controls, fields, and actions are visible and available | Visibility |
| 2 | Apply filter by claim id validates UI row against DB values | Functional + DB assertion |
| 3 | Removing claim id and applying filter keeps grid stable and sortable | Functional + Sorting |
| 4 | Show Worked Only filter applies successfully and returns stable results | Functional |
| 5 | Invalid claim id filter returns no rows or empty state | Edge case |
| 6 | Whitespace claim id filter keeps dashboard stable | Edge case |
| 7 | Claim details panel selector options are available for filtered claim row | Functional |
| 8 | Cross-check Claim Status Routing SKSC0 rows against DB values | Cross-module DB assertion |

## DB Query Coverage

Claims query used (by claim id):

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
       interchangesenderid, applicationsendercode, numberofattachments, worked
from sc_app.claims
where claimid = 'G248212605010354254A'

Additional SKSC0 cross-validation query (Claim Status Routing):

select id, scid, groupid, processorid, ediid, online_batch, payername, recordstatus, nm1_upper
from sc_app.claimstatus_routing
where scid = 'SKSC0'

## DB Utility Functions

1. fetchClaimDashboardRowByClaimId(claimId)
2. fetchOneWorkedClaim()
3. fetchClaimStatusRoutingRowsByScId(scId)

All located in testData/database.utils.ts.

## Reusable Helpers in Spec

1. openClaimsDashboard(page)
2. applyFilterAndWait(page)
3. setFilterValue(page, name, value)
4. clearDashboardFilters(page)
5. searchByClaimId(page, claimId)
6. setShowWorkedOnly(page, checked)
7. assertGridHeadersVisible(page)
8. assertClaimRowMatchesDb(page, claimId)
9. assertClaimStatusRoutingSkSc0MatchesDb(page)

## Notes

1. Hardcoded values are externalized into testData/ClaimsDshbdTestData.json.
2. Login uses the shared fixture and no inline credentials are used in the spec.
3. Assertions include no browser runtime page errors after each test.
4. Tests are designed for repeated reruns with stable helper-driven filter flows.
