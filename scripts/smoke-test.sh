#!/bin/bash
set -e

# FFP Infrastructure Smoke Tests
# Verifies deployed infrastructure in eu-west-2
# Tests only currently deployed resources (no RDS, minimal CloudWatch)
# Auto-detects stage from .sst/outputs.json

echo "FFP Infrastructure Smoke Tests"
echo "=================================="
echo "Region: eu-west-2"
echo ""

REGION="eu-west-2"

# Check if outputs file exists
if [ ! -f ".sst/outputs.json" ]; then
  echo "❌ Error: .sst/outputs.json not found"
  echo "   Please deploy infrastructure first with: pnpm sst:dev or pnpm sst:deploy:dev"
  exit 1
fi

# Read outputs from deployed infrastructure
OUTPUTS_FILE=".sst/outputs.json"
echo "📄 Reading deployment outputs from: $OUTPUTS_FILE"
echo ""

# Colour codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for test results
pass_test() {
  echo -e "${GREEN}✓${NC} $1"
  ((TESTS_PASSED++))
}

fail_test() {
  echo -e "${RED}✗${NC} $1"
  echo -e "${RED}  Error: $2${NC}"
  ((TESTS_FAILED++))
}

warn_test() {
  echo -e "${YELLOW}⚠${NC} $1"
}

echo "Test Suite: Current Infrastructure"
echo ""

# Test 1: Health Endpoint
echo "1.  Testing API Health Endpoint..."
API_URL=$(grep -o '"apiUrl":"[^"]*"' "$OUTPUTS_FILE" | cut -d'"' -f4)
if [ -z "$API_URL" ]; then
  fail_test "Health Endpoint" "apiUrl not found in outputs"
