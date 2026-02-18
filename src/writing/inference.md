---
title: Comparing ChatGPT, vLLM, and SGLang
date: 2026-02-17
description: An investigation into the Economics of Inference, comparing vLLM and SGLang for high-throughput information extraction.
tags: posts
---

# Comparing ChatGPT, vLLM, and SGLang

Notebook [here](https://colab.research.google.com/drive/1fwqXzZ9C2SL1SldK8abrxB1PE55TuPWj?usp=sharing)! Feel free to play around.

## Motivation

A couple of months ago, I watched PewDiePie’s [video](https://www.youtube.com/watch?v=qw4fDU18RcU&t=923s) where he essentially built his own mini-datacentre and an "AI council" by running multiple local models concurrently.

What really caught my attention was the blazing-fast throughput of these local models. Compared to the sometimes painstakingly slow response of ChatGPT, these local models spit out tokens as if you were watching a YouTube video at 3x speed.

I'm also deeply interested in how models interpret the world, and one of the most common file types we encounter daily is the PDF. PDFs are often highly unstructured, containing tables, diagrams, and drawings, making them notoriously difficult for models to parse accurately. A major hurdle in integrating LLMs into enterprise workflows is the demand for flawless data. Imagine parsing Nvidia’s latest 10-K and the model mistakenly reads $10,000,000 as $10,000.000—a single punctuation error can corrupt downstream data ingestion. Catching such errors would require word-by-word human verification of the model's output, which is simply not feasible at scale.

This led me to my core question: How do you achieve fast yet reliable information extraction?

As LLMs transition from research to production, the focus is shifting toward the Economics of Inference. While proprietary APIs like GPT-4o offer ease of use, they often become bottlenecks due to high latency and unpredictable unit costs at scale. For enterprise workflows—such as extracting financial data from unstructured PDFs—the challenge is achieving high throughput without sacrificing the deterministic reliability required for downstream ingestion. This investigation compares vLLM and SGLang, two leading frameworks designed to optimize the KV-cache and maximize GPU utilization through specialized attention mechanisms.

## What I Did

I chose [SROIE](https://github.com/zzzDavid/ICDAR-2019-SROIE/), a dataset of scanned receipt images used to benchmark OCR and information extraction. I initially planned for a more diverse dataset, but that would have required an extra model call to dynamically determine the schema, complicating the setup and making evaluation much harder.

The setup was straightforward:
- **Baseline**: GPT-5-mini (leveraging OpenAI's feature to constrain the model to output a specific schema, see [link](https://developers.openai.com/api/docs/guides/structured-outputs)).
- **Local Models**: Qwen3-VL-8B-Instruct-FP8 as the base model for both vLLM and SGLang.
- **Additional Comparison**: I also included Google Vision API (for OCR) and then fed its output to GPT-5-mini (for structured extraction) to see how a vision model's output would perform against state-of-the-art OCR solutions.

The extraction prompt looked like this:

```
Extract all visible information from this invoice/receipt image.

<instructions>
Extract EVERY field that is visible and legible
For fields not present or unclear: set value to null (do not guess)
Be precise about values (exact text, numbers, dates as shown)
</instructions>
Return a JSON object with these fields:
{
"vendor_name": "Business/company name",
"vendor_address": "Full address if visible",
"date": "Transaction date",
"total": "Total amount with currency",
"tax": "Tax amount if shown",
"line_items": ["item1", "item2"],
"payment_method": "Payment type if indicated",
"invoice_number": "Receipt/invoice ID if present"
}

Return ONLY valid JSON, no other text.

```

To evaluate the results, I used GPT-5.2 as a judge on two metrics: Adequateness (whether the required field is present) and Accuracy (whether the information is captured correctly and properly formatted).

## Results

| Metric | vLLM | SGLang | GPT-4o |
| :--- | :--- | :--- | :--- |
| **Primary Strength** | Stability & Community Support | Structured Output Latency | Zero Infrastructure Overhead |
| **Optimization Tech** | PagedAttention & Continuous Batching | RadixAttention & Prefix Caching | N/A (Closed Source) |
| **Ideal Use Case** | General High-Throughput Serving | Complex, Schema-Heavy Extraction | Low-Volume Prototyping |

![Benchmark Results](/writing/benchmark_results.png)

*(Placeholder for table from CSV - pending generation)*

GPT-5-mini performed the best in terms of data extraction, though the difference was insignificant. I believe this is largely due to the highly standardised nature of the dataset. The natural next step would be to test with a less structured dataset—ideally one where the schema varies across data points, requiring the model to dynamically output the data model itself.

### Speed

vLLM and SGLang are truly lightning fast! While GPT-5-mini averaged 5 seconds per image, vLLM took a mere 0.34 seconds, and SGLang was even faster at 0.17 seconds. The obvious trade-off is the setup time, as you need to download and launch the model.

This is where SGLang really shines. I used the offline engine mode for both SGLang and vLLM (as opposed to spinning up an HTTP server). SGLang was ready in less than 37 seconds, compared to around 417 seconds (~7 minutes) for vLLM. It’s worth exploring: 1) What makes vLLM and SGLang so fast? and 2) Why is SGLang’s setup time such a small fraction of vLLM’s?

### What Makes vLLM and SGLang So Powerful?

In LLM serving, the primary bottleneck during decoding is the memory capacity and bandwidth of the KV-cache. While storing keys and values (K/V) prevents redundant recomputation, traditional serving systems are notoriously inefficient in how they handle this memory. They typically allocate KV data as contiguous 'slabs' based on a request's maximum potential length. This leads to significant internal fragmentation and 'stranded' memory that cannot be utilized by concurrent requests—effectively capping throughput.

[vLLM](https://arxiv.org/pdf/2309.06180) addresses this through a fundamental architectural shift. At its core is PagedAttention, which manages the KV-cache similarly to virtual memory in an operating system. By storing KV data in fixed-size, non-contiguous blocks allocated from a central pool, vLLM eliminates external fragmentation and bounds wasted space to the final, partially filled block of a sequence.

This flexible memory management enables vLLM’s secondary throughput driver: Continuous Batching. Because memory is allocated dynamically rather than reserved in advance, the engine can inject new requests into the batch as soon as blocks become available, rather than waiting for an entire static batch to finish. By combining granular memory control with dynamic scheduling, the system eliminates 'bubbles' in GPU computation and maximizes aggregate throughput.

![vLLM PagedAttention](/writing/vLLM_fig3.png)
*Figure 3: PagedAttention memory management (Source: vLLM Paper)*

### What Makes SGLang Even Faster?

I have to say, the 50% drop in latency between vLLM and SGLang is just as striking as the 90%+ drop between GPT-5-mini and vLLM. I was very curious why.

The [SGLang paper](https://arxiv.org/pdf/2312.07104) offers some key insights. On top of the continuous batching technique used by vLLM, SGLang implements what they call a compressed finite state machine (FSM). Modern inference often uses an FSM as a filter to force the model’s output into a specific format, such as JSON. SGLang takes this a step further by iterating through the FSM and searching for "Singular transition edges" and "Compressed edges." A Singular transition edge is an edge in the FSM where there is only one single acceptable possible successor token. Consecutive singular edges are merged into a Compressed edge.

A simple example to illustrate this is the regex `{\"age\": \d+\}`. The characters "{", "\n", and the string up until ":" are all singular transition edges because the JSON schema is fixed. These consecutive singular edges are then compressed into one Compressed edge.

During inference, when the system encounters a compressed edge, it immediately appends the corresponding string to the output buffer without running the model, drastically saving compute resources and speeding up inference. The model only runs once with the prefilled text to predict the next uncertain token.

![SGLang Compressed FSM](/writing/SGLang_fig11.png)
*Figure 11: Compressed Finite State Machine (Source: SGLang Paper)*

In my specific use case, where I constrain the model output to a fixed JSON schema, I can fully leverage SGLang’s compressed FSM component. SGLang also uses RadixAttention and cache-aware scheduling. RadixAttention enables KV-cache prefix caching that treats KV-cache as a LRU-evictable tree structure and reuses computation across different requests (e.g., shared few-shot examples or system prompts). Cache-aware scheduling prioritises requests that share a high similarity with cached tokens. Both contribute to SGLang's improved performance over vLLM.

SGLang also publishes its own comparison benchmark between SGLang and vLLM here.

### Caveat

For the sake of illustration, I opted for a simpler setup in this notebook. However, in a production environment serving multiple users, you would need to spin up an HTTP server for both vLLM and SGLang, primarily adding to the initialisation (setup) cost.

Both libraries employ other nuances and tricks to boost speed, especially time-to-first-token (TTFT). Be sure to check out their docs or, even better, their papers! I personally found AlphaXiv helpful for my understanding.

## What I Learned
### Open-Source Solutions, While Powerful, Can Be Painful to Set Up

If the bottleneck of using a model API is speed, the bottleneck of building your own inference engine is stability and setup.

I spent the bulk of my time just getting vLLM and SGLang set up. Searching for the model-specific "recipe" (in this case, Qwen-VL-3) proved challenging (suggestions welcome!). Furthermore, the error logging in both libraries was not very descriptive, significantly compounding the difficulty of debugging.

If running this on a notebook is a pain to get operational, imagine deploying it in production and ensuring the model runs smoothly, and critically, being able to quickly diagnose what went wrong from the error logs when it fails.

### For Extraction, a Single Model Pass is Better Than OCR + LLM

I was curious: Would an OCR + LLM pipeline yield better results than simply using a Vision-Language Model (VLM) alone? Prompted by this, I implemented a setup where I first passed the receipt images to Google Vision API (an OCR service) before ingesting the OCR output into GPT-5-mini for structured data extraction.

For the data points where this workflow ran successfully, the result was only better by a rounding error. However, the LLM run was interrupted twice, causing the data extraction step to fail. While this could be prevented with retry loops, it highlights the potential instability when chaining multiple tools compared to having a VLM handle the entire process end-to-end.

## Future Work

As discussed, the dataset I used consisted entirely of receipts, meaning they all shared the same fixed schema. It would be fascinating to study what happens if the model were also tasked with extracting the schema and then using that dynamically generated schema to perform the extraction. I expect this added layer of complication would degrade model performance. It would also necessitate a gold-standard dataset for accurate evaluation, ideally using F1-score and Exact Match metrics, rather than relying on an evaluator LLM to perform the same task and compare against the candidate's input.

Another direction would be to fine-tune Qwen-3-VL and run ablations against the above task. Fine-tuning the model for this specific notebook's task offers limited benefits since all candidates performed relatively well. However, as the task becomes more complicated and abstract, introducing a fine-tuned model into the comparison will serve as a meaningful benchmark against the non-fine-tuned model.

Beyond raw inference speed, the next phase involves containerization (Docker/K8s) and testing with model quantization (AWQ or FP8). Quantization is particularly vital for fitting larger VLMs into consumer or mid-tier enterprise GPUs while maintaining the memory bandwidth necessary for high-speed decoding.