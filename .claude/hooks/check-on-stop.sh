#!/usr/bin/env bash
# Stop hook: runs `npm run check:quick` when Claude finishes a turn. On a
# failure it blocks the stop once and sends the failing checks' output back to
# Claude. When Claude stops again after that (stop_hook_active), it lets the
# stop through, so it can never loop.
set -uo pipefail

if [ "$(jq -r '.stop_hook_active')" = "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
log=logs/check-quick.log
mkdir -p logs
if npm run check:quick > "$log" 2>&1; then
  exit 0
fi
sed -i 's/\x1b\[[0-9;]*m//g' "$log"

# Each failing check's prefix, such as "[static] [eslint]" or "[backend]",
# leaving out a parent like "[static]" when one of its own checks failed.
prefixes=$(grep -E 'exited with code [1-9]' "$log" | grep -oE '^(\[[^]]*\] )+' | sed 's/ $//' | sort -u)
{
  echo "npm run check:quick failed. Fix what it found, then finish again."
  echo "The full output is in $log."
  while IFS= read -r prefix; do
    if grep -qF "$prefix [" <<< "$prefixes"; then
      continue
    fi
    echo
    echo "$prefix failed:"
    grep -F "$prefix " "$log" | grep -v 'exited with code' | tail -n 40
  done <<< "$prefixes"
} >&2
exit 2
