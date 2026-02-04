#!/bin/bash
# Script to discover available types in Bitmagnet GraphQL schema

echo "Querying schema types..."
echo ""

# Get all types in the schema
curl -s -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name kind } } }"}' | python3 -m json.tool | grep -i torrent

echo -e "\n\n--- Now trying to get fields from a search result ---"

# Try to get a real result and see what fields come back by default
curl -s -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ torrentContent { search(input: { queryString: \"test\" }) { items { __typename } } } }"}' | python3 -m json.tool

echo -e "\n\nDone."
