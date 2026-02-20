---
title: My Projects
layout: layouts/base.njk
---

# My Projects

<div class="not-prose space-y-10">
    
  <!-- Project 1 -->
  <article class="group">
    <div class="flex flex-col sm:flex-row sm:gap-4 mb-4">
      <h2 class="text-xl font-semibold text-text">
        <a href="https://gtclasses-wtf.fly.dev" class="hover:text-link transition-colors" target="_blank" rel="noopener noreferrer">GTClasses.wtf</a>
      </h2>
      <span class="text-sm font-medium text-gray-500 font-mono">Jan 2026</span>
    </div>
    <p class="text-gray-700 leading-relaxed">
      Adapted from <a href="https://github.com/ekzhang/classes.wtf" class="text-link hover:text-link-hover underline" target="_blank" rel="noopener noreferrer">classes.wtf</a>; built a lightning-fast Georgia Tech course discovery site with type-to-search + fuzzy matching using a low-latency Go + Redis backend and Svelte frontend; automated course data ingestion via crawler pipeline and deployed on Fly.io.
    </p>
  </article>

  <!-- Project 2 -->
  <article class="group">
    <div class="flex flex-col sm:flex-row sm:gap-4 mb-4">
      <h2 class="text-xl font-semibold text-text">
        <a href="https://github.com/sucramual/GR-ACE" class="hover:text-link transition-colors" target="_blank" rel="noopener noreferrer">Agentic Context Engineering vs. Parameter finetuning</a>
      </h2>
      <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-gray-500 font-mono">Dec 2025</span>
          <a href="https://drive.google.com/file/d/1VwYcegvtap0NVDjC8PCViQB2TaGnjS9X/view?usp=share_link" class="text-xs uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-semibold transition-colors" target="_blank" rel="noopener noreferrer">Report</a>
      </div>
    </div>
    <p class="text-gray-700 leading-relaxed">
      Proposed a retrieval-driven “learning-at-inference” framework that embeds the GSM8K training set into a semantic graph and, on failures, retrieves the nearest solved example to generate and accumulate reusable heuristics in a persistent playbook. Implemented the agent loop on Qwen2.5-1.5B-Instruct and benchmarked against 0-/3-shot prompting and parameter-efficient training baselines (QLoRA + GRPO).
    </p>
  </article>

  <!-- Project 3 -->
  <article class="group">
    <div class="flex flex-col sm:flex-row sm:gap-4 mb-4">
      <h2 class="text-xl font-semibold text-text">
        <a href="https://github.com/sucramual/Decision-Transformers" class="hover:text-link transition-colors" target="_blank" rel="noopener noreferrer">Decision Transformer Modification</a>
      </h2>
      <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-gray-500 font-mono">Dec 2025</span>
          <a href="https://drive.google.com/file/d/13D29LVNYrEXfVPDH6AyCz_1X_gNjrnUf/view?usp=sharing" class="text-xs uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-semibold transition-colors" target="_blank" rel="noopener noreferrer">Report</a>
      </div>
    </div>
    <p class="text-gray-700 leading-relaxed">
      Implemented and extended the <a href="https://arxiv.org/pdf/2106.01345" class="text-link hover:text-link-hover underline" target="_blank" rel="noopener noreferrer">Decision Transformer</a> for offline RL by swapping the CNN image encoder for a Vision Transformer to test generalization in image-based environments. Replaced the MLP state encoder with a GNN to evaluate relational state representations and compared both variants against the baseline.
    </p>
  </article>

  <!-- Project 4 -->
  <article class="group">
    <div class="flex flex-col sm:flex-row sm:gap-4 mb-4">
      <h2 class="text-xl font-semibold text-text">
        <a href="https://github.com/sucramual/Soundscape-Cartography" class="hover:text-link transition-colors" target="_blank" rel="noopener noreferrer">Soundscape Cartography</a>
      </h2>
      <span class="text-sm font-medium text-gray-500 font-mono">Dec 2024</span>
    </div>
    <p class="text-gray-700 leading-relaxed">
      An interactive dashboard that applies clustering analysis to Spotify audio features, offering an alternative to traditional genre classifications by enabling users to compare songs based on characteristics such as danceability and speechiness.
    </p>
  </article>

  <!-- Project 5 -->
  <article class="group">
    <div class="flex flex-col sm:flex-row sm:gap-4 mb-4">
      <h2 class="text-xl font-semibold text-text">
        <a href="https://github.com/sucramual/PyCon-Project" class="hover:text-link transition-colors" target="_blank" rel="noopener noreferrer">LLM Cantonese Response Comparison</a>
      </h2>
      <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-gray-500 font-mono">Nov 2024</span>
          <a href="https://pycon-project-2024.streamlit.app/" class="text-xs uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-semibold transition-colors" target="_blank" rel="noopener noreferrer">App</a>
      </div>
    </div>
    <p class="text-gray-700 leading-relaxed">
      (With <a href="https://vionwinnie.github.io/" class="text-link hover:text-link-hover underline" target="_blank" rel="noopener noreferrer">Winnie Yeung</a>) — A streamlit application that explores the gap between large language models and specialized finetuned models in processing Cantonese content. <a href="https://pretalx.com/pyconhk2024/talk/CEWPVB/" class="text-link hover:text-link-hover underline" target="_blank" rel="noopener noreferrer">Presented</a> in PyCon Hong Kong 2024.
    </p>
  </article>

</div>
