#!/bin/bash
# Script to get fields of TorrentContent type

echo "Getting TorrentContent fields..."
echo ""

curl -s -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"TorrentContent\") { fields { name type { name kind ofType { name } } } } }"}' | python3 -m json.tool

echo -e "\n\nDone."
