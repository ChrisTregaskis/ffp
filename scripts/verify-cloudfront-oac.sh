#!/bin/bash

# FFP-292: CloudFront OAC & Signed URL Verification Script
# Verifies that:
#   1. Direct S3 access is blocked (403)
#   2. Unsigned CloudFront URL is rejected (403)
#
# Usage:
#   bash scripts/verify-cloudfront-oac.sh              # Uses 'dev' stage
#   bash scripts/verify-cloudfront-oac.sh <stage>      # Specify stage
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - SST deployed: sst deploy --stage <stage>
#   - Signing keys set: bash scripts/setup-cloudfront-signing-key.sh <stage>

set -euo pipefail

# Colours for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# Terminal prefix helpers
prefix_info() { echo -e "${BLUE}[INFO]${NC}"; }
prefix_pass() { echo -e "${GREEN}[PASS]${NC}"; }
prefix_fail() { echo -e "${RED}[FAIL]${NC}"; }
prefix_running() { echo -e "${CYAN}[RUNNING]${NC}"; }
prefix_warn() { echo -e "${YELLOW}[WARN]${NC}"; }

# Stage argument (default: dev)
STAGE="${1:-dev}"
TEST_FILE_KEY="__oac-verification-test.txt"
TEST_FILE_CONTENT="FFP OAC verification test file — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
RESULTS_PASSED=0
RESULTS_FAILED=0

echo ""
echo "=========================================="
echo " FFP-292: CloudFront OAC Verification"
echo " Stage: ${STAGE}"
echo "=========================================="
echo ""

# -------------------------------------------------------------------------
# Step 1: Retrieve SST outputs for the given stage
# -------------------------------------------------------------------------
echo -e "$(prefix_info) Retrieving SST outputs for stage '${STAGE}'..."

# Query AWS directly — SST v3 Ion bucket naming convention: ffp-<stage>-videosbucketbucket-<hash>
BUCKET_NAME=$(aws s3api list-buckets \
  --query "Buckets[?starts_with(Name, 'ffp-${STAGE}-videosbucketbucket-')].Name | [0]" \
  --output text 2>/dev/null) || true

if [ "$BUCKET_NAME" = "None" ] || [ -z "$BUCKET_NAME" ]; then
  BUCKET_NAME=""
fi

# Find the CloudFront distribution whose origin points to the videos bucket
if [ -n "$BUCKET_NAME" ]; then
  CDN_DOMAIN=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '${BUCKET_NAME}')].DomainName | [0]" \
    --output text 2>/dev/null) || true

  if [ -n "$CDN_DOMAIN" ] && [ "$CDN_DOMAIN" != "None" ]; then
    CDN_URL="https://${CDN_DOMAIN}"
  fi
fi

# Allow environment variable overrides
BUCKET_NAME="${BUCKET_NAME:-${FFP_VIDEOS_BUCKET:-}}"
CDN_URL="${CDN_URL:-${FFP_CDN_URL:-}}"

if [ -z "$BUCKET_NAME" ]; then
  echo -e "$(prefix_fail) Could not determine S3 bucket name for stage '${STAGE}'"
  echo -e "  Ensure SST is deployed: sst deploy --stage ${STAGE}"
  echo -e "  Or set FFP_VIDEOS_BUCKET environment variable"
  exit 1
fi

if [ -z "$CDN_URL" ]; then
  echo -e "$(prefix_fail) Could not determine CloudFront URL for stage '${STAGE}'"
  echo -e "  Ensure SST is deployed: sst deploy --stage ${STAGE}"
  echo -e "  Or set FFP_CDN_URL environment variable"
  exit 1
fi

# Strip trailing slash from CDN URL if present
CDN_URL="${CDN_URL%/}"

echo -e "$(prefix_info) S3 Bucket:     ${BUCKET_NAME}"
echo -e "$(prefix_info) CloudFront URL: ${CDN_URL}"
echo ""

# -------------------------------------------------------------------------
# Step 2: Upload a test file to S3
# -------------------------------------------------------------------------
echo -e "$(prefix_running) Uploading test file to S3: s3://${BUCKET_NAME}/${TEST_FILE_KEY}"

if ! echo "$TEST_FILE_CONTENT" | aws s3 cp - "s3://${BUCKET_NAME}/${TEST_FILE_KEY}" --content-type "text/plain" 2>&1; then
  echo -e "$(prefix_fail) Failed to upload test file to S3"
  echo -e "  Check your AWS credentials have s3:PutObject permission"
  exit 1
fi

echo -e "$(prefix_info) Test file uploaded successfully"
echo ""

