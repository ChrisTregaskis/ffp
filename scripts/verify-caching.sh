#!/bin/bash

# FFP-22: Turborepo Caching Verification Script
# Usage: 
#   bash scripts/verify-caching.sh           # Run all tests
#   bash scripts/verify-caching.sh 1         # Run specific test (1-10)
#   bash scripts/verify-caching.sh lambda    # Run only Lambda tests (8-9)
#   bash scripts/verify-caching.sh cache     # Run only cache tests (1-7)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Terminal prefix helpers (matching TypeScript logger)
prefix_info() { echo -e "${BLUE}[INFO]${NC}"; }
prefix_success() { echo -e "${GREEN}[SUCCESS]${NC}"; }
prefix_running() { echo -e "${CYAN}[RUNNING]${NC}"; }

# Helper functions
clean_cache() {
  echo -e "$(prefix_info) Cleaning cache and build outputs..."
  rm -rf node_modules/.cache/turbo
  rm -rf packages/*/dist
  echo ""
}

clean_cache_only() {
  echo -e "$(prefix_info) Cleaning cache only (keeping dist for Lambda simulation)..."
  rm -rf node_modules/.cache/turbo
  echo ""
}

time_command() {
  local name=$1
  shift
  echo -e "$(prefix_running) $name"
  local start=$(date +%s%N)
  "$@"
  local end=$(date +%s%N)

  if command -v bc >/dev/null 2>&1; then
    local duration=$(echo "scale=2; ($end - $start) / 1000000000" | bc)
  else
    local duration_ns=$((end - start))
    local duration=$((duration_ns / 1000000000))
  fi

  echo -e "$(prefix_success) Completed in ${duration}s"
  echo ""
  return 0
}

show_usage() {
  echo "Turborepo Caching & Lambda Simulation"
  echo "=============================================="
  echo ""
  echo "Usage:"
  echo "  $0           # Run all tests (1-10)"
  echo "  $0 1         # Run specific test (1-10)"
  echo "  $0 cache     # Run only cache tests (1-7)"
  echo "  $0 lambda    # Run only Lambda tests (8-9)"
  echo "  $0 help      # Show this help"
  echo ""
  echo "Available tests:"
  echo "  1: Cold Build (No Cache)"
  echo "  2: Warm Build (Full Cache Hit)"
  echo "  3: Lambda Simulation (Cache-Only Clean)"
  echo "  4: Documentation Change (Should Hit Cache)"
  echo "  5: Source Code Change (Should Miss Cache)"
  echo "  6: Lint and Typecheck (Should Hit Cache)"
  echo "  7: Incremental Build Simulation"
  echo "  8: Lambda Package Validation"
  echo "  9: Lambda Function Validation"
  echo "  10: Task Summary"
}

# Test functions
test_1() {
  echo "[TEST 1] Cold Build (No Cache)"
  echo "================================"
  clean_cache
  time_command "Cold build" pnpm turbo run build
}

test_2() {
  echo ""
  echo "[TEST 2] Warm Build (Full Cache Hit)"
  echo "====================================="
  echo -e "$(prefix_info) Removing dist folders but keeping cache..."
  rm -rf packages/*/dist
  echo ""
  time_command "Warm build" pnpm turbo run build
}

test_3() {
  echo ""
  echo "[TEST 3] Lambda Simulation (Cache-Only Clean)"
  echo "=============================================="
  clean_cache_only
  echo -e "$(prefix_info) Testing Lambda-like scenario: dist/ folders remain, cache cleared..."
  time_command "Lambda-style rebuild" pnpm turbo run build
}

test_4() {
  echo ""
  echo "[TEST 4] Documentation Change (Should Hit Cache)"
  echo "================================================="
  echo -e "$(prefix_info) Updating README.md (excluded from cache key)..."
  echo "# Cache Test $(date)" >> packages/core/README.md
  echo ""
  time_command "Build after doc change" pnpm turbo run build
}

test_5() {
  echo ""
  echo "[TEST 5] Source Code Change (Should Miss Cache)"
  echo "================================================"
  echo -e "$(prefix_info) Making minor source change to trigger cache miss..."
  echo "// Cache test comment $(date +%s)" >> packages/core/src/index.ts
  time_command "Build after source change" pnpm turbo run build
  git checkout -- packages/core/src/index.ts packages/core/README.md 2>/dev/null || true
}

test_6() {
  echo ""
  echo "[TEST 6] Lint and Typecheck (Should Hit Cache)"
  echo "==============================================="
  time_command "Lint" pnpm turbo run lint
  time_command "Typecheck" pnpm turbo run typecheck
}

