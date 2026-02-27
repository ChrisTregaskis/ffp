#!/bin/bash

# FFP-289: CloudFront Signing Key Setup Script
# Generates an RSA 2048 key pair and stores both keys as SST secrets.
# This is a one-time setup per environment (dev/staging/production).
#
# Usage:
#   bash scripts/setup-cloudfront-signing-key.sh <stage>
#
# Examples:
#   bash scripts/setup-cloudfront-signing-key.sh dev
#   bash scripts/setup-cloudfront-signing-key.sh staging
#   bash scripts/setup-cloudfront-signing-key.sh production
#
# Prerequisites:
#   - OpenSSL installed (standard on macOS/Linux)
#   - SST Ion CLI installed (https://sst.dev/docs/reference/cli) — NOT SST v2
#   - AWS credentials configured for the target account
#
# What this script does:
#   1. Generates an RSA 2048 private key
#   2. Extracts the corresponding public key
#   3. Validates the key pair before uploading
#   4. Stores the private key as an SST secret (CloudFrontSigningKey)
#   5. Stores the public key as an SST secret (CloudFrontSigningPublicKey)
#   6. Outputs a summary of stored secrets
#
# Both keys are stored as SST secrets (per-stage). The public key is used
# by the CloudFront Public Key resource in sst.config.ts at deploy time.
# Do NOT commit either key file to version control.

set -e

# Colours for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Colour

# ---------------------------------------------------------------------------
# Validate arguments
# ---------------------------------------------------------------------------

STAGE="${1}"

if [ -z "${STAGE}" ]; then
  echo -e "${RED}[ERROR]${NC} Missing required argument: stage"
  echo ""
  echo "Usage: bash scripts/setup-cloudfront-signing-key.sh <stage>"
  echo ""
  echo "  stage   The SST stage name (e.g. dev, staging, production)"
  echo ""
  echo "Examples:"
  echo "  bash scripts/setup-cloudfront-signing-key.sh dev"
  echo "  bash scripts/setup-cloudfront-signing-key.sh staging"
  exit 1
fi

# Warn on non-standard stages (typo protection) but allow personal stages
STANDARD_STAGES=("dev" "staging" "production")
IS_STANDARD=false
for standard in "${STANDARD_STAGES[@]}"; do
  if [ "${STAGE}" = "${standard}" ]; then
    IS_STANDARD=true
    break
  fi
done

if [ "${IS_STANDARD}" = false ]; then
  echo -e "${YELLOW}[WARN]${NC} '${STAGE}' is not a standard stage (dev, staging, production)"
  echo -e "${BLUE}[INFO]${NC} If this is your personal SST stage, that's fine — press Enter to continue or Ctrl+C to abort"
  read -r
fi

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------

echo -e "${BLUE}[INFO]${NC} Checking prerequisites..."

if ! command -v openssl &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} OpenSSL is not installed. Please install it first."
  exit 1
fi

if ! command -v sst &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} SST Ion CLI is not installed. Install with: curl -fsSL https://sst.dev/install | bash"
  exit 1
fi

echo -e "${GREEN}[SUCCESS]${NC} Prerequisites satisfied"
echo ""

# ---------------------------------------------------------------------------
# Set up temporary working directory
# ---------------------------------------------------------------------------

WORK_DIR=$(mktemp -d)
PRIVATE_KEY_PATH="${WORK_DIR}/cloudfront-signing-key.pem"
PUBLIC_KEY_PATH="${WORK_DIR}/cloudfront-signing-key-public.pem"

# Clean up both key files on exit (both are stored as SST secrets)
cleanup() {
  local cleaned=false
  if [ -f "${PRIVATE_KEY_PATH}" ]; then
    if rm -f "${PRIVATE_KEY_PATH}"; then
      cleaned=true
    else
      echo -e "${RED}[ERROR]${NC} Failed to remove private key at ${PRIVATE_KEY_PATH} — remove manually"
    fi
  fi
  if [ -f "${PUBLIC_KEY_PATH}" ]; then
    if rm -f "${PUBLIC_KEY_PATH}"; then
      cleaned=true
    else
      echo -e "${RED}[ERROR]${NC} Failed to remove public key at ${PUBLIC_KEY_PATH} — remove manually"
    fi
  fi
  if [ "${cleaned}" = true ]; then
    echo -e "${BLUE}[INFO]${NC} Key files removed from disk"
  fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Generate RSA 2048 key pair
# ---------------------------------------------------------------------------

echo -e "${BLUE}[INFO]${NC} Generating RSA 2048 key pair..."

openssl genrsa -out "${PRIVATE_KEY_PATH}" 2048
chmod 600 "${PRIVATE_KEY_PATH}"

openssl rsa -in "${PRIVATE_KEY_PATH}" -pubout -out "${PUBLIC_KEY_PATH}"

# Validate the generated key pair before uploading
if ! openssl rsa -in "${PRIVATE_KEY_PATH}" -check -noout 2>/dev/null; then
  echo -e "${RED}[ERROR]${NC} Generated private key failed validation — aborting"
  exit 1
fi

echo -e "${GREEN}[SUCCESS]${NC} Key pair generated and validated"
echo ""

# ---------------------------------------------------------------------------
# Store private key as SST secret
# ---------------------------------------------------------------------------

echo -e "${BLUE}[INFO]${NC} Storing private key as SST secret (stage: ${STAGE})..."

sst secret set CloudFrontSigningKey --stage "${STAGE}" < "${PRIVATE_KEY_PATH}"

echo -e "${GREEN}[SUCCESS]${NC} Private key stored as SST secret 'CloudFrontSigningKey' for stage '${STAGE}'"
echo ""

# ---------------------------------------------------------------------------
# Store public key as SST secret
# ---------------------------------------------------------------------------

echo -e "${BLUE}[INFO]${NC} Storing public key as SST secret (stage: ${STAGE})..."

sst secret set CloudFrontSigningPublicKey --stage "${STAGE}" < "${PUBLIC_KEY_PATH}"

echo -e "${GREEN}[SUCCESS]${NC} Public key stored as SST secret 'CloudFrontSigningPublicKey' for stage '${STAGE}'"
echo ""

# ---------------------------------------------------------------------------
# Output summary
# ---------------------------------------------------------------------------

echo -e "${GREEN}[SUCCESS]${NC} CloudFront signing key setup complete for stage '${STAGE}'"
echo ""
echo -e "${BLUE}[INFO]${NC} SST secrets stored:"
echo -e "  - CloudFrontSigningKey        (private key — used by Lambda to sign URLs)"
echo -e "  - CloudFrontSigningPublicKey   (public key — used by CloudFront to verify signed URLs)"
echo ""
echo -e "${BLUE}[INFO]${NC} Verify with: sst secret list --stage ${STAGE}"
echo ""
echo -e "${YELLOW}[WARN]${NC} Next steps:"
echo -e "  1. Run 'sst deploy --stage ${STAGE}' to deploy the CloudFront infrastructure"
echo -e "  2. Do NOT commit either key file to version control"
