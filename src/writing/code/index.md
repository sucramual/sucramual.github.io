---
layout: layouts/post.njk
title: "Inside the Serving Loop: How vLLM and SGLang Actually Handle Your Requests"
date: 2026-03-07
description: I read both codebases. They're more similar than you think.
tags: posts
references:
  - authors: "Kwon, W., Li, Z., Zhuang, S. et al."
    title: "Efficient Memory Management for Large Language Model Serving with PagedAttention"
    url: "https://arxiv.org/pdf/2309.06180"
    venue: "SOSP 2023"
    year: "2023"
  - authors: "Zheng, L., Yin, L., Xie, Z. et al."
    title: "SGLang: Efficient Execution of Structured Language Model Programs"
    url: "https://arxiv.org/pdf/2312.07104"
    year: "2024"
---

# Inside the Serving Loop: How vLLM and SGLang Actually Handle Your Requests

*Part 1a of a code-path study series — what I found reading both codebases, and what I want to test next.*

In my [previous post](/writing/inference/), I benchmarked vLLM and SGLang from the outside — measuring speed and accuracy on structured extraction tasks. The numbers were interesting, but they raised a harder question: *why* do these frameworks perform the way they do?

To find out, I did what any self-respecting engineer would do: I read the code. Both codebases, end-to-end, tracing a single request from API entry to first token output.

What surprised me most wasn't the differences — it was how similar the two frameworks are. They share the same high-level architecture, the same core optimizations, and in many places, nearly identical design decisions. The community discourse sometimes treats them as fundamentally different approaches to inference serving. They're not. They're two implementations of the same ideas, with a few divergence points that *might* matter for performance. This post is about those divergence points, and what I plan to test in Part 1b.

## The Path of a Request

Both frameworks follow the same basic flow. A request arrives over HTTP, gets tokenized, crosses a process boundary via ZMQ to a scheduler, the scheduler decides what to compute and allocates KV cache memory, a GPU worker runs the forward pass, and the first token streams back.

Here's what that looks like, with the points where the two frameworks diverge marked:

```
 Request arrives (HTTP)
       |
 Tokenize prompt
       |
 Send to scheduler (ZMQ)
       |
 Scheduler receives request, adds to waiting queue
       |
       |  ┌─────────────────────────────────────────────────────┐
       |  │ DIVERGENCE 1: Scheduling Priority                   │
       |  │                                                     │
       |  │ vLLM: schedule decode first, then prefill            │
       |  │ SGLang: schedule prefill first, then decode          │
       |  └─────────────────────────────────────────────────────┘
       |
 Look up prefix cache for shared/repeated prompt tokens
       |
       |  ┌─────────────────────────────────────────────────────┐
       |  │ DIVERGENCE 2: Prefix Cache & Allocation             │
       |  │                                                     │
       |  │ vLLM: block-hash lookup, 16-token blocks,           │
       |  │       block-aligned allocation (CPU free list)      │
       |  │                                                     │
       |  │ SGLang: radix trie walk, token-by-token,            │
       |  │         per-token allocation (GPU free list)        │
       |  └─────────────────────────────────────────────────────┘
       |
 Forward pass (attention + MLP layers)
       |
 KV cache written with new key-value pairs
       |
 Sample output token → stream back to client
```

Everything outside the boxes is shared. Same ZMQ transport, same busy-loop scheduling, same "allocate before forward pass" pattern, same streaming output. The boxes are where the interesting decisions live.

## Prefix Cache Granularity — Blocks vs. Tokens

When multiple requests share the same system prompt (which is most production workloads), both frameworks try to avoid recomputing the shared prefix by caching the KV values from the first request and reusing them for subsequent ones. The difference is in how fine-grained that caching is.

vLLM caches at block granularity. The default block size is 16 tokens. Only full blocks — blocks completely filled with computed tokens — are hashed and eligible for caching. The rule is explicit in the code:

```python
# vLLM: kv_cache_utils.py:574-576
# "We only hash full blocks"
# end_token_idx = start_token_idx + block_size must be <= num_tokens

# The block count is computed via integer division:
# single_type_kv_cache_manager.py:249
num_full_blocks = num_tokens // self.block_size
```

