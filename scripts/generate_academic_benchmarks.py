import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os
from math import pi

# Set style for academic papers
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_context("paper", font_scale=1.2)
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
                        results[model]['no answer'] += 1
                        results[model]['total'] += 1
                        
    benchmarks = []
    
    for m in models:
        r = results[m]
        total = max(r['total'], 1)
        
        lct = (r['correct'] / total) * 100
        echr = (r['wrong'] / total) * 100
        sgg = (r['somewhat correct'] / total) * 100
        acr = (r['no answer'] / total) * 100
        
        # Raw LBAS to show why it's 0
        raw_lbas = (r['correct'] * 1.0) + (r['somewhat correct'] * 0.5) + (r['no answer'] * 0) + (r['wrong'] * -1.0)
        lbas = max(0, min(100, (raw_lbas / total) * 100))
        
        benchmarks.append({
            'Model': m,
            'LCT (%)': lct,
            'ECHR (%)': echr,
            'SGG (%)': sgg,
            'ACR (%)': acr,
            'Raw Net Score': (raw_lbas / total) * 100,
            'LBAS Score': lbas,
            'Total Graded': total
        })
        
    df = pd.DataFrame(benchmarks)
    df = df.sort_values(by='LBAS Score', ascending=False).reset_index(drop=True)
    return df, results

def generate_diverging_bar_chart(df, raw_results, output_dir="charts"):
    """
    Diverging bar chart shows Truthful (Positive) vs Hallucinated (Negative).
    This visually explains why heavily hallucinating models score 0.
    """
    fig, ax = plt.subplots(figsize=(12, 7))
    models = df['Model'].tolist()
    
    # Truthful components (Positive X)
    lct = df['LCT (%)'].values
    sgg = df['SGG (%)'].values
    
    # Hallucination component (Negative X)
    echr = -df['ECHR (%)'].values
    acr = np.zeros(len(models)) # zero centered
    
    # Plotting
    ax.barh(models, lct, color='#10b981', label='Strict Correct (LCT: +1.0)')
    ax.barh(models, sgg, left=lct, color='#3b82f6', label='Partially Correct (SGG: +0.5)')
    ax.barh(models, echr, color='#ef4444', label='Extrinsic Hallucination (ECHR: -1.0)')
    
    # Add vertical line at 0
    ax.axvline(0, color='black', linewidth=1.5)
    
    ax.set_xlabel('Percentage Contribution to Score', fontweight='bold')
    ax.set_title('Fig 1: Diverging Analysis of Legal Reliability (Truth vs. Hallucination)', fontweight='bold', pad=20)
    ax.legend(loc='lower center', bbox_to_anchor=(0.5, -0.2), ncol=3)
    
    # Formatting x-axis to show positive numbers on both sides
    ticks = ax.get_xticks()
    ax.set_xticklabels([str(abs(int(tick))) + '%' for tick in ticks])
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/fig1_diverging_reliability.png", dpi=300, bbox_inches='tight')
    plt.close()

def generate_radar_chart(df, output_dir="charts"):
    """
    Radar chart to compare multiple dimensions for the top models.
    """
    top_models = df.head(4) # Only take top 4 to prevent clutter
    
    # Metrics to plot. We invert ECHR so that "outer" is always better.
    # Inverse ECHR = 100 - ECHR
    metrics = ['LCT (%)', 'SGG (%)', 'ACR (%)', 'Inverse_ECHR']
    
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
    
    N = len(metrics)
    angles = [n / float(N) * 2 * pi for n in range(N)]
    angles += angles[:1] # Close the loop
    
    ax.set_theta_offset(pi / 2)
    ax.set_theta_direction(-1)
    
    plt.xticks(angles[:-1], ['Truthfulness\n(LCT)', 'Groundedness\n(SGG)', 'Safe Abstention\n(ACR)', 'Safety from Fake Citations\n(100 - ECHR)'], 
               size=10, fontweight='bold')
    
    ax.set_rlabel_position(0)
    plt.yticks([25, 50, 75, 100], ["25", "50", "75", "100"], color="grey", size=8)
    plt.ylim(0, 100)
    
    colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899']
    
    for i, row in top_models.iterrows():
        values = [row['LCT (%)'], row['SGG (%)'], row['ACR (%)'], 100 - row['ECHR (%)']]
        values += values[:1]
        
        ax.plot(angles, values, linewidth=2, linestyle='solid', label=row['Model'], color=colors[i])
        ax.fill(angles, values, color=colors[i], alpha=0.1)
        
    plt.title('Fig 2: Multidimensional Legal Competency (Top 4 Models)', size=14, fontweight='bold', y=1.1)
    plt.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/fig2_radar_competency.png", dpi=300, bbox_inches='tight')
    plt.close()

def generate_ieee_visualizations(df, raw_results, output_dir="charts"):
    print(f"Generating charts in '{output_dir}' directory...")
    os.makedirs(output_dir, exist_ok=True)
    
    generate_diverging_bar_chart(df, raw_results, output_dir)
    generate_radar_chart(df, output_dir)

    print("Charts generated successfully!")

if __name__ == "__main__":
    file_path = "bns_eval_results_complete_1771940199597.json"
    
    if os.path.exists(file_path):
        df, raw = calculate_metrics(file_path)
        print("\n--- IEEE/Scopus Metrics Table ---")
        print(df.to_string(index=False))
        
        df.to_csv("benchmark_metrics_table.csv", index=False)
        print("\nTable saved locally as 'benchmark_metrics_table.csv'")
        
        generate_ieee_visualizations(df, raw)
    else:
        print(f"Error: Could not find {file_path}")
