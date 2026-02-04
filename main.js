// Configuration - Uses relative path via Caddy proxy
const API_URL = '/graphql';

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results');
const loadingSpinner = document.getElementById('loading');
const statsDiv = document.getElementById('stats');
const resultCountSpan = document.getElementById('resultCount');
const searchTimeSpan = document.getElementById('searchTime');
const toast = document.getElementById('toast');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');

let currentFilter = 'all';
let currentSort = 'relevance';
let lastResults = [];

// Event Listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        if (searchInput.value.trim()) {
            performSearch();
        }
    });
});

sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    if (lastResults.length > 0) {
        displayResults(sortResults(lastResults));
    }
});

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading(true);
    const startTime = performance.now();

    try {
        const results = await searchTorrents(query, currentFilter);
        const endTime = performance.now();

        // Client-side filtering: by search terms, then by category
        const matchedResults = filterBySearchTerms(results, query);
        const filteredResults = filterByCategory(matchedResults, currentFilter);

        lastResults = filteredResults;
        displayResults(sortResults(filteredResults));
        updateStats(filteredResults.length, Math.round(endTime - startTime));
    } catch (error) {
        console.error('Search failed:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation" style="color: #f87171;"></i>
                <h2>Search Failed</h2>
                <p>Could not connect to Bitmagnet API. Make sure it's running at ${API_URL}</p>
                <p class="error-detail">${error.message}</p>
            </div>
        `;
        statsDiv.classList.add('hidden');
    } finally {
        showLoading(false);
    }
}

// GraphQL Query - fetch all results, filter client-side
async function searchTorrents(searchTerm, category) {
    const graphqlQuery = {
        query: `
            query Search($query: String!) {
              torrentContent {
                search(input: { queryString: $query, limit: 100 }) {
                  items {
                    infoHash
                    title
                    contentType
                    seeders
                    leechers
                    publishedAt
                    torrent {
                      name
                      size
                      magnetUri
                    }
                  }
                }
              }
            }
        `,
        variables: {
            query: searchTerm
        }
    };

    // Construct magnet link helper
    // magnet:?xt=urn:btih:${hash}&dn=${name}

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
        throw new Error(data.errors[0].message);
    }

    // Access path depends on exact schema structure
    // Trying to be robust by checking paths
    const items = data.data?.torrentContent?.search?.items || [];
    return items;
}

// Sort results based on current sort selection
function sortResults(results) {
    const sorted = [...results];

    switch (currentSort) {
        case 'seeders_desc':
            sorted.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));
            break;
        case 'seeders_asc':
            sorted.sort((a, b) => (a.seeders || 0) - (b.seeders || 0));
            break;
        case 'size_desc':
            sorted.sort((a, b) => (b.torrent?.size || 0) - (a.torrent?.size || 0));
            break;
        case 'size_asc':
            sorted.sort((a, b) => (a.torrent?.size || 0) - (b.torrent?.size || 0));
            break;
        case 'date_desc':
            sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            break;
        case 'date_asc':
            sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
            break;
        default:
            // relevance - keep original order
            break;
    }

    return sorted;
}

// Filter results by category (client-side)
function filterByCategory(results, category) {
    if (category === 'all') return results;

    const categoryMap = {
        'movie': 'movie',
        'tv_show': 'tv_show',
        'music': 'music',
        'ebook': 'ebook',
        'comic': 'comic',
        'audiobook': 'audiobook',
        'software': 'software',
        'xxx': 'xxx'
    };

    const targetType = categoryMap[category];
    if (!targetType) return results;

    return results.filter(item => {
        const itemType = (item.contentType || '').toLowerCase();
        return itemType === targetType;
    });
}

// Filter results to only include titles that contain search terms
function filterBySearchTerms(results, searchQuery) {
    // Normalize search query: handle special chars, keep Unicode letters
    const normalizedQuery = normalizeText(searchQuery);
    const searchWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
    if (searchWords.length === 0) return results;

    return results.filter(item => {
        const normalizedTitle = normalizeText(item.title || '');
        // Title must contain at least one search word
        return searchWords.some(word => normalizedTitle.includes(word));
    });
}

// Normalize text for comparison: handle dots, special chars, Unicode
function normalizeText(text) {
    return text
        .toLowerCase()
        // Replace dots, underscores, dashes with spaces (common in torrent names)
        .replace(/[._\-]/g, ' ')
        // Remove brackets and parentheses content markers but keep content
        .replace(/[\[\](){}]/g, ' ')
        // Normalize multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
}

function displayResults(results) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-ghost"></i>
                <h2>No results found</h2>
                <p>Try different keywords or check your spelling.</p>
            </div>
        `;
        return;
    }

    results.forEach(item => {
        const magnetLink = item.torrent?.magnetUri || `magnet:?xt=urn:btih:${item.infoHash}&dn=${encodeURIComponent(item.title)}`;
        const date = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'N/A';
        const size = formatBytes(item.torrent?.size || 0);
        const typeLabel = getTypeLabel(item.contentType);
        const typeClass = getTypeClass(item.contentType);

        const title = item.torrent?.name || item.title;
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-info">
                <div class="result-header">
                    <span class="type-badge ${typeClass}">${typeLabel}</span>
                    <h3>${escapeHtml(title)}</h3>
                </div>
                <div class="result-meta">
                    <span class="meta-item size" title="Size">
                        <i class="fa-solid fa-hard-drive"></i> ${size}
                    </span>
                    <span class="meta-item seeders" title="Seeders">
                        <i class="fa-solid fa-arrow-up"></i> ${item.seeders || 0}
                    </span>
                    <span class="meta-item leechers" title="Leechers">
                        <i class="fa-solid fa-arrow-down"></i> ${item.leechers || 0}
                    </span>
                    <span class="meta-item date" title="Published">
                        <i class="fa-regular fa-calendar"></i> ${date}
                    </span>
                </div>
            </div>
            <div class="result-actions">
                <button class="magnet-btn" onclick="copyMagnet(this, '${magnetLink}')" title="Copy Magnet Link">
                    <i class="fa-solid fa-magnet"></i> Magnet
                </button>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

function updateStats(count, time) {
    resultCountSpan.textContent = count;
    searchTimeSpan.textContent = time;
    statsDiv.classList.remove('hidden');
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        statsDiv.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
    }
}

// Utilities
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Content type helpers
function getTypeLabel(contentType) {
    const labels = {
        'MOVIE': 'Movie',
        'TV_SHOW': 'TV Show',
        'MUSIC': 'Music',
        'EBOOK': 'E-Book',
        'COMIC': 'Comic',
        'AUDIOBOOK': 'Audiobook',
        'SOFTWARE': 'Software',
        'GAME': 'Game',
        'XXX': 'XXX'
    };
    return labels[contentType] || contentType || 'Unknown';
}

function getTypeClass(contentType) {
    const classes = {
        'MOVIE': 'type-movie',
        'TV_SHOW': 'type-tv',
        'MUSIC': 'type-music',
        'EBOOK': 'type-book',
        'COMIC': 'type-book',
        'AUDIOBOOK': 'type-audio',
        'SOFTWARE': 'type-software',
        'GAME': 'type-game',
        'XXX': 'type-xxx'
    };
    return classes[contentType] || 'type-unknown';
}

// Global scope for onclick
window.copyMagnet = async (btn, link) => {
    try {
        await navigator.clipboard.writeText(link);

        // Add animation class
        btn.classList.add('clicked');

        // Change icon temporarily
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';

        showToast();

        // Reset after animation
        setTimeout(() => {
            btn.classList.remove('clicked');
            icon.className = 'fa-solid fa-magnet';
        }, 1500);

    } catch (err) {
        console.error('Failed to copy API link', err);
        // Fallback or open directly
        window.open(link, '_blank');
    }
};

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
