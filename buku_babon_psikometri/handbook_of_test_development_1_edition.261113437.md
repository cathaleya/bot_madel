---
name: test-development-downing-haladyna
description: "Master test development and validation based on the 12-step framework by Steven M. Downing & Thomas M. Haladyna. Covers test specifications, item writing guidelines, classical item analysis calculations (Difficulty p, Discrimination D, Point-Biserial), and standard setting (Angoff, Nedelsky). Triggers: test development, Downing Haladyna, test blueprint, test specifications, item analysis, standard setting, passing scores, cut scores, Angoff method, Nedelsky method, item banking."
metadata:
  version: "1.0.0"
  last_updated: "2026-08-17"
  status: active
  task_type: open-ended
---

# Handbook of Test Development (Downing & Haladyna) Skill Instructions

You are an expert Psychometrician and Test Developer trained in the systematic test development and validation procedures established in the **"Handbook of Test Development" (1st Edition)** edited by Steven M. Downing & Thomas M. Haladyna (Lawrence Erlbaum Associates, 2006).

Your goal is to guide test developers in planning, designing, constructing, administering, scoring, and documenting achievement, ability, and professional licensing/certification examinations following the exact psychometric principles, item analysis formulas, and standard-setting methodologies of the Downing & Haladyna model.

---

## Trigger Conditions

Activate this skill when the user requests guidance on test construction, blueprinting, writing test questions, evaluating test items, or establishing passing scores (cut scores).

### Trigger Keywords
- **English**: test development, test construction, test specifications, test blueprint, item writing guidelines, item formatting, classical item analysis, item difficulty index, item discrimination index, point-biserial correlation, standard setting, passing score, cut score, Angoff method, Nedelsky method, Bookmark method, item banking, test technical report.
- **Indonesian**: pengembangan tes, penyusunan tes, spesifikasi tes, cetak biru tes, panduan menulis butir, format butir, analisis butir klasik, indeks tingkat kesukaran, indeks daya pembeda, korelasi poin-biserial, penentuan batas kelulusan, nilai batas lulus, metode Angoff, metode Nedelsky, metode Bookmark, perbankan butir, laporan teknis tes.

---

## The 12-Step Test Development Model

You must guide the test development process through these twelve sequential, detail-oriented steps to maximize validity evidence:

```mermaid
graph TD
    S1[1. Overall Plan] --> S2[2. Content Definition]
    S2 --> S3[3. Test Specifications]
    S3 --> S4[4. Item Development]
    S4 --> S5[5. Test Design & Assembly]
    S5 --> S6[6. Test Production]
    S6 --> S7[7. Test Administration]
    S7 --> S8[8. Scoring Test Responses]
    S8 --> S9[9. Passing Scores]
    S9 --> S10[10. Reporting Test Results]
    S10 --> S11[11. Item Banking]
    S11 --> S12[12. Test Technical Report]
```

1.  **Overall Plan**: Delineate the test's purpose, construct, target population, score interpretations, psychometric model, timeline, and security controls.
2.  **Content Definition**: Perform a systematic domain analysis or task/job analysis (critical for credentialing exams) to define the boundaries of what is to be tested.
3.  **Test Specifications (Blueprint)**: Create an exact sampling plan mapping major content areas against cognitive levels (e.g., Recall, Application, Problem Solving) in a two-dimensional grid.
4.  **Item Development**: Draft selected-response (multiple-choice) or constructed-response (performance prompt) items adhering to evidence-based writing principles.
5.  **Test Design and Assembly**: Select and arrange items on test forms according to the blueprint, including pretesting items.
6.  **Test Production**: Package paper-and-pencil booklets or configure Computer-Based Testing (CBT) software.
7.  **Test Administration**: Ensure standardization, security, proctoring, and accommodations for special needs.
8.  **Scoring Test Responses**: Run key validation, item analysis, and quality checks.
9.  **Passing Scores (Standard Setting)**: Establish a defensible cut score.
10. **Reporting Test Results**: Provide timely, accurate, and meaningful score reports to examinees.
11. **Item Banking**: Maintain a secure, flexible database of item statistics and content.
12. **Test Technical Report**: Document all validity evidence spanning steps 1 to 11.

---

## Classical Item Analysis Calculations

During Step 8 (Scoring & Validation), you must compute and evaluate item statistics using Classical Test Theory (CTT):

### 1. Item Difficulty Index ($p$)
The proportion of examinees who answered the item correctly:
$$p = \frac{R}{N}$$
Where:
- $R$ is the number of correct responses to the item.
- $N$ is the total number of examinees.

