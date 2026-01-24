---
title: My Projects
layout: layouts/base.njk
---

# My Projects

Here's a collection of projects I've worked on: 

- [**GTClasses.wtf**](https://gtclasses-wtf.fly.dev) | Jan 2026 — Adapted from [classes.wtf](https://github.com/ekzhang/classes.wtf); built a lightning-fast Georgia Tech course discovery site with type-to-search + fuzzy matching using a low-latency Go + Redis backend and Svelte frontend; automated course data ingestion via crawler pipeline and deployed on Fly.io.

- [**Agentic Context Engineering vs. Parameter finetuning**](https://github.com/sucramual/GR-ACE) | Dec 2025 | [Report](https://drive.google.com/file/d/1VwYcegvtap0NVDjC8PCViQB2TaGnjS9X/view?usp=share_link) — proposed a retrieval-driven “learning-at-inference” framework that embeds the GSM8K training set into a semantic graph and, on failures, retrieves the nearest solved example to generate and accumulate reusable heuristics in a persistent playbook. Implemented the agent loop on Qwen2.5-1.5B-Instruct and benchmarked against 0-/3-shot prompting and parameter-efficient training baselines (QLoRA + GRPO).

- [**Decision Transformer Modification**](https://github.com/sucramual/Decision-Transformers) | Dec 2025 | [Report](https://drive.google.com/file/d/13D29LVNYrEXfVPDH6AyCz_1X_gNjrnUf/view?usp=sharing) — implemented and extended the [Decision Transformer](https://arxiv.org/pdf/2106.01345) for offline RL by swapping the CNN image encoder for a Vision Transformer to test generalization in image-based environments. Replaced the MLP state encoder with a GNN to evaluate relational state representations and compared both variants against the baseline.

- [**Soundscape Cartography**](https://github.com/sucramual/Soundscape-Cartography) | Dec 2024 — an interactive dashboard that applies clustering analysis to Spotify audio features, offering an alternative to traditional genre classifications by enabling users to compare songs based on characteristics such as danceability and speechiness.

- [**LLM Cantonese Response Comparison**](https://github.com/sucramual/PyCon-Project) (with [Winnie Yeung](https://vionwinnie.github.io/)) | Nov 2024 — a streamlit [application](https://pycon-project-2024.streamlit.app/) that explores the gap between large language models and specialized finetuned models in processing Cantonese content. [Presented](https://pretalx.com/pyconhk2024/talk/CEWPVB/) in PyCon Hong Kong 2024.


