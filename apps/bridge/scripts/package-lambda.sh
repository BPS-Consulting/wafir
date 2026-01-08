#!/bin/bash
set -e

echo "Packaging Lambda..."

# cleanup
rm -rf lambda-dist lambda.zip

# Deploy capabilities to get clean node_modules
# We use --filter=. to target current package if running from bridge dir
echo "Deploying production dependencies..."
pnpm deploy --prod --filter=. lambda-dist

# Compile TS
echo "Building TypeScript..."
pnpm run build:ts

# Copy built assets
echo "Copying compiled artifacts..."
cp -r dist lambda-dist/

# Cleanup source files from lambda-dist
echo "Cleaning up source files..."
rm -rf lambda-dist/src lambda-dist/test lambda-dist/scripts lambda-dist/tsconfig.json lambda-dist/.turbo lambda-dist/.gitignore lambda-dist/README.md lambda-dist/.env

# Zip it up
echo "Zipping..."
cd lambda-dist
# Zip recursively, quietly, preserving symlinks
zip -rqy ../lambda.zip .

echo "Done: lambda.zip"
