from resume_intelligence import full_resume_analysis

text = """
John Doe
Software Engineer
Experience: 5 years of Python, Django, and React development.
Education: Bachelors in Computer Science.
Projects: Built an e-commerce backend in Django.
"""
import sys
import io

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("Starting analysis...")
res = full_resume_analysis(text)
print("Keys:", list(res.keys()))
