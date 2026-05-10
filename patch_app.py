"""Patch script — run once to wire new intelligence engine into app.py dashboard route."""
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# ── Patch 1: dashboard first analysis block ──────────────────────────────────
OLD1 = "            comprehensive_analysis = comprehensive_ats_analysis(text, keywords)\n"
NEW1 = (
    "            # NEW: use universal intelligence engine\n"
    "            if INTELLIGENCE_ENGINE_ACTIVE:\n"
    "                _analysis = full_resume_analysis(text)\n"
    "            else:\n"
    "                _analysis = comprehensive_ats_analysis(text, keywords)\n"
    "            comprehensive_analysis = _analysis\n"
    "            # Map new keys to legacy keys so template still works\n"
    "            comprehensive_analysis.setdefault('improvements', _analysis.get('improvement_feedback', []))\n"
)

count1 = content.count(OLD1)
print(f"Patch 1 occurrences: {count1}")
content = content.replace(OLD1, NEW1)

# ── Patch 2: inject new overview keys into last_analysis dict ────────────────
# After the existing last_analysis dict, add new fields
OLD2 = '                "job_roles_data": comprehensive_analysis.get(\'job_roles_data\', [])\n            }'
NEW2 = (
    "                \"job_roles_data\": comprehensive_analysis.get('job_roles_data', []),\n"
    "                # New overview fields from intelligence engine\n"
    "                \"strengths\": comprehensive_analysis.get('strengths', []),\n"
    "                \"weaknesses\": comprehensive_analysis.get('weaknesses', []),\n"
    "                \"how_to_improve\": comprehensive_analysis.get('how_to_improve', []),\n"
    "                \"ats_breakdown\": comprehensive_analysis.get('ats_breakdown', {}),\n"
    "                \"education_level\": comprehensive_analysis.get('education_level', ''),\n"
    "                \"years_experience\": comprehensive_analysis.get('years_experience', 0),\n"
    "                \"seniority_level\": comprehensive_analysis.get('seniority_level', ''),\n"
    "            }"
)

count2 = content.count(OLD2)
print(f"Patch 2 occurrences: {count2}")
content = content.replace(OLD2, NEW2)

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done patching app.py")
