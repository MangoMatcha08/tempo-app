
#!/bin/bash
set -e

echo "Starting build verification..."

# Check for consistent timezone formatting
find src -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "formatWithTimezone" && {
    echo "ERROR: Inconsistent timezone formatting found (should be formatWithTimeZone)"
    exit 1
}

# Verify all imports are correct
npm run typecheck
npm run build

echo "Build verification completed successfully!"