SGLang caches at token granularity. With the default `page_size=1`, the radix trie matches token by token:

```python
# SGLang: server_args.py:2198-2200
def _handle_page_size(self):
    if self.page_size is None:
        self.page_size = 1

# radix_cache.py:191-198 — _key_match_page_size1
# Matches individual tokens against the trie, one at a time.
# Every token in a shared prefix that exists in the tree is a hit.
```

I sent the same 100-token system prompt twice and measured cached tokens on the second request. The Qwen3-VL chat template adds ~18 tokens of markup, so the actual prompt was 118 tokens. Here's what vLLM does with that, block by block:

- Block 0: tokens 0–15 → hashed as `hash(NONE_HASH, (tok0...tok15))` → cached
- Block 1: tokens 16–31 → hashed as `hash(block0_hash, (tok16...tok31))` → cached
- ...through Block 6: tokens 96–111 → cached
- Tokens 112–117 → partial block. `num_full_blocks = 118 // 16 = 7`, so only 112 tokens enter the cache.

SGLang's radix trie matches all 117 (every token but the last, which must be recomputed for logit generation). The results:

| Framework | Prompt Tokens | Cached (2nd request) | Recomputed |
|-----------|--------------|----------------------|------------|
| vLLM      | 118          | **112**              | 6          |
| SGLang    | 118          | **117**              | 1          |

vLLM cached exactly `floor(118/16) * 16 = 112` tokens. SGLang cached `118 - 1 = 117`. The formulas match the code exactly.

I also swept across different prompt lengths to check alignment effects:

| Content Tokens | Total Prompt | vLLM Cached | SGLang Cached | vLLM Waste |
|---------------|-------------|-------------|---------------|------------|
| 16            | 34          | 32          | 33            | 2 tokens   |
| 17            | 35          | 32          | 34            | 3 tokens   |
| 31            | 49          | 48          | 48            | 1 token    |
| 32            | 50          | 48          | 49            | 2 tokens   |
| 48            | 66          | 64          | 65            | 2 tokens   |
| 49            | 67          | 64          | 66            | 3 tokens   |

vLLM's cached values are always exact multiples of 16. SGLang's are always `total - 1`. The waste varies from 1 to 15 tokens depending on alignment — small per request, but it compounds under concurrency. For a 4B model, prefill throughput is roughly 10,000–50,000 tokens/sec depending on batch size. Six wasted tokens per request costs ~0.12–0.6ms. Across 100 concurrent requests sharing the same system prompt, that's 12–60ms of aggregate wasted compute per scheduling cycle. Not catastrophic, but not zero.

One subtlety I expected to find but didn't: vLLM's `get_computed_blocks()` caps the cache hit at `num_tokens - 1`, which should force recomputing an extra block when the prompt length is an exact multiple of 16. In practice, the chat template overhead makes exact block alignment unlikely, so this edge case didn't surface in my tests.

## The Radix Cache Remembers Everything — Including Output Tokens

This is the observation I find most interesting, and it required a failed experiment to understand correctly.

Both frameworks cache KV values for the input prompt. But SGLang's radix trie stores the full token path — input *and* output — for every request. This means in multi-turn conversations, the second turn's prefix match can extend through the prior turn's output tokens, not just the shared system prompt.

SGLang inserts into its radix cache after every decode step and again at request completion:

```python
# SGLang: scheduler_output_processor_mixin.py:384
# Inside process_batch_result_decode(), for every decoding request:
self.tree_cache.cache_unfinished_req(req)

# cache_unfinished_req (radix_cache.py:506-569) calls insert()
# with the full token sequence so far: input + all output tokens generated.
# The trie grows incrementally as the request decodes.
```

A concrete example of how this helps. Turn 1: `[system prompt] + "What is prefix caching?"` → model generates `"Prefix caching is a technique that..."`. After turn 1 completes, the radix trie contains the full path: system prompt, user message, and the entire assistant response. Turn 2: `[system prompt] + "What is prefix caching?" + "Prefix caching is a technique that..." + "Tell me more."` → `match_prefix()` walks the trie and matches everything up to the new user message — the entire first turn including the assistant's output tokens. Turn 2 skips recomputing KV for all of turn 1. Only the new user message needs a forward pass.