# -------------------------------------------------------------------------
# Step 3: Determine S3 direct URL
# -------------------------------------------------------------------------
S3_REGION="eu-west-2"
S3_DIRECT_URL="https://${BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${TEST_FILE_KEY}"

# -------------------------------------------------------------------------
# Test 1: Direct S3 URL should return 403
# -------------------------------------------------------------------------
echo "-------------------------------------------"
echo " Test 1: Direct S3 URL → Expected 403"
echo "-------------------------------------------"
echo ""
echo -e "$(prefix_running) curl -s -o /dev/null -w '%{http_code}' '${S3_DIRECT_URL}'"
echo ""

S3_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$S3_DIRECT_URL")
S3_BODY=$(curl -s "$S3_DIRECT_URL" 2>/dev/null | head -20)

if [ "$S3_STATUS" = "403" ]; then
  echo -e "$(prefix_pass) Direct S3 access returned HTTP ${S3_STATUS} (Forbidden) ✓"
  RESULTS_PASSED=$((RESULTS_PASSED + 1))
else
  echo -e "$(prefix_fail) Direct S3 access returned HTTP ${S3_STATUS} (expected 403)"
  RESULTS_FAILED=$((RESULTS_FAILED + 1))
fi

echo ""
echo "  Response body (first 20 lines):"
echo "$S3_BODY" | sed 's/^/    /'
echo ""

# -------------------------------------------------------------------------
# Test 2: Unsigned CloudFront URL should return 403
# -------------------------------------------------------------------------
echo "-------------------------------------------"
echo " Test 2: Unsigned CloudFront URL → Expected 403"
echo "-------------------------------------------"
echo ""

CF_URL="${CDN_URL}/${TEST_FILE_KEY}"

echo -e "$(prefix_running) curl -s -o /dev/null -w '%{http_code}' '${CF_URL}'"
echo ""

CF_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$CF_URL")
CF_BODY=$(curl -s "$CF_URL" 2>/dev/null | head -20)

if [ "$CF_STATUS" = "403" ]; then
  echo -e "$(prefix_pass) Unsigned CloudFront access returned HTTP ${CF_STATUS} (Forbidden) ✓"
  RESULTS_PASSED=$((RESULTS_PASSED + 1))
else
  echo -e "$(prefix_fail) Unsigned CloudFront access returned HTTP ${CF_STATUS} (expected 403)"
  RESULTS_FAILED=$((RESULTS_FAILED + 1))
fi

echo ""
echo "  Response body (first 20 lines):"
echo "$CF_BODY" | sed 's/^/    /'
echo ""

# -------------------------------------------------------------------------
# Cleanup: Remove test file from S3
# -------------------------------------------------------------------------
echo "-------------------------------------------"
echo " Cleanup"
echo "-------------------------------------------"
echo ""
echo -e "$(prefix_running) Removing test file from S3..."

if aws s3 rm "s3://${BUCKET_NAME}/${TEST_FILE_KEY}" 2>/dev/null; then
  echo -e "$(prefix_info) Test file removed from S3"
else
  echo -e "$(prefix_warn) Could not remove test file — delete manually:"
  echo "  aws s3 rm s3://${BUCKET_NAME}/${TEST_FILE_KEY}"
fi

echo ""

# -------------------------------------------------------------------------
# Summary
# -------------------------------------------------------------------------
echo "=========================================="
echo " Results"
echo "=========================================="
echo ""
echo -e "  Passed: ${GREEN}${RESULTS_PASSED}${NC}"
echo -e "  Failed: ${RED}${RESULTS_FAILED}${NC}"
echo ""

if [ "$RESULTS_FAILED" -eq 0 ]; then
  echo -e "$(prefix_pass) All verification checks passed!"
  echo ""
  echo "  OAC is correctly configured:"
  echo "    - S3 direct access is blocked (403)"
  echo "    - Unsigned CloudFront access is rejected (403)"
  echo "    - Videos are only accessible via signed CloudFront URLs"
  echo ""
  exit 0
else
  echo -e "$(prefix_fail) ${RESULTS_FAILED} check(s) failed — review output above"
  echo ""
  echo "  Common issues:"
  echo "    - S3 bucket policy not applied → check VideosBucketPolicy in sst.config.ts"
  echo "    - CloudFront trustedKeyGroups not set → check transform.distribution in sst.config.ts"
  echo "    - OAC not linked to origin → check originAccessControlId on origin"
  echo "    - Propagation delay → CloudFront changes can take 5-15 minutes"
  echo ""
  exit 1
fi
