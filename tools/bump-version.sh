#!/bin/sh
# Stamps every module import with ?v=<n> so phones and TVs load fresh code after an update.
# Usage: sh tools/bump-version.sh 5
V=${1:?version number}
for f in js/*.js display/index.html control/index.html; do
  sed -i -E "s#(['\"](\.\.?/)(js/)?[A-Za-z0-9_-]+\.js)(\?v=[0-9]+)?(['\"])#\1?v=$V\5#g" "$f"
done
sed -i -E "s#<span class=\"small\" style=\"font-weight:400\">v[0-9]+</span>#<span class=\"small\" style=\"font-weight:400\">v$V</span>#" control/index.html
grep -ho "\.js?v=[0-9]*" js/*.js display/index.html control/index.html | sort | uniq -c