vLLM can also cache output tokens through its block-hash mechanism — completed blocks are hashed regardless of whether they contain input or output tokens:

```python
# vLLM: kv_cache_utils.py:558
# Block hash is a chained hash:
hash_function((parent_block_hash, curr_block_token_ids_tuple, extra_keys))

# Blocks are hashed when full (16 tokens), in the NEXT scheduling step.
# single_type_kv_cache_manager.py:249 — cache_full_blocks()
```

So vLLM's multi-turn caching works too, but at block granularity with the same alignment constraints — you lose up to 15 tokens at the boundary between turn 1's output and turn 2's new input.

I initially tested this wrong. My first experiment sent two independent requests with the same input prompt and expected the second request to benefit from the first's output tokens. It didn't — because `match_prefix()` walks the trie against the *new request's* token sequence, and request B's input didn't include request A's output. The cached tokens topped out at 117 (prompt only), same as the single-turn test. The lesson: output token sharing requires a future request whose input contains the prior output — the typical multi-turn conversation pattern.

So I ran the correct test. Two-turn conversation: turn 1 generates a 64-token response about Paris, then turn 2 includes that response as history and asks a follow-up question.

| Metric | vLLM | SGLang |
|--------|------|--------|
| Turn-1 prompt tokens | 120 | 120 |
| Turn-1 output tokens | 64 | 64 |
| Turn-2 total prompt tokens | 198 | 198 |
| **Turn-2 cached (cold)** | **176** | **184** |
| Output tokens shared | **56 of 64** | **64 of 64** |

SGLang cached all 64 output tokens from turn 1: `184 = 120 (turn-1 prompt) + 64 (turn-1 output)`. The radix trie retained the full sequence and `match_prefix()` matched it token by token. vLLM cached 56 of 64 output tokens: `176 = floor(184/16) * 16`. The remaining 8 output tokens sit in a partial block — the same block-alignment constraint, now applied to output tokens.

In this single two-turn exchange, vLLM wastes 6 tokens on the prompt prefix + 8 tokens at the output block boundary = 14 tokens total. SGLang wastes 0 (aside from the mandatory last-token recompute).

Multi-turn conversations are the dominant production workload for chat applications. Each turn adds the full prior conversation as context. A 10-turn conversation where each assistant response is 200 tokens means turn 10's input contains ~2000 tokens of prior output. The block-alignment waste compounds at every turn boundary — with random alignment, that's roughly 7.5 tokens lost per boundary × 10 turns ≈ 75 tokens of cumulative waste in vLLM that SGLang avoids entirely.

### A Note on Scheduling Order

One more divergence worth mentioning briefly. The two frameworks schedule prefill and decode work in opposite order: vLLM processes decode requests first, then admits new prefill requests from whatever token budget remains. SGLang checks for a prefill batch first and only falls back to decode when there's no prefill work pending. In practice, with chunked prefill enabled (the production configuration), this ordering difference is unlikely to dominate — but it might show up in mixed-traffic experiments.

## What I Want to Test Next

Reading the code gave me two concrete questions I want to answer with experiments.

**Does block alignment actually show up in TTFT?** If I sweep system prompt lengths across values that are and aren't multiples of 16 — say, 12, 16, 28, 32, 44, 48 tokens — does vLLM's TTFT disadvantage appear specifically at misaligned lengths? If so, how large is the effect? And does setting `block_size=1` in vLLM eliminate it?

**Does radix cache depth matter for multi-turn conversations?** In a 10-turn conversation, does SGLang's token-granular radix cache produce measurably lower TTFT on later turns compared to vLLM's block-aligned caching? The savings should compound with conversation depth — each turn boundary is another potential alignment loss for vLLM. And for structured output workloads where multiple requests share conversation history, does the deeper cache hit translate to throughput gains?

And underneath both of these, a broader question: do these architectural differences actually matter for real workloads, or have both frameworks optimized the common case so thoroughly that the divergence points are noise?

I suspect the answer is closer to "noise" than most people expect. But I'd rather measure than guess. That's what Part 1b is for.

*All smoke trace scripts and raw data are in the [repo](https://github.com/marcuslau0903/vllm-sglang-study). Next: Part 1b — running the experiments.*
