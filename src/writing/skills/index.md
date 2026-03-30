---
layout: layouts/post.njk
title: "How I Stopped Babysitting My PRs"
date: 2026-03-29
description: Building Claude Code skills to automate the mundane parts of the PR lifecycle.
tags: posts
---

# How I Stopped Babysitting My PRs

## Motivation

I've been using Claude Code extensively for the past few months. Along the way, I've built a set of skills — reusable workflow definitions that teach the agent how to do things my way. Given how fast AI is evolving (R.I.P Sora), I think it'd be interesting to look back in a year at how this usage has changed. So I'm sharing what I've built, why, and what I think is still missing.

I mostly use Claude Code these days. In Claude Code, you can extend the agent with **skills** — folders containing instructions, scripts, and config files that teach Claude new workflows. If you're new to skills, I recommend this [article](https://x.com/trq212/status/2033949937936085378) by the Claude Code team. The short version: you define trigger points, and the model acts on them.

## Starting point

Most teams have some version of a PR skill. The baseline looks something like this:

```
Commit → Push → Generate description → Create PR
```

Four steps. Gets code from your machine to GitHub with a description. I started here and kept running into the same friction points, so I kept adding to it.

### Rebase

Sometimes while I am working on a branch, changes are introduced to main. To keep my PR clean, I rebase my commits onto the latest main — replaying them on top of the new changes — then force-push with `--force-with-lease` so the PR only contains my work. So the first two steps now become:

```
Commit → Rebase onto main → Push (force-with-lease) ...
```

### Routing

I would normally ask the same people to review my code. Instead of manually assigning them every time a PR is created, I added a routing step between `Generate description` and `Create PR`.

> **Route reviewers and assign the PR** using the config in `routing.json`. Match changed file paths against `reviewers` keys, always include `alwaysReview` entries, and pick assignees based on whether changes match domain-specific patterns.

This is what I mean when I say a skill is beyond `SKILL.md` — `routing.json` is a config file that sits alongside the skill, so anyone who forks it can plug in their own team's routing without touching the workflow logic.

```json
{
  "reviewers": {
    "apps/frontend-*": "@my-org/frontend-team",
    "apps/backend-*": "@my-org/backend-team"
  },
  "assignees": {
    "default": ["lead-reviewer"],
    "ai": ["lead-reviewer", "ml-engineer"]
  },
  "aiPatterns": ["llm", "evaluation", "extraction"]
}
```

So now my PR workflow becomes:

```
Commit → Rebase onto main → Push (force-with-lease) → Generate description → Route reviewers & assign (from routing.json) → ...
```

### /review-pr

What normally happens when I open a PR is: I open it, wait for bots to review, review the suggestions, fix them, push again, and then wait for another round of reviews until no further fixes are needed. What bugs me is that AI-assisted coding tools always uncover something that wasn't in their original comments, and the code review process quickly turns into a whack-a-mole game. I thought to myself — why not let Claude handle this?

![A Diglett](diglett.jpeg)
*what my PR review process felt like*

Hence I created `/review-pr`, which is invoked after the PR is created. `/review-pr` takes rounds as an argument (default 2) and does the following:

> **On round 1:** check if the PR already has review comments or bot comments. If it does, collect them immediately. If not, wait 2 minutes then poll every 15 seconds for up to 5 minutes total. If still zero after 5 minutes, report "No review feedback received on PR #N after 5 minutes" and stop.
>
> **On subsequent rounds:** wait 2 minutes for bots to re-review the push, then poll every 15 seconds for up to 5 minutes total for NEW comments (created after `PUSH_TIME`). If no new comments appear, skip to the final summary.

The human only enters the loop after Claude handles the first two rounds of bot comments. The heuristic I employ here is that the most serious bugs are flagged in the first if not second round of bot comments. By the time a human enters the loop at the end of round 2, they can decide whether to address the comment or fix it in future PRs.

So now the entire process becomes:

```
Commit → Rebase onto main → Push (force-with-lease) → Generate description → Route reviewers & assign (from routing.json) → Create PR → Launch /review-pr in background
```

and `/review-pr` does the following:

```
Wait for comments → Collect feedback → Classify (valid/stale/won't-fix) → Fix valid issues → Verify locally → Commit & push → Reply to comments → [repeat for round 2] → Summary table
```

### /post-merge-followup

When a PR is approved and merged, oftentimes there are follow-ups to be addressed in future PRs. In light of that, I created `/post-merge-followup`, which:

```
Fetch PR context → Find linked ticket → Identify follow-up candidates → Present table to user → Confirm → Create tickets → Comment on PR → Notify reviewers
```

This saves me from the tedious back-and-forth of copying links between GitHub, the ticket tracker, and chat.

## [/review-plan](https://github.com/sucramual/review-plan-skill)

We all use plan mode before any major code changes, but it's sometimes hard to gauge how good the plan is. Since models tend to display sycophantic behaviour, simply asking it to review its own plan might not be the best idea. `/review-plan` dispatches subagents with fresh context — the reviewer sees only the plan and the codebase, not the conversation that produced it, so it evaluates the plan on its own merits rather than anchoring on prior decisions. You can assign up to three personas (want Larry Page to review your architecture? go ahead) and use `--reviewer codex` for cross-model review, where a different model catches blind spots that the original might miss, similar to having a second human reviewer.

I really enjoy using `/review-plan` and I would love to hear any feedback regarding the skill!

## Conclusion

Personally, I think the best part of skill building is that the cost of iterating is almost zero — if you are unsatisfied with what a skill is doing, or there are more personalised needs that the skill can't offer, just revise or fork it. I have iterated 4-5 times as I built `/open-pr` and `/review-pr`, from invoking the skills manually to now chaining them together as a closed loop. The thread running through all of these skills is the same: free the human from mundane work, and only pull them in when judgement is needed.

One thing I've noticed is that there's no good way to evaluate or compare skills. When multiple people build skills for the same workflow, there's no metric to tell you which one is better — you just try them. As skills become more central to agentic coding, I think we'll need more structure here: benchmarks, usage analytics, or at minimum a way to A/B test two skills against each other. But that's a problem for another post.

All the skills discussed in this post are available on GitHub: [pr-skills](https://github.com/sucramual/pr-skills) and [review-plan-skill](https://github.com/sucramual/review-plan-skill). If there are skills you use a lot and find helpful, I'd love to hear. Also happy to chat about skills and all things AI. Feedback is welcome.
