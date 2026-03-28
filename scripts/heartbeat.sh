#!/usr/bin/env bash
# Agent heartbeat script — call from CC hooks to report agent status
# Usage: heartbeat.sh <start|alive|completed> <agent-type> [task] [project]
#
# Environment:
#   WHITEBOX_HEARTBEAT_URL  — e.g. https://whitebox.vercel.app/api/heartbeat
#   WHITEBOX_HEARTBEAT_SECRET — shared secret for auth (optional)

set -euo pipefail

STATUS="${1:-}"
AGENT_TYPE="${2:-}"
TASK="${3:-}"
PROJECT="${4:-}"

if [[ -z "$STATUS" || -z "$AGENT_TYPE" ]]; then
  echo "Usage: heartbeat.sh <start|alive|completed> <agent-type> [task] [project]" >&2
  exit 1
fi

URL="${WHITEBOX_HEARTBEAT_URL:-}"
if [[ -z "$URL" ]]; then
  exit 0  # silently skip if not configured
fi

AUTH_HEADER=""
if [[ -n "${WHITEBOX_HEARTBEAT_SECRET:-}" ]]; then
  AUTH_HEADER="Authorization: Bearer $WHITEBOX_HEARTBEAT_SECRET"
fi

curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  ${AUTH_HEADER:+-H "$AUTH_HEADER"} \
  -d "{\"agentType\":\"$AGENT_TYPE\",\"status\":\"$STATUS\",\"task\":\"$TASK\",\"project\":\"$PROJECT\"}" \
  --max-time 5 \
  >/dev/null 2>&1 || true
