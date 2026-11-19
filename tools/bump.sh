#!/bin/sh
# Bump the app version everywhere: module ?v= tags, page meta tags and version.json.
# Saved Home Screen apps and the TV reload themselves when version.json changes.
# Usage: sh tools/bump.sh
cd "$(dirname "$0")/.."
old=$(sed -n 's/.*"v": *\([0-9]*\).*/\1/p' version.json); new=$((old + 1))
grep -rl "?v=$old" --include=*.js --include=*.html . | xargs sed -i "s/?v=$old/?v=$new/g"
sed -i "s/name=\"app-version\" content=\"$old\"/name=\"app-version\" content=\"$new\"/" control/index.html display/index.html
echo "{ \"v\": $new }" > version.json
echo "v$old -> v$new"