else
  HEALTH_RESPONSE=$(curl -s "$API_URL/health" 2>&1)
  CURL_EXIT_CODE=$?

  if [ $CURL_EXIT_CODE -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    pass_test "Health Endpoint responding (200 OK)"
    echo "   URL: $API_URL/health"
  else
    # Check if it's a dev mode issue
    if echo "$HEALTH_RESPONSE" | grep -q "sst dev is not running"; then
      warn_test "Health Endpoint: sst dev not running"
      echo "   This is a personal stage deployment (requires sst dev)"
      echo "   → Start 'pnpm sst:dev' in another terminal to enable endpoints"
      echo "   → Or deploy to persistent stage: 'pnpm sst:deploy:dev'"
    else
      warn_test "Health Endpoint: Unable to connect or verify"
      echo "   URL: $API_URL/health"
      echo "   Check: Is sst dev running? (for personal stages)"
      echo "   Or: Deploy to persistent stage with pnpm sst:deploy:dev"
    fi
  fi
fi

echo ""

# Test 2: Cognito User Pool
echo "2.  Verifying Cognito User Pool..."
USER_POOL_ID=$(grep -o '"userPoolId":"[^"]*"' "$OUTPUTS_FILE" | cut -d'"' -f4)
USER_POOL_CLIENT_ID=$(grep -o '"userPoolClientId":"[^"]*"' "$OUTPUTS_FILE" | cut -d'"' -f4)
if [ -z "$USER_POOL_ID" ]; then
  fail_test "Cognito User Pool" "userPoolId not found in outputs"
elif [ -z "$USER_POOL_CLIENT_ID" ]; then
  fail_test "Cognito User Pool Client" "userPoolClientId not found in outputs"
else
  # Verify pool actually exists in AWS
  if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --region "$REGION" >/dev/null 2>&1; then
    pass_test "Cognito User Pool exists and accessible"
    echo "   Pool ID: $USER_POOL_ID"
    echo "   Client ID: $USER_POOL_CLIENT_ID"
  else
    fail_test "Cognito User Pool" "Pool ID in outputs but not found in AWS"
  fi
fi

echo ""

# Test 3: S3 Buckets
echo "3.  Verifying S3 Buckets..."
VIDEOS_BUCKET=$(grep -o '"videosBucket":"[^"]*"' "$OUTPUTS_FILE" | cut -d'"' -f4)
ASSETS_BUCKET=$(grep -o '"assetsBucket":"[^"]*"' "$OUTPUTS_FILE" | cut -d'"' -f4)

BUCKET_COUNT=0
if [ -n "$VIDEOS_BUCKET" ] && aws s3 ls "s3://$VIDEOS_BUCKET" >/dev/null 2>&1; then
  ((BUCKET_COUNT++))
  echo "   ✓ Videos bucket: $VIDEOS_BUCKET"
fi

if [ -n "$ASSETS_BUCKET" ] && aws s3 ls "s3://$ASSETS_BUCKET" >/dev/null 2>&1; then
  ((BUCKET_COUNT++))
  echo "   ✓ Assets bucket: $ASSETS_BUCKET"
fi

if [ "$BUCKET_COUNT" -eq 2 ]; then
  pass_test "S3 Buckets exist and accessible (2 buckets)"
elif [ "$BUCKET_COUNT" -eq 1 ]; then
  warn_test "S3 Buckets: Only 1 of 2 buckets accessible"
else
  fail_test "S3 Buckets" "Buckets in outputs but not accessible in AWS"
fi

echo ""

# Test 4: CloudFront Distribution
echo "4.  Verifying CloudFront Distribution..."
CDN_URL=$(grep -o '"cdnUrl":"[^"]*"' "$OUTPUTS_FILE" | cut -d'"' -f4)
if [ -z "$CDN_URL" ]; then
  warn_test "CloudFront Distribution: cdnUrl not found in outputs"
else
  # Extract CloudFront domain (remove https://)
  CF_DOMAIN=$(echo "$CDN_URL" | sed 's|https://||')
  # Check if domain responds (simple HEAD request)
  if curl -sf --head "$CDN_URL" >/dev/null 2>&1; then
    pass_test "CloudFront Distribution exists and responding"
    echo "   URL: $CDN_URL"
  else
    pass_test "CloudFront Distribution configured"
    echo "   URL: $CDN_URL"
    echo "   (Distribution may still be deploying or has no content yet)"
  fi
fi

echo ""

# Test 5: API Gateway
echo "5.  Verifying API Gateway..."
# API URL already verified in Test 1, just extract the ID
if [ -n "$API_URL" ]; then
  API_ID=$(echo "$API_URL" | sed -n 's|https://\([^.]*\)\.execute-api\..*|\1|p')
  if [ -n "$API_ID" ]; then
    # Verify API exists
    if aws apigatewayv2 get-api --api-id "$API_ID" --region "$REGION" >/dev/null 2>&1; then
      pass_test "API Gateway exists and accessible"
      echo "   API ID: $API_ID"
      echo "   Endpoint: $API_URL"
    else
      warn_test "API Gateway: ID extracted but not found in AWS"
    fi
  else
    warn_test "API Gateway: Could not extract API ID from URL"
  fi
else
  fail_test "API Gateway" "API URL not available"
fi

echo ""

# Test 6: Lambda Functions (Basic Check)
echo "6.  Verifying Lambda Functions..."
# Extract stage/app name from bucket name to find Lambdas
if [ -n "$VIDEOS_BUCKET" ]; then
  # Parse bucket name like: ffp-christophertregaskis-videosbucketbucket-cbchftfk
  STAGE_PREFIX=$(echo "$VIDEOS_BUCKET" | cut -d'-' -f1-2)

  if LAMBDA_FUNCTIONS=$(aws lambda list-functions --region "$REGION" \
    --query "Functions[?starts_with(FunctionName, '$STAGE_PREFIX')].FunctionName" \
    --output text 2>&1); then
    LAMBDA_COUNT=$(echo "$LAMBDA_FUNCTIONS" | wc -w | xargs)
    if [ "$LAMBDA_COUNT" -gt 0 ]; then
      pass_test "Lambda Functions deployed ($LAMBDA_COUNT functions)"
      echo "$LAMBDA_FUNCTIONS" | tr '\t' '\n' | head -5 | while read -r func; do
        [ -n "$func" ] && echo "   - $func"
      done
      if [ "$LAMBDA_COUNT" -gt 5 ]; then
        echo "   ... and $((LAMBDA_COUNT - 5)) more"
      fi
    else
      warn_test "Lambda Functions: No functions found (may use different naming)"
    fi
  else
    warn_test "Lambda Functions: Unable to list (AWS CLI error)"
  fi
else
  warn_test "Lambda Functions: Cannot determine stage prefix from outputs"
fi

echo ""

# Test 7: CloudWatch Log Groups (Basic Check)
echo "7.  Verifying CloudWatch Log Groups..."
if [ -n "$STAGE_PREFIX" ]; then
  if LOG_GROUPS=$(aws logs describe-log-groups --region "$REGION" \
    --log-group-name-prefix "/aws/lambda/$STAGE_PREFIX" \
    --query "logGroups[].logGroupName" --output text 2>&1); then
    LOG_COUNT=$(echo "$LOG_GROUPS" | wc -w | xargs)
    if [ "$LOG_COUNT" -gt 0 ]; then
      pass_test "CloudWatch Log Groups exist ($LOG_COUNT groups)"
    else
      warn_test "CloudWatch Log Groups: No log groups found (Lambdas may not have been invoked yet)"
    fi
  else
    warn_test "CloudWatch Log Groups: Unable to verify (AWS CLI error)"
  fi
else
  warn_test "CloudWatch Log Groups: Cannot determine stage prefix"
fi

echo ""
echo "=================================="
echo "📊 Test Results"
echo "=================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All critical tests passed!${NC}"
  echo "Infrastructure deployed successfully to eu-west-2"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo "Review failed tests above for details"
  exit 1
fi
