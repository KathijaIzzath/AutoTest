import os, re

data_root = r"C:\AutoTest\testData"
spec_root = r"C:\AutoTest\tests"

print("=== REQUIRED (* ) LABELS IN JSON TEST DATA ===")
required_by_json = {}
for f in sorted(os.listdir(data_root)):
    if not f.endswith(".json"):
        continue
    try:
        raw = open(os.path.join(data_root, f), encoding="utf-8").read()
        m = re.findall(r'"(\* [^"]+)"', raw)
        if m:
            required_by_json[f] = m
            print(f"  {f}: {m}")
    except:
        pass

print()
print("=== STAR-LABEL ASSERTIONS IN SPEC FILES ===")
for root, dirs, files in os.walk(spec_root):
    for f in sorted(files):
        if not f.endswith(".spec.ts"):
            continue
        p = os.path.join(root, f)
        raw = open(p, encoding="utf-8").read()
        # direct string assertions for * labels
        direct = re.findall(r"getByText\(['\"](\* [^'\"]+)['\"]", raw)
        # references via d.labels.xxxRequired
        label_refs = re.findall(r"d\.labels\.(\w*[Rr]equired\w*)", raw)
        rel = p.replace(spec_root + os.sep, "")
        has = bool(direct or label_refs)
        marker = "OK" if has else "MISSING"
        print(f"  [{marker}] {rel}")
        if direct:
            print(f"          direct: {direct}")
        if label_refs:
            print(f"          via d.labels: {label_refs}")
