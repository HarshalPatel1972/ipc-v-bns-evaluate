import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os

# Set style for academic papers
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_context("paper", font_scale=1.5)
sns.set_palette("deep")

def calculate_metrics(json_file_path):
    print("Loading evaluation data...")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    models = data['models']
    
    # Initialize metric tracking
    results = {m: {'correct': 0, 'somewhat correct': 0, 'wrong': 0, 'no answer': 0, 'total': 0} for m in models}

    # Parse JSON
    for batch in data['batches']:
        for question in batch['questions']:
            for model, eval_data in question['evaluations'].items():
                if model in results:
                    grade = eval_data.get('evaluation')
                    if grade in results[model]:
                        results[model][grade] += 1
                        results[model]['total'] += 1
                    else:
                        # Handle null/None as no answer
                        results[model]['no answer'] += 1
                        results[model]['total'] += 1
                        
    # Calculate Benchmarks
    benchmarks = []
    
    for m in models:
        r = results[m]
        total = max(r['total'], 1) # Prevent div by zero
        
        alps = (r['correct'] / total) * 100
        lhfr = (r['wrong'] / total) * 100
        gsam = (r['somewhat correct'] / total) * 100
        sar = (r['no answer'] / total) * 100
        
        # Weighted Legal Competency Index (WLCI)
        # Correct = +1.0, Somewhat = +0.5, No Answer = 0, Wrong = -1.0
        # Scaled to a recognizable index (-100 to 100, then normalized to 0-100)
        raw_wlci = (r['correct'] * 1.0) + (r['somewhat correct'] * 0.5) + (r['no answer'] * 0) + (r['wrong'] * -1.0)
        wlci = max(0, min(100, (raw_wlci / total) * 100)) # Simplified to bounded 0-100 for easy reading
        
        benchmarks.append({
            'Model': m,
            'ALPS (%)': alps,
            'LHFR (%)': lhfr,
            'GSAM (%)': gsam,
            'SAR (%)': sar,
            'WLCI Score': wlci,
            'Total Graded': total
        })
        
    df = pd.DataFrame(benchmarks)
    df = df.sort_values(by='WLCI Score', ascending=False).reset_index(drop=True)
    return df, results

def generate_ieee_visualizations(df, raw_results, output_dir="charts"):
    print(f"Generating charts in '{output_dir}' directory...")
    os.makedirs(output_dir, exist_ok=True)
    
    models = df['Model'].tolist()
    
    # 1. Stacked Bar Chart (Distribution of Responses)
    fig, ax = plt.subplots(figsize=(12, 7))
    
    # Prepare data for stacked bars
    correct = [raw_results[m]['correct'] for m in models]
    somewhat = [raw_results[m]['somewhat correct'] for m in models]
    wrong = [raw_results[m]['wrong'] for m in models]
    no_ans = [raw_results[m]['no answer'] for m in models]
    
    # Colors for academic publishing (colorblind friendly)
    colors = ['#2ca02c', '#1f77b4', '#d62728', '#7f7f7f']
    
    p1 = ax.bar(models, correct, color=colors[0], label='Strict Correct')
    p2 = ax.bar(models, somewhat, bottom=correct, color=colors[1], label='Partially Correct')
    p3 = ax.bar(models, wrong, bottom=np.array(correct)+np.array(somewhat), color=colors[2], label='Hallucination (Wrong)')
    p4 = ax.bar(models, no_ans, bottom=np.array(correct)+np.array(somewhat)+np.array(wrong), color=colors[3], label='Safety / No Answer')
    
    ax.set_ylabel('Percentage / Question Count (n=100)', fontweight='bold')
    ax.set_title('Fig 1: Distribution of AI Performance in BNS Section Retrieval', fontweight='bold', pad=20)
    ax.legend(loc='upper right', bbox_to_anchor=(1.25, 1))
    
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/fig1_performance_distribution.png", dpi=300, bbox_inches='tight')
    plt.close()

    # 2. Bubble Chart: ALPS vs LHFR (Precision vs Danger)
    fig, ax = plt.subplots(figsize=(10, 8))
    
    scatter = ax.scatter(df['ALPS (%)'], df['LHFR (%)'], 
                         s=df['WLCI Score']*10, # Size = overall score
                         alpha=0.6, 
                         c=df['WLCI Score'], 
                         cmap='viridis')
    
    # Add labels to points
    for i, txt in enumerate(models):
        ax.annotate(txt, (df['ALPS (%)'][i], df['LHFR (%)'][i]), xytext=(5, 5), textcoords='offset points')
        
    ax.set_xlabel('Absolute Legal Precision Score (ALPS) % -> Better', fontweight='bold')
    ax.set_ylabel('Legal Hallucination Rate (LHFR) % -> Worse', fontweight='bold')
    ax.set_title('Fig 2: AI Safety vs Precision (Bubble Size = Overall WLCI Score)', fontweight='bold', pad=20)
    
    # Add quadrants lines
    ax.axhline(y=df['LHFR (%)'].mean(), color='r', linestyle='--', alpha=0.3)
    ax.axvline(x=df['ALPS (%)'].mean(), color='r', linestyle='--', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/fig2_precision_vs_danger.png", dpi=300)
    plt.close()
    
    # 3. Bar Chart: WLCI Score Ranking
    fig, ax = plt.subplots(figsize=(12, 6))
    
    bars = ax.bar(models, df['WLCI Score'], color=sns.color_palette("viridis", len(models)))
    
    ax.set_ylabel('WLCI Index Score', fontweight='bold')
    ax.set_title('Fig 3: Weighted Legal Competency Index (WLCI) Rankings', fontweight='bold', pad=20)
    
    # Add score on top of bars
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, yval + 1, f'{round(yval, 1)}', ha='center', va='bottom', fontweight='bold')
        
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(f"{output_dir}/fig3_wlci_rankings.png", dpi=300)
    plt.close()

    print("Charts generated successfully!")

if __name__ == "__main__":
    file_path = "bns_eval_results_complete_1771940199597.json"
    
    if os.path.exists(file_path):
        df, raw = calculate_metrics(file_path)
        print("\n--- IEEE/Scopus Metrics Table ---")
        print(df.to_string(index=False))
        
        # Save table to CSV for easy import to Excel/Word
        df.to_csv("benchmark_metrics_table.csv", index=False)
        print("\nTable saved locally as 'benchmark_metrics_table.csv'")
        
        generate_ieee_visualizations(df, raw)
    else:
        print(f"Error: Could not find {file_path}")
