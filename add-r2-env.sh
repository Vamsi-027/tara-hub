#!/bin/bash

echo "Adding R2 environment variables to Vercel..."
echo "Please make sure you have your R2 credentials ready."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found!"
    echo "Please create it with your R2 credentials first."
    exit 1
fi

# Source the .env.local file
export $(cat .env.local | grep -v '^#' | xargs)

# Check if R2 variables are set
if [ -z "$R2_BUCKET" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_ACCOUNT_ID" ]; then
    echo "Error: R2 environment variables not found in .env.local"
    echo "Please add these variables to .env.local:"
    echo "  - R2_BUCKET"
    echo "  - R2_ACCESS_KEY_ID"
    echo "  - R2_SECRET_ACCESS_KEY"
    echo "  - R2_ACCOUNT_ID"
    echo "  - S3_URL (optional)"
    exit 1
fi

# Add to Vercel
echo "Adding R2_BUCKET..."
npx vercel env add R2_BUCKET production < <(echo "$R2_BUCKET")

echo "Adding R2_ACCESS_KEY_ID..."
npx vercel env add R2_ACCESS_KEY_ID production < <(echo "$R2_ACCESS_KEY_ID")

echo "Adding R2_SECRET_ACCESS_KEY..."
npx vercel env add R2_SECRET_ACCESS_KEY production < <(echo "$R2_SECRET_ACCESS_KEY")

echo "Adding R2_ACCOUNT_ID..."
npx vercel env add R2_ACCOUNT_ID production < <(echo "$R2_ACCOUNT_ID")

if [ ! -z "$S3_URL" ]; then
    echo "Adding S3_URL..."
    npx vercel env add S3_URL production < <(echo "$S3_URL")
fi

echo ""
echo "✅ R2 environment variables added to Vercel!"
echo ""
echo "Now redeploy your application for the changes to take effect:"
echo "  npx vercel --prod"