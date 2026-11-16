#!/usr/bin/env bash
# PreToolUse hook: blocks any edit to a file named .env, whether through
# Claude's file tools or a shell command that names it.
set -uo pipefail

input=$(cat)
path=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<< "$input")
command=$(jq -r '.tool_input.command // empty' <<< "$input")

if [ -n "$path" ] && [ "$(basename "$path")" = ".env" ]; then
  echo "Blocked: .env holds secrets and must not be edited by Claude. Ask the user to change it." >&2
  exit 2
fi

if grep -qE '(^|[^A-Za-z0-9_.-])\.env($|[^A-Za-z0-9_.-])' <<< "$command"; then
  echo "Blocked: this command names .env, which holds secrets and must not be touched by Claude. Ask the user to change it." >&2
  exit 2
fi