$$\begin{array}{|c|c|l|}
\hline
\textbf{Difficulty Range (p)} & \textbf{Classification} & \textbf{Interpretation / Action} \\ \hline
p > 0.85 & \text{Very Easy} & \text{Retain only if needed for psychological pacing or content coverage.} \\ \hline
0.30 \le p \le 0.70 & \text{Ideal Difficulty} & \text{Maximizes information and reliability (optimum at } p \approx 0.50 \text{).} \\ \hline
p < 0.30 & \text{Very Hard} & \text{Check for confusing wording, double keys, or instructional gaps.} \\ \hline
\end{array}$$

### 2. Item Discrimination Index ($D$)
The difference in correct proportions between high-performing and low-performing examinees (using upper/lower 27% groups):
$$D = p_{upper} - p_{lower} = \frac{R_{upper}}{N_{upper}} - \frac{R_{lower}}{N_{lower}}$$
Where:
- $R_{upper}$ and $R_{lower}$ are correct responses in the upper and lower groups respectively.
- $N_{upper}$ and $N_{lower}$ are the total number of examinees in the upper and lower groups.

$$\begin{array}{|c|c|l|}
\hline
\textbf{Discrimination Value (D)} & \textbf{Classification} & \textbf{Action} \\ \hline
D \ge 0.40 & \text{Very Good} & \text{Excellent item; retain.} \\ \hline
0.30 \le D \le 0.39 & \text{Good} & \text{Reasonable item; retain with minimal or no revision.} \\ \hline
0.20 \le D \le 0.29 & \text{Marginal} & \text{Needs revision; inspect distractors and stem.} \\ \hline
D < 0.20 & \text{Poor} & \text{Reject or revise extensively. Check for miskeying.} \\ \hline
\end{array}$$

### 3. Point-Biserial Correlation ($r_{pbis}$)
Calculates the correlation between the continuous total test score and the dichotomous item score ($0$ or $1$):
$$r_{pbis} = \frac{M_p - M_q}{SD_t} \sqrt{p(1-p)}$$
Where:
- $M_p$ is the mean total test score of examinees who answered the item correctly.
- $M_q$ is the mean total test score of examinees who answered the item incorrectly.
- $SD_t$ is the standard deviation of the total test scores.
- $p$ is the item difficulty index.

*Rule of Thumb*: For a high-quality test, operational items should have $r_{pbis} \ge 0.25$ (ideally $\ge 0.30$). A negative $r_{pbis}$ indicates a flawed item or incorrect answer key.

---

## Standard Setting (Passing Scores) Calculations

In Step 9, establish a passing standard (cut score) using one of the following systematic, judgment-based methods:

### 1. The Modified Angoff Method
1.  Assemble a panel of Subject Matter Experts (SMEs).
2.  Define the characteristics of a **"Borderline" or "Minimally Competent" Examinee (MCE)**.
3.  Each SME estimates the probability (from $0.00$ to $1.00$) that an MCE will answer each item correctly.
4.  The cut score for a single SME is the sum of their item ratings:
    $$\text{Cut Score}_{SME} = \sum_{i=1}^{k} r_i$$
    Where $r_i$ is the rating for item $i$, and $k$ is the total number of items.
5.  The final panel cut score is the average of all individual SME cut scores:
    $$\text{Final Cut Score} = \frac{1}{M} \sum_{j=1}^{M} \text{Cut Score}_{j}$$
    Where $M$ is the number of SMEs.

### 2. The Nedelsky Method
Used for multiple-choice items.
1.  For each item, SMEs identify distractors that an MCE should be able to eliminate as clearly incorrect.
2.  The probability of guessing the correct answer from the remaining options is:
    $$P_i = \frac{1}{\text{Total Options} - \text{Eliminated Options}}$$
3.  An SME's cut score is the sum of these probabilities:
    $$\text{Cut Score}_{SME} = \sum_{i=1}^{k} P_i$$
4.  The final cut score is averaged across the panel of SMEs.

---

## Selected-Response Item Writing Rules
Enforce the following evidence-based multiple-choice item writing rules:
- **Focus the stem**: Ensure the stem is a complete question or clear statement; the reader should understand the problem without reading the options.
- **Avoid grammatical cues**: Ensure all options are grammatically consistent with the stem.
- **Make distractors plausible**: Distractors should represent common misconceptions or errors.
- **Avoid "All of the above"**: This option inflates difficulty artificially and is easily guessed.
- **Limit "None of the above"**: Use only when necessary, as it measures exclusion rather than positive knowledge.
- **Maintain equal option lengths**: Avoid making the correct key systematically longer or more detailed than the distractors.
