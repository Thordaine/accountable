#!/usr/bin/env bash
# PreToolUse hook for the ui-check subagent: any file a Playwright MCP tool
# writes must land in .playwright-mcp/, and every screenshot must name its file.
set -uo pipefail

input=$(cat)
tool=$(jq -r '.tool_name' <<< "$input")
filename=$(jq -r '.tool_input.filename // empty' <<< "$input")
allowed="$CLAUDE_PROJECT_DIR/.playwright-mcp"

if [ -z "$filename" ]; then
  if [ "$tool" = "mcp__playright__browser_take_screenshot" ]; then
    echo "Blocked: pass a filename such as .playwright-mcp/<page>-<mode>.png." >&2
    exit 2
  fi
  exit 0
fi

resolved=$(cd "$CLAUDE_PROJECT_DIR" && realpath -m -- "$filename")
if [[ "$resolved" != "$allowed"/* ]]; then
  echo "Blocked: $filename is outside .playwright-mcp/. Save files as .playwright-mcp/<name>." >&2
  exit 2
fi
