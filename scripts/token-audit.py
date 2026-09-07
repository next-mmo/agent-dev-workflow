"""Measure emitted context with model tokenizers; never infer task cost savings.

Optional audit dependency: tiktoken. No model API calls or repository mutations.
Run from any directory with --output <json-path> to retain the measurements.
"""
import argparse
import importlib.metadata
import json
import math
from pathlib import Path
import subprocess
import tempfile

import tiktoken

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path)
args = parser.parse_args()
source = Path(__file__).resolve().parent.parent
binary = source / 'packages/agent-workflow-scrum/bin/agent-workflow.mjs'
encodings = {name: tiktoken.get_encoding(name) for name in ('cl100k_base', 'o200k_base')}
measurements = []


def command(argv, root):
    return subprocess.check_output(argv, cwd=root, text=True, timeout=30, stderr=subprocess.PIPE)


def measure(root, name, scope, level, budget):
    argv = ['node', str(binary), 'context', scope, '--root', str(root), '--provider', 'local',
            '--level', str(level), '--budget', str(budget)]
    emitted = command(argv + ['--json'], root)
    data = json.loads(emitted)
    compact = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    text = command(argv, root)
    measurements.append({
        'scenario': name, 'level': level, 'budget': budget,
        'reportedHeuristicTokens': data['estimatedTokens'],
        'emittedJsonCharacterEstimate': math.ceil(len(emitted) / 4),
        'selectedDocuments': len(data['selected']), 'loadedDocuments': len(data['documents']),
        'tokenizers': {name: {
            'emittedJsonTokens': len(encoding.encode(emitted, disallowed_special=())),
            'compactJsonTokens': len(encoding.encode(compact, disallowed_special=())),
            'emittedTextTokens': len(encoding.encode(text, disallowed_special=())),
        } for name, encoding in encodings.items()},
    })


for scope in ('release security verification', 'consumer initialization package distribution',
              'context budgeting providers token savings'):
    for level in (0, 1):
        measure(source, 'source: ' + scope, scope, level, 1500)

with tempfile.TemporaryDirectory(prefix='agent-token-audit-') as directory:
    for language, sentence in {
        'English': 'Invoice isolation must prevent one tenant from reading another tenant account.',
        'Khmer': 'ការពារទិន្នន័យអតិថិជន និងផ្ទៀងផ្ទាត់សិទ្ធិអ្នកប្រើប្រាស់មុនអានទិន្នន័យ។',
        'Chinese': '必须验证租户权限，防止读取其他客户的数据，并测试失败恢复和重复付款。',
    }.items():
        root = Path(directory) / language
        docs = root / '.agents/docs/prd'
        docs.mkdir(parents=True)
        (root / 'AGENTS.md').write_text('# Instructions\nProtect tenant data.\n')
        (root / 'CONTEXT.md').write_text('# Context\nInvoice acceptance.\n')
        (docs / '0000-prd-index.md').write_text('# PRDs\n- Invoice\n')
        (docs / '0001-invoice.md').write_text('# Invoice\n' + (sentence + '\n') * 100)
        command(['git', 'init', '-q'], root)
        for level in (0, 1, 2):
            measure(root, language, 'invoice', level, 1500)

report = {
    'schemaVersion': 1,
    'sourceCommit': command(['git', 'rev-parse', 'HEAD'], source).strip(),
    'tiktokenVersion': importlib.metadata.version('tiktoken'),
    'measurement': 'emitted-context-tokenization',
    'actualTaskTokenSavings': None,
    'limitations': [
        'Tokenizer counts are not billed API usage; no inference requests were made.',
        'No equivalent end-to-end task pairs, completion tokens, cache accounting, or defect outcomes.',
        'The repository documents characters/4 as a heuristic; these counts test its practical limits.',
        'Source routing includes the audit worktree; the release package code is unchanged.',
    ],
    'measurements': measurements,
}
if args.output:
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps(report, indent=2, ensure_ascii=False))
