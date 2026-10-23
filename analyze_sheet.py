import urllib.request
import ssl
import csv
import io
import json

URL = "https://docs.google.com/spreadsheets/d/1sWeq6LCPTp0I6ith07XQizLm-KcDvAcbeNZBHkOBOvk/gviz/tq?tqx=out:csv&sheet=data&headers=1"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, context=ctx) as resp:
    data = resp.read().decode("utf-8")

# Save raw CSV for backup/inspection
with open("/Users/kimkyunghwa/Antigravity/Site development/2026-10-23/sample_data.csv", "w", encoding="utf-8") as f:
    f.write(data)

reader = csv.DictReader(io.StringIO(data))
fieldnames = reader.fieldnames
rows = list(reader)

print(f"Total Rows: {len(rows)}")
print(f"Columns ({len(fieldnames)}): {fieldnames}")

categories = set()
targets = set()
types = set()
methods = set()
departments = set()

for r in rows:
    if "분야" in r and r["분야"]: categories.add(r["분야"])
    if "대상" in r and r["대상"]: targets.add(r["대상"])
    if "이수구분" in r and r["이수구분"]: types.add(r["이수구분"])
    if "교육방식" in r and r["교육방식"]: methods.add(r["교육방식"])
    if "담당부서" in r and r["담당부서"]: departments.add(r["담당부서"])

summary = {
    "columns": fieldnames,
    "total_count": len(rows),
    "unique_fields": {
        "분야 (Category)": sorted(list(categories)),
        "대상 (Target)": sorted(list(targets)),
        "이수구분 (Type)": sorted(list(types)),
        "교육방식 (Method)": sorted(list(methods)),
        "담당부서 (Department)": sorted(list(departments))
    },
    "course_names": [f"{r['과정코드']}: {r['과정명']} ({r['분야']} / {r['이수구분']})" for r in rows]
}

with open("/Users/kimkyunghwa/Antigravity/Site development/2026-10-23/sheet_summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print(json.dumps(summary["unique_fields"], ensure_ascii=False, indent=2))

