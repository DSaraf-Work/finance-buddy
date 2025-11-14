#!/bin/bash

# Test script for Gmail Pub/Sub webhook endpoint
# This script tests the /api/webhooks/gmail-pubsub endpoint with various scenarios

WEBHOOK_URL="https://finance-buddy-sand.vercel.app/api/webhooks/gmail-pubsub"

echo "🧪 Testing Gmail Pub/Sub Webhook Endpoint"
echo "=========================================="
echo ""

# Test 1: Valid Pub/Sub message with existing Gmail connection
echo "📨 Test 1: Valid Pub/Sub message (dheerajsaraf1996@gmail.com)"
echo "--------------------------------------------------------------"

# Create the payload (emailAddress + historyId)
PAYLOAD='{"emailAddress":"dheerajsaraf1996@gmail.com","historyId":"123456789"}'

# Base64 encode the payload
ENCODED_PAYLOAD=$(echo -n "$PAYLOAD" | base64)

# Create the Pub/Sub message
PUBSUB_MESSAGE=$(cat <<EOF
{
  "message": {
    "data": "$ENCODED_PAYLOAD",
    "messageId": "test-msg-001",
    "publishTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "subscription": "projects/test-project/subscriptions/gmail-notifications"
}
EOF
)

echo "Request:"
echo "$PUBSUB_MESSAGE" | jq '.'
echo ""

echo "Response:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PUBSUB_MESSAGE" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null | jq '.'

echo ""
echo ""

# Test 2: Valid Pub/Sub message with another existing Gmail connection
echo "📨 Test 2: Valid Pub/Sub message (ashoksaraf1965@gmail.com)"
echo "--------------------------------------------------------------"

PAYLOAD2='{"emailAddress":"ashoksaraf1965@gmail.com","historyId":"987654321"}'
ENCODED_PAYLOAD2=$(echo -n "$PAYLOAD2" | base64)

PUBSUB_MESSAGE2=$(cat <<EOF
{
  "message": {
    "data": "$ENCODED_PAYLOAD2",
    "messageId": "test-msg-002",
    "publishTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "subscription": "projects/test-project/subscriptions/gmail-notifications"
}
EOF
)

echo "Request:"
echo "$PUBSUB_MESSAGE2" | jq '.'
echo ""

echo "Response:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PUBSUB_MESSAGE2" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null | jq '.'

echo ""
echo ""

# Test 3: Non-existent email address
echo "📨 Test 3: Non-existent email address"
echo "--------------------------------------------------------------"

PAYLOAD3='{"emailAddress":"nonexistent@example.com","historyId":"111111111"}'
ENCODED_PAYLOAD3=$(echo -n "$PAYLOAD3" | base64)

PUBSUB_MESSAGE3=$(cat <<EOF
{
  "message": {
    "data": "$ENCODED_PAYLOAD3",
    "messageId": "test-msg-003",
    "publishTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "subscription": "projects/test-project/subscriptions/gmail-notifications"
}
EOF
)

echo "Request:"
echo "$PUBSUB_MESSAGE3" | jq '.'
echo ""

echo "Response:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PUBSUB_MESSAGE3" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null | jq '.'

echo ""
echo ""

# Test 4: Invalid Pub/Sub message (missing data)
echo "📨 Test 4: Invalid Pub/Sub message (missing data)"
echo "--------------------------------------------------------------"

PUBSUB_MESSAGE4=$(cat <<EOF
{
  "message": {
    "messageId": "test-msg-004",
    "publishTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  },
  "subscription": "projects/test-project/subscriptions/gmail-notifications"
}
EOF
)

echo "Request:"
echo "$PUBSUB_MESSAGE4" | jq '.'
echo ""

echo "Response:"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PUBSUB_MESSAGE4" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null | jq '.'

echo ""
echo ""

# Test 5: Wrong HTTP method (GET instead of POST)
echo "📨 Test 5: Wrong HTTP method (GET)"
echo "--------------------------------------------------------------"

echo "Response:"
curl -X GET "$WEBHOOK_URL" \
  -w "\nHTTP Status: %{http_code}\n" \
  2>/dev/null | jq '.'

echo ""
echo ""

echo "✅ All tests completed!"
echo ""
echo "📋 Check Vercel logs for detailed logging output:"
echo "   https://vercel.com/dheerajs-projects-74ed43fb/finance-buddy"

