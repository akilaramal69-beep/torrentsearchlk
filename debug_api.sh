#!/bin/bash
# Script to debug GraphQL API

echo "Testing Bitmagnet API..."

# Note: Using localhost:3333 directly since we are on the server (hopefully)
# If this is run on the host machine, it should reach the docker mapped port
curl -v -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query Search($query: String!) { torrentContent { search(input: { queryString: $query }) { items { infoHash title } } } }","variables":{"query":"test"}}'

echo -e "\n\nDone."