test_7() {
  echo ""
  echo "[TEST 7] Incremental Build Simulation"
  echo "======================================"
  echo -e "$(prefix_info) Simulating incremental development workflow..."
  echo "// Incremental test $(date +%s)" >> packages/web/src/App.tsx
  time_command "Incremental build (only web should rebuild)" pnpm turbo run build
  git checkout -- packages/web/src/App.tsx 2>/dev/null || true
}

test_8() {
  echo ""
  echo "[TEST 8] Lambda Package Validation"
  echo "==================================="
  echo -e "$(prefix_info) Verifying dist/ folders exist for Lambda deployment..."

  packages=("core" "functions" "web")
  for pkg in "${packages[@]}"; do
    if [ -d "packages/$pkg/dist" ]; then
      file_count=$(find "packages/$pkg/dist" -type f | wc -l)
      echo -e "${GREEN}[OK]${NC} packages/$pkg/dist exists with $file_count files"

      if [ "$pkg" = "functions" ]; then
        js_count=$(find "packages/$pkg/dist" -name "*.js" | wc -l)
        if [ "$js_count" -gt 0 ]; then
          echo -e "${GREEN}[OK]${NC} Functions package has $js_count .js files (Lambda ready)"
        else
          echo -e "${RED}[FAIL]${NC} Functions package missing .js files"
        fi
      fi
    else
      echo -e "${RED}[FAIL]${NC} packages/$pkg/dist missing"
    fi
  done
  echo ""
}

test_9() {
  echo ""
  echo "[TEST 9] Lambda Function Validation"
  echo "===================================="
  echo -e "$(prefix_info) Testing specific Lambda function outputs..."

  if [ -d "packages/functions/dist" ]; then
    echo -e "${GREEN}[OK]${NC} Functions dist directory exists"

    handler_files=("auth/health.js")
    for handler in "${handler_files[@]}"; do
      if [ -f "packages/functions/dist/$handler" ]; then
        echo -e "${GREEN}[OK]${NC} Handler packages/functions/dist/$handler exists"

        size=$(wc -c < "packages/functions/dist/$handler" | tr -d ' ')
        echo -e "${BLUE}[INFO]${NC} Size: ${size} bytes"

        if grep -q "handler" "packages/functions/dist/$handler"; then
          echo -e "${GREEN}[OK]${NC} Contains handler export"
        else
          echo -e "${RED}[FAIL]${NC} No handler export found"
        fi
      else
        echo -e "${RED}[FAIL]${NC} Handler packages/functions/dist/$handler missing"
      fi
    done

    if [ -f "packages/core/dist/index.js" ]; then
      echo -e "${GREEN}[OK]${NC} Core package compiled to packages/core/dist/index.js"
    else
      echo -e "${YELLOW}[WARNING]${NC} Core package index.js not found - may affect Lambda imports"
    fi
  else
    echo -e "${RED}[FAIL]${NC} Functions dist directory missing"
  fi
  echo ""
}

test_10() {
  echo ""
  echo "[TEST 10] Task Summary"
  echo "======================"
  echo -e "$(prefix_info) Showing task summary..."
  pnpm turbo run build --summarize
  echo ""
  echo -e "$(prefix_success) All tests completed!"
}

# Parse arguments and run tests
case "${1:-all}" in
  "1") test_1 ;;
  "2") test_2 ;;
  "3") test_3 ;;
  "4") test_4 ;;
  "5") test_5 ;;
  "6") test_6 ;;
  "7") test_7 ;;
  "8") test_8 ;;
  "9") test_9 ;;
  "10") test_10 ;;
  "cache")
    echo "Running Cache Tests (1-7)"
    echo "========================="
    test_1; test_2; test_3; test_4; test_5; test_6; test_7
    ;;
  "lambda")
    echo "Running Lambda Tests (8-9)"
    echo "=========================="
    test_8; test_9
    ;;
  "help"|"-h"|"--help")
    show_usage
    ;;
  "all"|"")
    echo "FFP-22: Turborepo Caching & Lambda Simulation"
    echo "=============================================="
    echo "Tests cache behaviour, measures performance improvements, and validates Lambda readiness."
    echo ""
    echo "Lambda considerations:"
    echo "• Functions run compiled JS from dist/ folders, not TypeScript source"
    echo "• Testing both cache efficiency AND deployment readiness"
    echo "• dist/ folders should persist between cache clears to simulate Lambda layers"
    echo ""
    test_1; test_2; test_3; test_4; test_5; test_6; test_7; test_8; test_9; test_10
    ;;
  *)
    echo -e "${RED}[ERROR]${NC} Invalid argument: $1"
    echo ""
    show_usage
    exit 1
    ;;
esac