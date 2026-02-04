#!/bin/bash
# Test contentType filter syntax

echo "Testing search with contentType filter..."
echo ""

# Test if contentType filter works
curl -s -X POST http://localhost:3333/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ torrentContent { search(input: { queryString: \"movie\", limit: 5 }) { items { title contentType } } } }"}' | python3 -m json.tool

echo -e "\n\nDone."
