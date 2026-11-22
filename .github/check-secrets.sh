#!/usr/bin/env bash
# Fails if tracked files look like they contain secrets or signing material.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
fail=0
if git ls-files | grep -Ei '(^|/)\.env($|\.)' | grep -v '\.env\.example$'; then echo "Tracked .env file found"; fail=1; fi
if git ls-files | grep -Ei '\.(keystore|jks|p8|p12|mobileprovision)$'; then echo "Signing material tracked"; fail=1; fi
if git grep -InE '(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|vcp_[A-Za-z0-9]{20,}|AX[A-Za-z0-9]{30,}=*$)' -- . ':!scripts-check-secrets.sh'; then echo "Possible secret in tracked files"; fail=1; fi
if git grep -InE 'EXPO_PUBLIC_[A-Z_]*(KEY|SECRET|TOKEN)' -- . ':!scripts-check-secrets.sh' ':!docs' ':!README.md'; then echo "Secret-like EXPO_PUBLIC variable"; fail=1; fi
[ "$fail" = 0 ] && echo "No secrets detected." || exit 1
