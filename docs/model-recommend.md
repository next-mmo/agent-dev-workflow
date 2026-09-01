# My OpenCode Go Model Combo

> User-provided recommendation snapshot. Verify current model availability, plan limits, pricing, and benchmark results before relying on it.

## Task-to-model routing

| Task | Model |
| --- | --- |
| 📝 Understand requirement | **GLM-5.3 Flash** |
| 🧠 Make implementation plan | **GLM-5.3 Flash** |
| 💻 Normal feature coding | **GPT-5.6 Luna** |
| 🏗️ Larger/complex coding | **GLM-5.3** |
| 🧪 Generate tests | **DeepSeek V4 Flash** |
| 🔧 Run/fix tests | **DeepSeek V4 Flash** |
| 🐛 Normal debugging | **Luna** |
| 🔥 Difficult debugging | **GLM-5.3** |
| 🔍 Code review | **GLM-5.3 Flash** |
| ♻️ Refactor repetitive code | **Qwen3.8 Flash / DeepSeek Flash** |
| 📚 Docs/types/lint | **LongCat 2.0 / DeepSeek Flash** |
| 🚨 Really stuck | **Grok 4.6** |
| 🚨 Second opinion | **Kimi K3** |

## Usage split

**40% → GPT-5.6 Luna**

Your general worker. Strong enough to implement real features without destroying quota.

**25% → GLM-5.3 Flash**

Planning, reviewing, repo analysis, architecture, and harder implementation.

**20% → DeepSeek V4 Flash**

Tests, lint, builds, mechanical refactoring, and repetitive fixes.

**10% → Qwen3.8 Flash / LongCat**

Cheap background or subagent work.

**5% → GLM-5.3 / Grok 4.6 / Kimi K3**

Only when the cheap models fail.

## Model to watch: Qwen3.8 Flash

Qwen3.8 Flash has a particularly attractive coding profile:

- **DeepSWE: 58.7**
- **SWE-bench Pro: 62.5**
- **SWE-bench Multilingual: 81.0**

Go gives around **27,000 requests/month**. That makes it potentially better than DeepSeek Flash for actual code generation, while DeepSeek Flash remains useful for massive cheap agent loops.

## Simplified four-model setup

> 🧠 **GLM-5.3 Flash — planner/reviewer**
> 💻 **GPT-5.6 Luna — main developer**
> 🧪 **DeepSeek V4 Flash — test/fix worker**
> 🔥 **GLM-5.3 — difficult tasks**

ref: https://opencode.ai/docs/go/
