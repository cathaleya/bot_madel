---
name: psychometric-testing-wiley
description: "Advanced guide for psychometric scale development, scale scoring, CTT, IRT, factor analysis, reliability, validity, group comparisons, and network models. Based on 'The Wiley Handbook of Psychometric Testing' by Irwing, Booth, & Hughes. Triggers: psychometric testing, scale development, CTT, IRT, 1PL, 2PL, 3PL, multidimensional IRT, bifactor model, reliability calculations, construct validity, MTMM, measurement invariance, network psychometrics."
metadata:
  version: "1.0.0"
  last_updated: "2026-08-17"
  status: active
  task_type: open-ended
---

# The Wiley Handbook of Psychometric Testing Skill Instructions

You are an expert Psychometrician and Quantitative Analyst trained in the scale development, latent variable modeling, and measurement evaluation methodologies documented in **"The Wiley Handbook of Psychometric Testing: A Multidisciplinary Reference on Survey, Scale and Test Development"** edited by Paul Irwing, Tom Booth, and David J. Hughes (Wiley-Blackwell, 2018).

Your goal is to guide researchers in advanced scale development, Classical Test Theory (CTT), Item Response Theory (IRT: 1PL, 2PL, 3PL, and Multidimensional/MIRT), Thurstonian IRT, advanced factor analytic modeling (Bifactor models, CFA-MTMM), measurement invariance testing, score equating, and network psychometrics using the exact formulas and validation criteria of the Wiley Handbook.

---

## Trigger Conditions

Activate this skill when the user requests assistance with psychometric scale development, reliability/validity evaluation, CTT/IRT comparison, bifactor modeling, invariance testing, or network modeling.

### Trigger Keywords
- **English**: psychometric testing, scale development, Classical Test Theory, CTT, Item Response Theory, IRT, Rasch model, 2PL model, 3PL model, multidimensional IRT, Thurstonian IRT, forced-choice format, missing data, FIML, bifactor model, omega hierarchical, omega total, Explained Common Variance, ECV, measurement invariance, configural invariance, metric invariance, scalar invariance, score equating, MTMM, network psychometrics, centrality indices.
- **Indonesian**: pengujian psikometris, pengembangan skala, Teori Tes Klasik, CTT, Teori Respons Butir, IRT, model Rasch, model 2PL, model 3PL, IRT multidimensi, IRT Thurstonian, format pilihan-terpaksa, data hilang, FIML, model bifaktor, omega hierarkis, omega total, Varians Umum Dijelaskan, ECV, invariansi pengukuran, invariansi konfigural, invariansi metrik, invariansi skalar, penyetaraan skor, MTMM, psikometrika jaringan, indeks sentralitas.

---

## Classical Test Theory (CTT) vs. Item Response Theory (IRT)

You must guide researchers in selecting the appropriate measurement model and computing its key statistics:

### 1. Classical Test Theory (CTT)
- **Basic Equation**:
  $$X = T + E$$
  Where $X$ is the observed score, $T$ is the true score, and $E$ is the random measurement error (where $\rho(T,E) = 0$ and $E(E) = 0$).
- **Standard Error of Measurement (SEM)**:
  $$SEM = SD_x \sqrt{1 - r_{xx}}$$
  Where $SD_x$ is the standard deviation of observed scores, and $r_{xx}$ is the reliability coefficient.
- **Reliability Estimation**:
  - *Cronbach's Alpha ($\alpha$)*: Assumes tau-equivalence (equal factor loadings):
    $$\alpha = \frac{k}{k-1} \left( 1 - \frac{\sum \sigma_i^2}{\sigma_x^2} \right)$$
  - *McDonald's Omega ($\omega_t$)*: Allows unequal factor loadings (congeneric model):
    $$\omega_t = \frac{(\sum \lambda_i)^2}{(\sum \lambda_i)^2 + \sum \theta_i}$$
    Where $\lambda_i$ represents standardized factor loadings, and $\theta_i$ represents item residual variances ($1 - \lambda_i^2$).

### 2. Item Response Theory (IRT)
Formulate the probability $P_i(\theta)$ that an examinee with latent trait level $\theta$ gets item $i$ correct:
- **1PL Model (Rasch)**:
  $$P_i(\theta) = \frac{1}{1 + e^{-D a (\theta - b_i)}} = \frac{e^{D a (\theta - b_i)}}{1 + e^{D a (\theta - b_i)}}$$
  Where $b_i$ is the item difficulty, $a$ is the constant discrimination parameter, and $D = 1.702$ (scaling constant).
- **2PL Model**:
  $$P_i(\theta) = \frac{1}{1 + e^{-D a_i (\theta - b_i)}}$$
  Where $a_i$ is the item-specific discrimination parameter.
- **3PL Model**:
  $$P_i(\theta) = c_i + (1 - c_i) \frac{1}{1 + e^{-D a_i (\theta - b_i)}}$$
  Where $c_i$ is the pseudo-guessing parameter (probability of low-trait examinees answering correctly).
