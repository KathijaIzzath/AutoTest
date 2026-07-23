"""
Correct audit: For each testData JSON file, find label KEYS whose VALUES
contain '*'. Then check the corresponding spec file for references to those
exact keys (e.g. d.labels.practiceManagementSelect).
"""
import os, re, json

DATA  = r"C:\AutoTest\testData"
SPECS = r"C:\AutoTest\tests"

# Map JSON filenames to which spec files they most likely correspond to
# (heuristic: shared stem after stripping suffixes)
def json_to_spec_patterns(jfile):
    stem = jfile.replace("TestData.json","").replace(".json","")
    patterns = {
        "AcctAdd":          ["Account/02_Acct_add"],
        "AcctEdit":         ["Account/03_Acct_Edit"],
        "AddInsurance":     ["Insurance/02_AddInsurance"],
        "AddPayer":         ["Payer/02_AddPayer"],
        "AddProvider":      ["Provider/02_AddProvider"],
        "CreatePGroup":     ["ProviderGroup/02_Create_PGroup"],
        "Dashboard":        ["02_LandingDashboard"],
        "EditGroup":        ["ProviderGroup/03_EditGroup"],
        "EditProvider":     ["Provider/03_EditProvider"],
        "FinancialDshbd":   ["Finance/01_FinancialDshbd","Finance/02_FinancialDshbd"],
        "SinglePayEnroll":  ["GroupEnrollment/02_addSinglePayEnroll"],
    }
    for key, specs in patterns.items():
        if key.lower() in stem.lower():
            return specs
    return []

# Collect all spec file contents
spec_contents = {}
for root, dirs, files in os.walk(SPECS):
    for f in files:
        if not f.endswith(".spec.ts"): continue
        p = os.path.join(root, f)
        rel = p.replace(SPECS + os.sep, "").replace("\\","/")
        spec_contents[rel] = open(p, encoding="utf-8").read()

print("=" * 70)
print("REQUIRED-FIELD (* ) ASSERTION AUDIT")
print("=" * 70)

all_ok = True

for jfile in sorted(os.listdir(DATA)):
    if not jfile.endswith(".json"): continue
    try:
        d = json.load(open(os.path.join(DATA, jfile), encoding="utf-8"))
    except:
        continue

    # Find all label keys whose values start with '*'
    labels = d.get("labels", {})
    star_keys = {k: v for k, v in labels.items() if isinstance(v, str) and v.startswith("* ")}
    if not star_keys:
        continue

    target_specs = json_to_spec_patterns(jfile)

    print(f"\n  JSON: {jfile}")
    print(f"  Required label keys: {list(star_keys.keys())}")
    print(f"  → Values: {list(star_keys.values())}")

    if not target_specs:
        print(f"  ⚠  No spec mapping found")
        continue

    for spec_pat in target_specs:
        # Find matching spec file
        matching = [rel for rel in spec_contents if spec_pat.replace("/","\\") in rel.replace("/","\\")]
        if not matching:
            matching = [rel for rel in spec_contents if spec_pat.split("/")[-1].lower() in rel.lower()]
        if not matching:
            print(f"  ⚠  Spec not found for pattern: {spec_pat}")
            continue

        for spec_rel in matching:
            content = spec_contents[spec_rel]
            print(f"\n  Spec: {spec_rel}")
            gaps = []
            for key, val in star_keys.items():
                # Check: d.labels.KEY referenced in spec
                ref_pattern = rf"d\.labels\.{re.escape(key)}"
                direct_pattern = re.escape(val)
                if re.search(ref_pattern, content) or re.search(direct_pattern, content):
                    print(f"    ✅  '{val}' (d.labels.{key}) → ASSERTED")
                else:
                    print(f"    ❌  '{val}' (d.labels.{key}) → MISSING ASSERTION")
                    gaps.append((key, val))
                    all_ok = False

            if gaps:
                print(f"  → ACTION NEEDED: Add assertions for {[v for _,v in gaps]}")

print("\n" + "=" * 70)
if all_ok:
    print("✅  ALL REQUIRED (*) FIELDS ARE ASSERTED IN THEIR SPEC FILES")
else:
    print("❌  GAPS FOUND — see above for ACTION NEEDED items")
print("=" * 70)
