#!/bin/bash
# Script to discover available fields in Bitmagnet GraphQL schema

echo "Testing available fields..."
echo ""

# Test with introspection query to get the schema
curl -s -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __type(name: \"TorrentContentSearchResultItem\") { fields { name type { name kind ofType { name } } } } }"}' | python3 -m json.tool

echo -e "\n\nDone."