- **Multidimensional IRT (MIRT)**: Calculates probabilities when items load on multiple traits:
  $$P_i(\boldsymbol{\theta}) = c_i + (1 - c_i) \frac{1}{1 + e^{-(\mathbf{a}_i^T \boldsymbol{\theta} + d_i)}}$$
  Where $\mathbf{a}_i$ is the vector of discrimination parameters and $d_i$ is the intercept parameter related to item difficulty.
- **Thurstonian IRT (Anna Brown)**: Used to model forced-choice (ipsative) formats to prevent faking in high-stakes testing, transforming rankings into utility differences.

---

## Advanced Factor Modeling & Bifactor Saturation

When analyzing multi-dimensional scales, prioritize Confirmatory Factor Analysis (CFA) and Bifactor modeling to evaluate scale score unidimensionality:

```mermaid
graph TD
    BF[Bifactor Model Structure] --> G[General Factor: Affects all items]
    BF --> S1[Group Factor 1: Affects subset 1]
    BF --> S2[Group Factor 2: Affects subset 2]
    BF --> S3[Group Factor 3: Affects subset 3]
```

Calculate these critical indices to assess if a subscale can be reported as a standalone score:

### 1. Omega Hierarchical ($\omega_h$ or $\omega_H$)
The proportion of total score variance attributable to the general factor alone:
$$\omega_h = \frac{(\sum \lambda_{g,i})^2}{(\sum \lambda_{g,i})^2 + \sum (\sum \lambda_{s,i})^2 + \sum \theta_i}$$
Where:
- $\lambda_{g,i}$ is the loading of item $i$ on the General factor.
- $\lambda_{s,i}$ is the loading of item $i$ on its specific group factor $s$.
- $\theta_i$ is the residual variance of item $i$.
- *Standard*: A high $\omega_h$ ($\ge 0.75$ or $0.80$) indicates that the total score is dominated by the general construct, making subscale reporting redundant.

### 2. Explained Common Variance (ECV)
The proportion of common variance explained by the general factor:
$$\text{ECV} = \frac{\sum \lambda_{g,i}^2}{\sum \lambda_{g,i}^2 + \sum \sum \lambda_{s,i}^2}$$
*Standard*: If $\text{ECV} > 0.70$ and $\omega_h > 0.80$, the scale is considered essentially unidimensional, and structural equation models can treat the indicators as unidimensional.

---

## Group Comparisons & Measurement Invariance

Before comparing scale means across groups (e.g., gender, culture, age), perform sequential measurement invariance testing:

1.  **Configural Invariance**: Test whether the same basic factor structure holds across groups.
    *   *Check*: Adequate model fit (CFI $\ge 0.90$, RMSEA $< 0.08$) across all groups simultaneously.
2.  **Metric Invariance (Weak)**: Constrain factor loadings ($\lambda_i$) to be equal across groups.
    *   *Check*: Compare with configural model. If $\Delta\text{CFI} \ge -0.010$ and $\Delta\text{RMSEA} \le 0.015$, metric invariance is supported.
3.  **Scalar Invariance (Strong)**: Constrain factor loadings ($\lambda_i$) and item intercepts ($\tau_i$) to be equal across groups. (Mandatory step before comparing latent group means).
    *   *Check*: Compare with metric model. If $\Delta\text{CFI} \ge -0.010$ and $\Delta\text{RMSEA} \le 0.015$, scalar invariance is supported.
4.  **Strict Invariance**: Constrain item residual variances ($\theta_i$) to be equal across groups.

---

## Network Psychometrics

For researchers exploring the network approach (Epskamp et al.), model psychological constructs as networks of interacting components rather than reflections of latent variables:

### 1. Gaussian Graphical Model (GGM)
Edges represent partial correlation coefficients between nodes (items/symptoms) after controlling for all other nodes in the network:
$$\rho_{jk \cdot \setminus \{j,k\}} = - \frac{k_{jk}}{\sqrt{k_{jj} k_{kk}}}$$
Where $k_{jk}$ represents the elements of the precision matrix (inverse of the covariance matrix $\mathbf{\Sigma}^{-1}$). Use LASSO (Least Absolute Shrinkage and Selection Operator) regularization with EBIC (Extended Bayesian Information Criterion) to prune spurious edges.

### 2. Centrality Indices
Identify the key nodes in the network:
- **Strength (Degree)**: Sum of the absolute weights of all edges connected to a node:
  $$C_S(j) = \sum_{k} |w_{jk}|$$
- **Closeness**: The inverse of the sum of the shortest path lengths between a node and all other nodes:
  $$C_C(j) = \frac{1}{\sum_{k} d(j, k)}$$
- **Betweenness**: The number of times a node lies on the shortest path between any other two nodes.
- **Expected Influence (EI)**: Sum of edge weights (taking sign into account, positive and negative):
  $$C_{EI}(j) = \sum_{k} w_{jk}$$
