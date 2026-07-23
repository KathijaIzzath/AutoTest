"""
Full mandatory-field audit for the AutoTest suite.

Checks THREE sources of * labels:
  1. JSON test-data files (d.labels.* with values starting '* ')
  2. Hardcoded getByText('* ...') calls in spec files
  3. Form spec files that have a submit/save button but NO * assertion at all
     → these are flagged for manual review
"""
import os, re, json

DATA  = r"C:\AutoTest\testData"
SPECS = r"C:\AutoTest\tests"

# ── helpers ────────────────────────────────────────────────────────────────────

def walk_specs():
    for root, _, files in os.walk(SPECS):
        for f in sorted(files):
            if not f.endswith(".spec.ts"):
                continue
            p = os.path.join(root, f)
            rel = p.replace(SPECS + os.sep, "").replace("\\", "/")
            yield rel, open(p, encoding="utf-8").read()

def walk_json():
    for f in sorted(os.listdir(DATA)):
        if not f.endswith(".json"):
            continue
        try:
            yield f, json.load(open(os.path.join(DATA, f), encoding="utf-8"))
        except:
            pass

# Submit/save button patterns that indicate a form screen
SUBMIT_PATTERNS = re.compile(
    r"getByRole\(['\"]button['\"],\s*\{[^}]*name[^}]*"
    r"(?:Save|Add|Submit|Generate|Log\s*In|Next|Create)[^}]*\}",
    re.IGNORECASE,
)

# * label detection patterns
STAR_DIRECT = re.compile(r"getByText\(['\"](\* [^'\"]+)['\"]")
STAR_REF    = re.compile(r"d\.labels\.(\w+)")

# ── 1. Collect all * values from JSON test data ────────────────────────────────
json_star_keys = {}   # jfile -> {key: value}
for jfile, data in walk_json():
    labels = data.get("labels", {})
    stars = {k: v for k, v in labels.items()
             if isinstance(v, str) and v.strip().startswith("* ")}
    if stars:
        json_star_keys[jfile] = stars

# ── 2. For each spec, collect: direct * strings, d.labels refs, has-form flag ─
spec_data = {}
for rel, content in walk_specs():
    direct_stars = STAR_DIRECT.findall(content)
    label_refs   = STAR_REF.findall(content)
    has_form     = bool(SUBMIT_PATTERNS.search(content))
    spec_data[rel] = dict(
        content=content,
        direct_stars=direct_stars,
        label_refs=label_refs,
        has_form=has_form,
    )

# ── 3. For each spec that touches a JSON, check all * keys are referenced ─────
# Build a reverse map: spec-stem -> json star keys
SPEC_JSON_MAP = {
    "Account/02_Acct_add":           ["AcctAddTestData.json"],
    "Account/03_Acct_Edit":          ["AcctEditTestData.json"],
    "Provider/02_AddProvider":       ["AddProviderTestData.json"],
    "Provider/03_EditProvider":      ["EditProviderTestData.json"],
    "ProviderGroup/02_Create_PGroup":["CreatePGroupTestData.json"],
    "ProviderGroup/03_EditGroup":    ["EditGroupTestData.json"],
    "Finance/01_FinancialDshbd":     ["FinancialDshbdTestData.json"],
    "Finance/02_FinancialDshbd":     ["FinancialDshbdTestData.json"],
    "02_LandingDashboard":           ["DashboardTestData.json"],
    "GroupEnrollment/02_addSinglePayEnroll": ["SinglePayEnrollTestData.json"],
    "Insurance/02_AddInsurance":     ["AddInsuranceTestData.json"],
    "Payer/02_AddPayer":             ["AddPayerTestData.json"],
}

print("=" * 72)
print("COMPLETE MANDATORY-FIELD (* ) ASSERTION AUDIT")
print("=" * 72)

gaps = []

# ── A. JSON-based checks ──────────────────────────────────────────────────────
print("\n── A. JSON-sourced required fields ──────────────────────────────────────")
for spec_stem, jfiles in sorted(SPEC_JSON_MAP.items()):
    # find the spec file
    matching = [rel for rel in spec_data
                if spec_stem.replace("/","\\") in rel.replace("/","\\")
                or spec_stem.split("/")[-1] in rel]
    if not matching:
        print(f"\n  ⚠  Spec not found: {spec_stem}")
        continue

    for spec_rel in matching:
        sd      = spec_data[spec_rel]
        content = sd["content"]
        print(f"\n  {spec_rel}")

        for jfile in jfiles:
            star_keys = json_star_keys.get(jfile, {})
            if not star_keys:
                print(f"    (no * labels in {jfile})")
                continue
            for key, val in star_keys.items():
                ref_ok  = bool(re.search(rf"d\.labels\.{re.escape(key)}", content))
                str_ok  = val in content
                if ref_ok or str_ok:
                    print(f"    ✅  '{val}' (d.labels.{key})")
                else:
                    print(f"    ❌  '{val}' (d.labels.{key})  ← MISSING")
                    gaps.append((spec_rel, f"d.labels.{key}", val))

# ── B. Hardcoded * strings in spec files ─────────────────────────────────────
print("\n── B. Hardcoded * strings asserted in spec files ────────────────────────")
for rel, sd in sorted(spec_data.items()):
    if sd["direct_stars"]:
        print(f"  {rel}")
        for s in sorted(set(sd["direct_stars"])):
            print(f"    ✅  '{s}'  (hardcoded string)")

# ── C. Form specs with NO * assertion at all ─────────────────────────────────
print("\n── C. Form spec files with submit button but ZERO * assertion ───────────")
no_star_forms = []
for rel, sd in sorted(spec_data.items()):
    if not sd["has_form"]:
        continue
    has_any_star = bool(sd["direct_stars"]) or any(
        # check if any referenced label key has a * value in any json
        any(k in jkeys for jkeys in json_star_keys.values())
        for k in sd["label_refs"]
    )
    if not has_any_star:
        # double check: does the spec text contain any literal '* '?
        if "* " not in sd["content"]:
            no_star_forms.append(rel)

for rel in no_star_forms:
    print(f"  ⚠  {rel}  — has form/submit but no * label assertion found")
    gaps.append((rel, "any", "* label assertion missing"))

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 72)
if gaps:
    print(f"❌  {len(gaps)} gap(s) found:")
    for spec, key, val in gaps:
        print(f"  {spec}: {key} = '{val}'")
else:
    print("✅  ALL REQUIRED (*) FIELD LABELS ARE ASSERTED ACROSS THE SUITE")
print("=" * 72)
