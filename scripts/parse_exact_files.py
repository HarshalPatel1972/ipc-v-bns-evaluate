import re
import json
import os

def parse():
    models = [
        "ChatGPT 5.2", "Claude Sonnet 4.6", "Grok 4.1", 
        "Indus Sarvam", "Gemini 3", "DeepSeek V3.2", "Kruti", "Meta AI"
    ]

    all_data = []

    for batch_id in range(1, 6):
        filename = f'batch-{batch_id}.txt'
        if not os.path.exists(filename):
            print(f"File {filename} not found.")
            continue
            
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract Questions
        first_model_pos = len(content)
        for m in models:
            pattern = r'(?im)^' + re.escape(m) + r'\s*$'
            match = re.search(pattern, content)
            if match and match.start() < first_model_pos:
                first_model_pos = match.start()
                
        questions_text = content[:first_model_pos].strip()
        
        # Replace the BATCH line
        questions_text = re.sub(r'(?i)^BATCH.*?\n', '', questions_text).strip()
        
        # Parse questions
        q_lines = [q.strip() for q in questions_text.split('\n') if q.strip()]
        questions = []
        for line in q_lines:
            # Only match numbering pattern exactly at the very start of the string, e.g., '1.', '2)', ' 1 '
            q = re.sub(r'^\s*\d+[\.\)]?\s+', '', line).strip()
            if q and len(q) > 10:
                questions.append(q)
                
        if len(questions) > 20: 
            questions = questions[:20]

        # Find model sections
        pos = []
        for m in models:
            for match in re.finditer(r'(?im)^' + re.escape(m) + r'\s*$', content):
                pos.append((match.start(), match.end(), m))
        
        pos.sort(key=lambda x: x[0])
        
        model_answers = {}
        for m in models:
            model_answers[m] = []

        for i, p in enumerate(pos):
            start = p[1]
            end = pos[i+1][0] if i+1 < len(pos) else len(content)
            mname = p[2]
            
            ans_text = content[start:end].strip()
            answers = extract_20_answers(ans_text)
            
            while len(answers) < 20:
                answers.append("No answer extracted")
                
            model_answers[mname] = answers
            
        all_data.append({
            "batchId": batch_id,
            "questions": questions,
            "modelAnswers": model_answers
        })
        
    with open('src/lib/data.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2)

def extract_20_answers(text):
    text = re.sub(r'(?im)^# Offence.*$', '', text) # Remove Claude table headers
    text = re.sub(r'(?im)^#.*Query.*$', '', text) 
    
    numbered_matches = list(re.finditer(r'(?m)^(\d{1,2})[\.\)]?\s+(.*?)(?=^\d{1,2}[\.\)]?\s+|\Z)', text, re.S))
    if len(numbered_matches) >= 15:
        return [clean_answer(m.group(2)) for m in numbered_matches][:20]
        
    bullet_matches = list(re.finditer(r'(?m)^[•*-]\s*(.*?)(?=^[•*-]\s*|\Z)', text, re.S))
    if len(bullet_matches) >= 15:
        return [clean_answer(m.group(1)) for m in bullet_matches][:20]
        
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    if len(lines) < 15:
        # Paragraph splitting for Meta AI
        sentences = re.split(r'(?<=\.)\s+(?=[A-Z])', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        if len(sentences) >= 15:
            return [clean_answer(s) for s in sentences][:20]
            
    merged = []
    current = ""
    for l in lines:
        if (re.match(r'^[A-Z]', l) or "Section" in l) and current.endswith(('.', ';', ':')):
            merged.append(current)
            current = l
        elif not current:
            current = l
        else:
            current += " " + l
    if current:
        merged.append(current)
        
    if len(merged) >= 15 and len(lines) > 22:
        return [clean_answer(m) for m in merged][:20]
        
    return [clean_answer(l) for l in lines][:20]

def clean_answer(ans):
    ans = ans.replace('\n', ' ').strip()
    return format_section_string(ans)

def format_section_string(ans):
    # If the answer is just a section number, keep it as is.
    # If it has descriptions, keep the whole thing.
    # Only clean if it looks like a messy crawl or has very specific prefix/suffix junk.
    return ans.strip()

def format_case(s):
    s = s.upper().replace("SECTION", "Section")
    return s.strip()

if __name__ == "__main__":
    parse()
