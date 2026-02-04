#!/bin/bash
# Script to discover contentType filter options in search input

echo "Checking TorrentContentSearchQueryInput fields..."
echo ""

curl -s -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"TorrentContentSearchQueryInput\") { inputFields { name type { name kind ofType { name } } } } }"}' | python3 -m json.tool

echo -e "\n\nDone."
