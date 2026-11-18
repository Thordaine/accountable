#!/usr/bin/env bash
# PreToolUse hook for the reviewer subagent: lets Bash run only commands
# that read. Each part of a pipeline or command list must start with an
# allowed command, and redirects to files and command substitution are blocked.
set -uo pipefail

READ_COMMANDS="cd cat head tail less grep rg ls find wc sort uniq cut diff tree pwd echo jq file stat basename dirname"
GIT_READ="diff log show status grep blame ls-files ls-tree rev-parse merge-base cat-file shortlog describe branch"

block() {
  echo "Blocked: the reviewer may only run commands that read. $1" >&2
  exit 2
}

command=$(jq -r '.tool_input.command // empty')
cleaned=$(sed -E 's#[0-9]?>(/dev/null|&[0-9])##g' <<< "$command")

grep -q '[>`]\|\$(' <<< "$cleaned" && block "No redirects to files or command substitution."
grep -qE -- '-delete|-exec|--output' <<< "$cleaned" && block "No options that write."
grep -qE 'git\s+branch\s+.*-(d|D|m|M|c|C)\b' <<< "$cleaned" && block "git branch may only list."

while read -r part; do
  [ -z "$part" ] && continue
  read -r cmd sub _ <<< "$part"
  if [ "$cmd" = "git" ]; then
    [[ " $GIT_READ " == *" $sub "* ]] || block "git $sub is not a read-only git command."
  else
    [[ " $READ_COMMANDS " == *" $cmd "* ]] || block "$cmd is not on the read-only list."
  fi
done < <(sed -E 's/(\|\||&&|;|\|)/\n/g' <<< "$cleaned")

exit 0
