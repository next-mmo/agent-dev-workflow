#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  scripts/bump-release-id.sh [--check] [<commit-sha>]

Without a commit SHA, use the currently checked-out Git HEAD. The script does
not fetch, resolve remote branches, or query the npm registry.

Options:
  --check  Verify that every release reference already uses the selected SHA;
           do not modify files.
EOF
}

check_only=false
release_id=""
for argument in "$@"; do
  case "$argument" in
    --check) check_only=true ;;
    --help|-h) usage; exit 0 ;;
    --*) usage; exit 2 ;;
    *)
      if [[ -n "$release_id" ]]; then
        usage
        exit 2
      fi
      release_id="$argument"
      ;;
  esac
done

script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(CDPATH= cd -- "$script_dir/.." && pwd)"

if [[ -z "$release_id" ]]; then
  release_id="$(git -C "$repo_root" rev-parse HEAD)"
fi

if [[ ! "$release_id" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'error: release ID must be a full 40-character lowercase commit SHA\n' >&2
  exit 2
fi

release_pattern='github:next-mmo/agent-dev-workflow#[0-9a-f]{40}|agent-dev-workflow\.git#[0-9a-f]{40}|current reviewed commit is [^0-9a-f]*[0-9a-f]{40}'
changed_files=()
mismatches=()
references=0

while IFS= read -r relative_file; do
  [[ -n "$relative_file" ]] || continue
  absolute_file="$repo_root/$relative_file"
  [[ -f "$absolute_file" ]] || continue
  LC_ALL=C grep -Iq . "$absolute_file" || continue

  matches="$(LC_ALL=C grep -Eo "$release_pattern" "$absolute_file" 2>/dev/null || true)"
  [[ -n "$matches" ]] || continue
  file_references=0
  while IFS= read -r match; do
    [[ -n "$match" ]] || continue
    current_id="$(printf '%s\n' "$match" | sed -E 's/.*([0-9a-f]{40}).*/\1/')"
    references=$((references + 1))
    file_references=$((file_references + 1))
    if [[ "$current_id" != "$release_id" ]]; then
      mismatches+=("$relative_file: $current_id")
    fi
  done <<< "$matches"

  [[ "$check_only" == true ]] && continue
  temporary_file="$(mktemp)"
  sed -E \
    -e "s|(github:next-mmo/agent-dev-workflow#)[0-9a-f]{40}|\\1${release_id}|g" \
    -e "s|(agent-dev-workflow\\.git#)[0-9a-f]{40}|\\1${release_id}|g" \
    -e "s|(current reviewed commit is [^0-9a-f]*)[0-9a-f]{40}|\\1${release_id}|g" \
    "$absolute_file" > "$temporary_file"
  if cmp -s "$absolute_file" "$temporary_file"; then
    rm -f "$temporary_file"
  else
    chmod --reference="$absolute_file" "$temporary_file" 2>/dev/null || true
    mv -f "$temporary_file" "$absolute_file"
    changed_files+=("$relative_file")
  fi
done < <(git -C "$repo_root" ls-files --cached --others --exclude-standard)

if [[ "$references" -eq 0 ]]; then
  printf 'error: no Agent Workflow Scrum release references found\n' >&2
  exit 1
fi
if [[ "$check_only" == true && "${#mismatches[@]}" -gt 0 ]]; then
  printf 'error: release references are not synchronized to %s:\n' "$release_id" >&2
  printf '%s\n' "${mismatches[@]}" >&2
  exit 1
fi

if [[ "$check_only" == true ]]; then
  if [[ "$references" -eq 1 ]]; then suffix=""; else suffix="s"; fi
  printf 'release ID check passed: %s (%s reference%s)\n' "$release_id" "$references" "$suffix"
else
  if [[ "${#changed_files[@]}" -eq 1 ]]; then file_suffix=""; else file_suffix="s"; fi
  if [[ "$references" -eq 1 ]]; then reference_suffix=""; else reference_suffix="s"; fi
  printf 'release ID synchronized to %s: %s file%s, %s reference%s\n' \
    "$release_id" "${#changed_files[@]}" "$file_suffix" "$references" "$reference_suffix"
  for file in "${changed_files[@]}"; do printf '%s\n' "- $file"; done
fi
