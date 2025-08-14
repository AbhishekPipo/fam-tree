#!/bin/bash

echo "🔐 Testing Login..."

# 1. Login to get JWT token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prashanth@family.com","password":"prashanth123"}')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token (basic extraction - in real script you'd use jq)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "🌳 Testing Family Tree API (NEW - without userId in URL)..."

# 2. Get family tree using JWT token (no userId in URL)
FAMILY_RESPONSE=$(curl -s -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer $TOKEN")

echo "Family Tree Response: $FAMILY_RESPONSE"

echo ""
echo "✅ API Test completed!"
echo ""
echo "🎉 NEW API BENEFITS:"
echo "   ✅ No userId in URL - more secure"
echo "   ✅ Uses JWT token for user identification"
echo "   ✅ Prevents unauthorized access to other users' data"
echo "   ✅ Cleaner API design"