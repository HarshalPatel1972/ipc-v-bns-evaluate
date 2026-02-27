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
    Styled for IEEE publication standards.
    """
    top_models = df.head(4) # Only take top 4 to prevent clutter
    
    metrics = ['LCT (%)', 'SGG (%)', 'ACR (%)', 'Inverse_ECHR']
    
    fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor('white')
    ax.set_facecolor('#fafafa')
    
    N = len(metrics)
    angles = [n / float(N) * 2 * pi for n in range(N)]
    angles += angles[:1] # Close the loop
    
    ax.set_theta_offset(pi / 2)
    ax.set_theta_direction(-1)
    
    # Enhanced Typography for Labels
    labels = ['Truthfulness\n(LCT)', 'Groundedness\n(SGG)', 'Safe Abstention\n(ACR)', 'Safety from Fake Citations\n(100 - ECHR)']
    plt.xticks(angles[:-1], labels, size=12, fontweight='bold', color='#1e293b')
    
    # Padding the labels so they don't overlap the chart
    ax.tick_params(axis='x', pad=30)
    
    ax.set_rlabel_position(0)
    plt.yticks([25, 50, 75, 100], ["25", "50", "75", "100"], color="#64748b", size=10, fontstyle='italic')
    plt.ylim(0, 100)
    
    # Custom gridline styling
    ax.grid(color='#cbd5e1', linestyle='--', linewidth=1)
    ax.spines['polar'].set_color('#94a3b8')
    
    # Professional IEEE color palette (distinct and colorblind-friendly)
    colors = ['#2563eb', '#10b981', '#f59e0b', '#dc2626']
    markers = ['o', 's', '^', 'D']
    
    for i, row in top_models.iterrows():
        values = [row['LCT (%)'], row['SGG (%)'], row['ACR (%)'], 100 - row['ECHR (%)']]
        values += values[:1]
        
        # Thicker lines and markers for clarity
        ax.plot(angles, values, linewidth=3.5, linestyle='solid', 
                label=row['Model'], color=colors[i], marker=markers[i], markersize=8)
        
        # Slightly more opaque fill
        ax.fill(angles, values, color=colors[i], alpha=0.15)
        
    plt.title('Fig 2: Multidimensional Legal Competency (Top 4 Models)', 
              size=16, fontweight='black', y=1.15, color='#0f172a')
              
    # Better legend placement with title
    legend = plt.legend(loc='upper right', bbox_to_anchor=(1.35, 1.15), 
                        fontsize=11, title="Evaluated Models", title_fontsize='12')
    legend.get_title().set_fontweight('bold')
    
    plt.tight_layout()
    plt.subplots_adjust(top=0.85, right=0.85) # Extra room for legend and title
    plt.savefig(f"{output_dir}/fig2_radar_competency.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def generate_grouped_bar_chart(df, output_dir="charts"):
    """
    Grouped bar chart for top 4 models comparing the 4 key dimensions:
    LCT, SGG, ACR, and Safety (100 - ECHR). 
    This provides clear, readable markings compared to a radar chart.
    """
    top_models = df.head(4)
    models = top_models['Model'].tolist()
    
    lct = top_models['LCT (%)'].values
    sgg = top_models['SGG (%)'].values
    acr = top_models['ACR (%)'].values
    safety = 100 - top_models['ECHR (%)'].values
    
    x = np.arange(len(models))
    width = 0.2  # width of the bars
    
    fig, ax = plt.subplots(figsize=(12, 7))
    
    # Plotted next to each other
    rects1 = ax.bar(x - 1.5*width, lct, width, label='Truthfulness (LCT)', color='#10b981')
    rects2 = ax.bar(x - 0.5*width, sgg, width, label='Groundedness (SGG)', color='#3b82f6')
    rects3 = ax.bar(x + 0.5*width, acr, width, label='Safe Abstention (ACR)', color='#94a3b8')
    rects4 = ax.bar(x + 1.5*width, safety, width, label='Safety (100 - ECHR)', color='#8b5cf6')
    
    # Labeling
    ax.set_ylabel('Score (%)', fontweight='bold', fontsize=12)
    ax.set_title('Fig 2: Multidimensional Legal Competency (Grouped Analysis)', fontweight='black', fontsize=16, pad=20, color='#0f172a')
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontweight='bold', fontsize=12, color='#1e293b')
    ax.legend(loc='upper right', bbox_to_anchor=(1.25, 1.0), fontsize=11, title="Evaluation Axis", title_fontsize='12')
    
    # Add numeric labels on top of bars
    def autolabel(rects):
        """Attach a text label above each bar displaying its height."""
        for rect in rects:
            height = rect.get_height()
            if height > 0:
                ax.annotate(f'{int(height)}',
                            xy=(rect.get_x() + rect.get_width() / 2, height),
                            xytext=(0, 3),
                            textcoords="offset points",
                            ha='center', va='bottom', fontsize=10, fontweight='bold', color='#475569')

    autolabel(rects1)
    autolabel(rects2)
    autolabel(rects3)
    autolabel(rects4)

    ax.set_ylim(0, 115) # Leave room for labels
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/fig2_grouped_competency.png", dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def generate_ieee_visualizations(df, raw_results, output_dir="charts"):
    print(f"Generating charts in '{output_dir}' directory...")
    os.makedirs(output_dir, exist_ok=True)
    
    generate_diverging_bar_chart(df, raw_results, output_dir)
    generate_grouped_bar_chart(df, output_dir)

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
