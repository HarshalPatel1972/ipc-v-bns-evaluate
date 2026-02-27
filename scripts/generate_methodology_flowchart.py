import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_methodology_flowchart(output_path="charts/methodology_flowchart.png"):
    fig, ax = plt.subplots(figsize=(14, 11))
    ax.set_xlim(-1, 15)
    ax.set_ylim(-1, 11)
    ax.axis('off')

    # Style constants
    box_props = dict(boxstyle='round,pad=0.5', facecolor='#f8fafc', edgecolor='#334155', linewidth=2)
    arrow_props = dict(arrowstyle='->', color='#475569', linewidth=2, mutation_scale=20)
    text_props = dict(ha='center', va='center', fontsize=11, fontname='Arial', color='#0f172a')
    title_props = dict(ha='center', va='center', fontsize=12, fontweight='bold', color='#1e293b')

    # Helper to draw box
    def draw_box(x, y, width, height, title, content, color='#eff6ff'):
        # Shadow
        shadow = patches.FancyBboxPatch((x+0.05, y-0.05), width, height, boxstyle='round,pad=0.2', 
                                      facecolor='#cbd5e1', edgecolor='none', zorder=1)
        ax.add_patch(shadow)
        
        # Main box
        rect = patches.FancyBboxPatch((x, y), width, height, boxstyle='round,pad=0.2', 
                                    facecolor=color, edgecolor='#334155', linewidth=1.5, zorder=2)
        ax.add_patch(rect)
        
        # Text
        cx = x + width/2
        cy = y + height/2
        ax.text(cx, cy + height*0.25, title, **title_props, zorder=3)
        ax.text(cx, cy - height*0.15, content, **text_props, zorder=3)
        return (cx, y, cx, y+height, x, y+height/2, x+width, y+height/2) # bottom, top, left, right centers

    # --- Level 1: Input ---
    b1 = draw_box(5, 8.5, 4, 1.2, "DATASET CURATION", "IndoLegal-100\n(100 IPC-to-BNS Scenarios)", color='#dbeafe')
    
    # --- Level 2: Models ---
    b2 = draw_box(5, 6.5, 4, 1.2, "MODEL INFERENCE", "8 LLMs (Zero-Shot)\n(Gemini 3, GPT-4, Meta AI, etc.)", color='#e0e7ff')
    
    # --- Level 3: Evaluation Engine ---
    b3 = draw_box(3, 4.0, 8, 1.5, "EVALUATION METRIC ENGINE", 
                  "LCT: Truthfulness (+1.0)\nECHR: Hallucination (-1.0)\nSGG: Groundedness (+0.5)\nACR: Abstention (0.0)", color='#fce7f3')
    
    # --- Level 4: Synthesis ---
    b4 = draw_box(5, 2.0, 4, 1.2, "SCORING ALGORITHM", "LegalBench Adjusted Score\n(LBAS 0-100 Index)", color='#fae8ff')
    
    # --- Level 5: Output ---
    b5 = draw_box(5, 0.0, 4, 1.2, "FINAL OUTPUT", "Leaderboard Rankings\n& Visualization Charts", color='#dcfce7')

    # Arrows
    # Dataset -> Model
    ax.annotate('', xy=(b2[0], b2[1]+1.2), xytext=(b1[0], b1[1]), arrowprops=arrow_props)
    
    # Model -> Engine
    ax.annotate('', xy=(b3[0], b3[1]+1.5), xytext=(b2[0], b2[1]), arrowprops=arrow_props)
    
    # Engine -> Scoring
    ax.annotate('', xy=(b4[0], b4[1]+1.2), xytext=(b3[0], b3[1]), arrowprops=arrow_props)
    
    # Scoring -> Output
    ax.annotate('', xy=(b5[0], b5[1]+1.2), xytext=(b4[0], b4[1]), arrowprops=arrow_props)

    # Side Arrows (Context)
    ax.text(2, 6.5, "Input: 'What is the BNS\nsection for Murder?'", ha='center', va='center', fontsize=9, style='italic', bbox=dict(facecolor='white', alpha=0.8, edgecolor='none'))
    ax.annotate('', xy=(5, 7.1), xytext=(3.5, 7.1), arrowprops=dict(arrowstyle='->', color='#94a3b8', linestyle='dashed'))

    ax.text(12, 6.5, "Output: 'Section 103'", ha='center', va='center', fontsize=9, style='italic', bbox=dict(facecolor='white', alpha=0.8, edgecolor='none'))
    ax.annotate('', xy=(10.5, 6.5), xytext=(9, 6.5), arrowprops=dict(arrowstyle='->', color='#94a3b8', linestyle='dashed'))

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Flowchart saved to {output_path}")

if __name__ == "__main__":
    create_methodology_flowchart()
