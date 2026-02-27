import re

with open("ieee_research_paper.tex", "r", encoding="utf-8") as f:
    content = f.read()

new_abstract = r"""\begin{abstract}
The 1860 Indian Penal Code (IPC) was superseded by the Bharatiya Nyaya Sanhita (BNS) as of early 2026, radically altering Indian criminal law. However, in Large Language Models (LLMs) used for legal informatics, "Legacy Bias"—the persistence of antiquated statutory knowledge derived from historical training corpora—remains a crucial failure mode. This extensive study uses a unique, highly proprietary dataset of 100 transitional legal scenarios to benchmark eight leading foundational models against the IPC-to-BNS transition. Beyond surface-level accuracy, we present a multidimensional penalization framework that includes the Extrinsic Citation Hallucination Rate (ECHR), Substantive Groundedness (SGG), Abstention \& Calibration Rate (ACR), and Legal Claim Truthfulness (LCT). These metrics are combined to create the LegalBench Adjusted Score (LBAS). Our analysis of 800 distinct legal conclusions shows a significant variation in architectural safety. Although models like ChatGPT 5.2 attain 80.0\% raw truthfulness, their 17.0\% hallucination rate makes them unsuitable for unguarded legal deployment. While leading the LBAS index (77.5) and reducing extrinsic hallucinations to 6.0\%, Gemini 3 demonstrates unparalleled calibration. Open-weights models like Meta AI are severely penalized by our qualitative ablation studies, which also show that dense parameter scaling without targeted reinforcement learning is unable to reduce historical overfitting.
\end{abstract}

\begin{IEEEkeywords}
Legal Informatics, Generative AI, Hallucination Detection, LLM Benchmarking, IPC to BNS Transition, LegalBench, Indian Law, and Trustworthy AI.
\end{IEEEkeywords}

\section{Introduction}
The most extensive legislative reform in contemporary Indian history was the changeover from the colonial-era Indian Penal Code (IPC) of 1860 to the Bharatiya Nyaya Sanhita (BNS) in late 2023. This change entails the intricate renumbering, consolidation, modification, and repeal of hundreds of statutes that have served as the foundation of Indian legal texts for more than 160 years; it goes beyond simple semantic renaming. 

Concurrently, the legal technology industry has seen a sharp increase in the use of Large Language Models (LLMs) \cite{b_vaswani, b_brown, b_min}. Generative AI is being used more and more by legal professionals for preliminary legal drafting, statutory retrieval, and case law summarization \cite{b_katz, b_inlegalbert}. However, the training data of the underlying models that power these applications places limitations on them. We refer to the ensuing vulnerability as "Legacy Bias" or "Data Inertia."

Strong statistical correlations between particular crimes and their legacy IPC sections will be automatically encoded by a model trained on terabytes of Supreme Court of India rulings (e.g., linking "Murder" inextricably to "Section 302 IPC"). An LLM must override billions of highly weighted parameters in order to produce the correct, newly established statute when asked about the current BNS law, which now governs murder under Section 103 BNS. If this isn't done, the model will confidently give erroneous or legally outdated advice, which is known as an Extrinsic Citation Hallucination \cite{b_geng_calibration}.

This study's main goal is to accurately measure how much Legacy Bias has been reduced by state-of-the-art LLMs as of early 2026. We predict that models using specialized architectural safeguards or ongoing temporal fine-tuning will exhibit noticeably lower hallucination rates because raw parameter scale is insufficient to overcome historical overfitting.

\section{Literature Review}
Compared to general natural language processing metrics, the assessment of LLMs in specialized, high-stakes domains has undergone substantial change. The sophisticated reasoning needed in professional law is frequently not captured by generic benchmarks like MMLU (Massive Multitask Language Understanding). Guha et al. \cite{b_legalbench} presented LegalBench, a cooperatively developed framework with 162 tasks that assesses an LLM's ability to carry out practical legal reasoning, from statutory interpretation to contract rule extraction. In a similar vein, LawBench \cite{b_lawbench} evaluates cognitive levels ranging from legal application to knowledge memorization.

These frameworks primarily test logical and spatial reasoning within static legal snapshots, even though they offer crucial baseline metrics. By assessing temporal statutory adaptation—the model's flexibility in unlearning deprecated laws—our work goes beyond this.

Generative outputs that are fluid but factually false or nonsensical are referred to as hallucinations \cite{b_ji2023survey}. Researchers distinguish between extrinsic hallucinations (producing unverifiable or false external facts, such as fictitious case citations or statutes) and intrinsic hallucinations (contradicting the user's prompt) in legal and medical contexts. To quantify these phenomena, specialized datasets such as FalseCite \cite{b_falsecite} and LegalHalBench \cite{b_legalhal} have been created. The Extrinsic Citation Hallucinations (ECHR) caused by historical semantic interference are the particular subject of this paper.

\section{Methodology}
A thorough methodological pipeline that includes data curation, standardized processing, model selection, and quantifiable metric synthesis is necessary to evaluate the IPC-to-BNS transition.

\subsection{Dataset}
We created the \textit{IndoLegal-100} dataset, which consists of 100 carefully chosen legal questions that are intended to cause Legacy Bias. The dataset is divided into four main categories, which correspond to the BNS's structural taxonomy.
\begin{itemize}
    \item \textbf{Type A: Direct Renumbering (35\%):} Offenses that were given completely new section numbers but had essentially the same legal definition. This evaluates fact retrieval and basic temporal adaptation (e.g., BNS Sec 318 $\rightarrow$ IPC Sec 420).
    \item \textbf{Type B: Structural Mergers (25\%):} The combination of several related IPC offenses into a single BNS provision. This puts the LLM's ability to synthesize and comprehend the larger legislative intent to the test.
    \item \textbf{Type C: New Provisions and Amendments After 2024 (20\%):} Questions about laws that the BNS has recently introduced (e.g., special rules regarding organized crime or false marriage vows). These are frequently totally failed by models that rely too heavily on historical distributions.
    \item \textbf{Type D: Omission and Repeal (20\%):} Inquiries about popular IPC provisions. There are no direct, 1:1 equivalents in the BNS for offenses like sedition under 124A or unnatural offenses under 377. These are used as trap queries to gauge the rate of calibration and abstention \cite{b_kadavath2022language}.
\end{itemize}

\subsection{Data Preprocessing}
Using a standardized system prompt created to enforce strict academic and statutory formatting, each model was dynamically assessed against the 100 IndoLegal dataset questions. We used a straightforward Zero-Shot approach without any Retrieval-Augmented Generation (RAG) elements. The pre-trained and post-trained networks' intrinsic, internalized statutory weights are measured explicitly by separating the models from external search or vector databases. For batch grading, the generative outputs were methodically parsed and logged into continuous JSON schema structures.

\subsection{Model Architecture}
We examined eight different foundational and refined models that were accessed through official APIs in order to guarantee a thorough examination of the early 2026 AI landscape \cite{b_gpt4, b_llama2, b_palm}. The group includes dense open-weights architectures, highly effective reasoning models, localized fine-tunes, and global proprietary giants.
\begin{itemize}
    \item \textbf{Private Tier-1:} Claude Sonnet 4.6 (Anthropic), Gemini 3 (Google), and ChatGPT 5.2 (OpenAI).
    \item \textbf{Reasoning Architectures:} DeepSeek V3.2.
    \item \textbf{Open-Weights Dense:} Grok 4.1, Meta AI.
    \item \textbf{Regional/Specialized:} Kruti, Indus Sarvam (designed for regional contexts and Indic languages).
\end{itemize}

\subsection{Evaluation Metrics}
Legally speaking, accuracy is not a binary concept. For research purposes, a partially accurate premise may be helpful, but a confident but completely delusional citation is a disastrous legal practice failure. In order to encompass this continuum, we utilize and enhance five assessment metrics:

\begin{enumerate}
    \item \textbf{Legal Claim Truthfulness (LCT):} The total proportion of answers that identify the appropriate primary statute and are factually correct.
    $LCT = (N_{Truthful}/N_{Total}) \times 100$
    
    \item \textbf{Substantive Groundedness \& Granularity (SGG):} The degree to which the model accurately identifies the general legal principle but is unable to pinpoint the precise statutory clause or subunit. A high SGG denotes a model with current general knowledge but low high-resolution accuracy.

    \item \textbf{Extrinsic Citation Hallucination Rate (ECHR):} A crucial safety metric that describes situations in which the LLM asserts a legal fact backed up by a fictitious BNS citation or obstinately maintains that an out-of-date IPC section is still in effect.
    $ECHR = (N_{Hallucinated}/N_{Total}) \times 100$

    \item \textbf{Abstention \& Calibration Rate (ACR):} The rate at which the model accurately detects epistemic uncertainty and refrains from producing a hallucinogenic response.
    $ACR = (N_{Abstention}/N_{Total}) \times 100$

    \item \textbf{LegalBench Adjusted Score (LBAS):} The aforementioned parameters are combined to create a weighted composite index (0-100). It forgives safe abstentions but severely punishes hallucinations.
    \begin{equation}
    LBAS_{raw} = (LCT \times 1.0) + (SGG \times 0.5) - (ECHR \times 1.0)
    \end{equation}
    Absolute unreliability for legal tasks is indicated by models with a negative $LBAS_{raw}$, which are floored at an LBAS of 0.
\end{enumerate}

\section{Results and Discussions}
800 independent evaluations were successfully recorded by the benchmarking harness. The LBAS framework was used to extract, clean, and categorize the performance data.

\subsection{Validation and Training Results (Overall Benchmark)}
The empirical performance of the eight assessed models on our standardized test set using the suggested LBAS methodology is shown in Table \ref{tab_empirical_results}.

\begin{table}[htbp]
\caption{Overall BNS Benchmarking Results (N=100 per model)}
\begin{center}
\renewcommand{\arraystretch}{1.2}
\begin{tabular}{|l|P{0.8cm}|P{0.8cm}|P{0.8cm}|P{0.8cm}|P{0.9cm}|}
\hline
\textbf{Model Identifier} & \textbf{LCT (\%)} & \textbf{ECHR (\%)} & \textbf{SGG (\%)} & \textbf{ACR (\%)} & \textbf{LBAS} \\
\hline
\textbf{Gemini 3} & 73.0 & \textbf{6.0} & 21.0 & 0.0 & \textbf{77.5} \\
ChatGPT 5.2 & \textbf{80.0} & 17.0 & 3.0 & 0.0 & 64.5 \\
Indus Sarvam & 79.0 & 19.0 & 2.0 & 0.0 & 61.0 \\
Grok 4.1 & 69.0 & 25.0 & 5.0 & 1.0 & 46.5 \\
Claude Sonnet 4.6 & 63.0 & 28.0 & 9.0 & 0.0 & 39.5 \\
DeepSeek V3.2 & 66.0 & 29.0 & 5.0 & 0.0 & 39.5 \\
Kruti & 44.0 & 53.0 & 2.0 & 1.0 & 0.0 \\
Meta AI & 22.0 & 76.0 & 2.0 & 0.0 & 0.0 \\
\hline
\end{tabular}
\label{tab_empirical_results}
\end{center}
\end{table}

\subsection{Test Set Evaluation (Diverging Reliability)}
Strictly judging models by raw accuracy presents a dangerously incomplete picture, as shown in Table \ref{tab_empirical_results}. The maximum absolute Truthfulness (LCT) of 80.0\% was attained by ChatGPT 5.2. It confidently cited fictitious BNS sub-clauses, but in the 20\% of scenarios where it failed, it almost exclusively produced Extrinsic Hallucinations (ECHR: 17.0\%).

\begin{figure}[H]
    \centering
    \includegraphics[width=\linewidth]{charts/fig1_diverging_reliability.png}
    \caption{Differing Legal Reliability Assessments. While penalizing ECHR hallucinations (Red) extend to the left, positive components (Green/Blue) indicating LCT and SGG extend to the right.}
    \label{fig:diverging}
\end{figure}

The severity of Legacy Bias in lower-performing architectures is illustrated graphically in Figure \ref{fig:diverging}. Extreme penalties are maintained by models such as Kruti (ECHR: 53.0\%) and Meta AI (ECHR: 76.0\%). Their net calculations fall below zero, mathematically demonstrating that they are structurally unsafe for unassisted legal retrieval tasks because their negative hallucination rates significantly outnumber their positive truthful responses.

\subsection{Classification Metrics (Multidimensional Competency)}
Multi-axis spatial visualization is necessary for assessing complex AI behavior.

\begin{figure}[H]
    \centering
    \includegraphics[width=\linewidth]{charts/fig2_radar_competency.png}
    \caption{A multifaceted legal competency radar chart that highlights the top quartile of models. To indicate safety, the ECHR is inverted ($100 - ECHR$).}
    \label{fig:radar}
\end{figure}

The superior models' unique behavioral modalities are highlighted in the radar chart (Figure \ref{fig:radar}). In terms of structural mapping, Indus Sarvam, a model tailored to Indian legal sub-dialects, closely resembles ChatGPT 5.2. However, Gemini 3's unique optimization against false legal confidence is clearly defined by its distinct expansion on the Safety and Groundedness axes.

\subsection{Discussions}
We perform qualitative ablation studies on different IPC-to-BNS friction points in order to crystallize the quantitative metrics. 

\textbf{Case Study A: The "Section 420" Overfit.} Section 420 (Cheating) of the IPC went beyond legalese to become a cultural standard. In this regard, Meta AI frequently experienced extrinsic hallucinations, claiming that "cheating is punishable by Section 420 of the BNS." The enormous hyper-parameter weight attributed to the historical '420 $\rightarrow$ Cheating' token correlation is too great for the LLM's attention mechanism to overcome. On the other hand, Indus Sarvam correctly mapped the provision to Section 318 BNS by executing temporal unlearning.

\textbf{Case Study B: Statutes Not Included.} The BNS did not include sedition (Section 124A IPC) in its name. Grok 4.1 gave in to this trap question and made up "Section 147(B) BNS for Sedition," which led to harsh ECHR penalties.

According to empirical data, legislative agility and architectural scale (parameter count) do not linearly correlate. When used in a zero-shot legal setting, Meta AI and Grok 4.1, two enormous, extremely powerful conversational models, are easily influenced by extrinsic citation hallucinations. Continuous Temporal Fine-Tuning and rigorous Reinforcement Learning from Human Feedback (RLHF) \cite{b_rlhf} applied specifically to negative legal constraints are required, according to this research.

\subsection{Conclusion of the findings}
The operational realities of implementing generative systems during sovereign statutory transitions are firmly established by the evaluation framework.

\begin{figure}[H]
    \centering
    \includegraphics[width=\linewidth]{charts/fig3_lbas_rankings.png}
    \caption{The final rankings of the LegalBench Adjusted Score (LBAS) index.}
    \label{fig:ranking}
\end{figure}

For legal deployment, Gemini 3 turned out to be a much more calibrated architecture. It significantly reduced its ECHR to an astounding 6.0\%, while still achieving an LCT of 73.0\%. Additionally, Gemini 3's groundedness rate (SGG: 21.0\%) was high. Gemini 3 refused to hallucinate a false sub-section and instead gave the general chapter and section number when it was unable to recognize the precise millimeter-level sub-clause. Gemini 3 rises to the top spot on the LBAS index (77.5) thanks to this strong safety threshold. Standard conversational LLMs continue to be extremely volatile in the absence of secondary validation protocols, as shown by the steeper performance decline seen across open-weights models (Figure \ref{fig:ranking}).

\section{Future Scope}
A zero-shot inference protocol that was totally reliant on the parametric memory architectures of the models was used to carry out this benchmarking study. The majority of real-world legal technology applications use Retrieval-Augmented Generation (RAG) pipelines \cite{b_lewis_rag}, which ground the LLM through semantic similarity searches over reliable, current vector databases that contain the actual BNS text \cite{b_karpukhin_dpr}.

Future studies must assess whether a RAG implementation effectively eliminates Legacy Bias for lower-scoring models, such as Meta AI, or whether the retrieved contextual window is overridden by deeply embedded IPC token correlations—a phenomenon referred to in the literature as "Contextual Rejection." Additionally, the immediate future of this benchmarking framework is represented by growing the IndoLegal dataset from 100 to over 5,000 algorithmic variations across particular State Amendments.
"""

start_index = content.find(r"\begin{abstract}")
end_index = content.find(r"\section*{Acknowledgment}")

new_content = content[:start_index] + new_abstract + content[end_index:]

with open("ieee_research_paper.tex", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement complete.")
