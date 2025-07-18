#!/bin/bash
# smart-commit.sh - Intelligent Git Commits with Protocol Integration

# Get current feature status
echo "🔍 Analyzing changes..."

# Count changes
MODIFIED=$(git status --porcelain | grep "^ M" | wc -l)
ADDED=$(git status --porcelain | grep "^??" | wc -l)
TOTAL=$((MODIFIED + ADDED))

# Detect affected features
FEATURES=""
if git diff --name-only | grep -q "note"; then
  FEATURES="$FEATURES quick_notes"
fi
if git diff --name-only | grep -q "feature-tracker"; then
  FEATURES="$FEATURES feature_tracking"
fi
if git diff --name-only | grep -q "protocol"; then
  FEATURES="$FEATURES protocol_system"
fi

# Generate commit message
if [ "$TOTAL" -gt 10 ]; then
  TYPE="[MEGA UPDATE]"
elif [ "$TOTAL" -gt 5 ]; then
  TYPE="[UPDATE]"
else
  TYPE="[FIX]"
fi

echo "📊 Summary:"
echo "- Modified: $MODIFIED files"
echo "- Added: $ADDED files"
echo "- Features: $FEATURES"
echo ""
echo "📝 Suggested commit message:"
echo "$TYPE Protocol System Implementation + Feature Tracking + Fixes"
echo ""
echo "This update implements the new development philosophy:"
echo '"Keine Lügen, keine Mocks, keine halben Sachen" - Arash'
