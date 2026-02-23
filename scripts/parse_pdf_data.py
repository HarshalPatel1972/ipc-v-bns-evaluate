import re
import json

def parse():
    with open('extracted_text.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    # Normalize newlines
    content = content.replace('\r\n', '\n')
    
    batches = re.split(r'(?i)BATCH\s*\d+\s*(?:\(\d+-\d+\))?\s*:?', content)
    batches = [b for b in batches if len(b.strip()) > 100]

    models = [
        "ChatGPT 5.2", "ChatG PT 5.2", "Claude Sonnet 4.6", "Grok 4.1", 
        "Indus Sarvam", "Gemini 3", "DeepSeek V3.2", "Kruti", "Meta AI"
    ]

    all_data = []

    for b_idx, b_text in enumerate(batches):
        batch_id = b_idx + 1
        
        # find model index
        # To avoid false positives, we look for model names strictly at the start of a line
        pos = []
        for m in models:
            for match in re.finditer(r'(?m)^' + re.escape(m) + r'\s*$', b_text):
                pos.append((match.start(), match.end(), m))
        pos.sort(key=lambda x: x[0])
        
        questions_text = b_text[:pos[0][0]].strip() if pos else ""
        
        # parse questions
        q_matches = list(re.finditer(r'(?m)^\d+\.\s*(.*?)(?=^\d+\.\s*|\Z)', questions_text, re.S))
        if not q_matches:
            # fallback
            q_matches = list(re.finditer(r'\b\d+\.\s*(.*?)(?=\b\d+\.\s*|\Z)', questions_text, re.S))
        questions = [m.group(1).replace('\n', ' ').strip() for m in q_matches]
        if len(questions) > 20:
            questions = questions[:20]
            
        model_answers = {}
        for i, p in enumerate(pos):
            start = p[1]
            end = pos[i+1][0] if i+1 < len(pos) else len(b_text)
            mname = p[2]
            if mname == "ChatG PT 5.2":
                mname = "ChatGPT 5.2"
                
            ans_text = b_text[start:end].strip()
            
            # extract answers
            answers = extract_20_answers(ans_text)
            
            # Fill remaining with empty strings to ensure it has exactly 20
            while len(answers) < 20:
                answers.append("No answer extracted")
                
            model_answers[mname] = answers
            
        all_data.append({
            "batchId": batch_id,
            "questions": questions,
            "modelAnswers": model_answers
        })
        
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2)

def extract_20_answers(text):
    # Remove table headers
    text = re.sub(r'(?m)^# Offence.*$', '', text)
    
    # Try splitting by numbered bullet points like "1 ", "1.", "1)" at start of line
    numbered_matches = list(re.finditer(r'(?m)^(\d{1,2})[\.\)]?\s+(.*?)(?=^\d{1,2}[\.\)]?\s+|\Z)', text, re.S))
    if len(numbered_matches) >= 15:
        return [clean_answer(m.group(2)) for m in numbered_matches][:20]
        
    # Try splitting by bullet points
    bullet_matches = list(re.finditer(r'(?m)^[•*-]\s*(.*?)(?=^[•*-]\s*|\Z)', text, re.S))
    if len(bullet_matches) >= 15:
        return [clean_answer(m.group(1)) for m in bullet_matches][:20]
        
    parts = re.split(r'\n\s*\n', text)
    parts = [p.strip() for p in parts if p.strip()]
    if 18 <= len(parts) <= 22:
        return [clean_answer(p) for p in parts][:20]
        
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if 18 <= len(lines) <= 22:
        return [clean_answer(l) for l in lines][:20]
        
    # Advanced heuristic for deeply wrapped text
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
        
    if len(merged) >= 15:
        return [clean_answer(m) for m in merged][:20]
        
    return [clean_answer(l) for l in lines][:20]

def clean_answer(ans):
    ans = ans.replace('\n', ' ').strip()
    return format_section_string(ans)

def format_section_string(ans):
    # Try to extract the format: "Section Section Number Any attribute if there is"
    # Example "Section 103 (Punishment for murder)"
    s_match = re.search(r'(?i)(Section\s+\d+[a-zA-Z\(\)]*(.*))', ans)
    if s_match:
        return s_match.group(1).strip()
    return ans

parse()
