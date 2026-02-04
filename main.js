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
let currentPage = 1;
const itemsPerPage = 50;

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

async function performSearch(resetPage = true) {
    const query = searchInput.value.trim();
    if (!query) return;

    if (resetPage) currentPage = 1;

    showLoading(true);
    const startTime = performance.now();

    // Prepare broader query: append wildcard * to each term for partial matching
    const broadQuery = query.split(/\s+/).map(word => `${word}*`).join(' ');

    showLoading(true);
    try {
        const offset = (currentPage - 1) * itemsPerPage;
        const results = await searchTorrents(broadQuery, currentFilter, itemsPerPage, offset);
        const endTime = performance.now();

        // Client-side filtering on the current page of results
        const filteredResults = filterByCategory(results, currentFilter);

        lastResults = filteredResults;
        displayResults(sortResults(filteredResults));
        updateStats(filteredResults.length, Math.round(endTime - startTime));
        renderPagination();
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

// GraphQL Query - fetch paginated results
async function searchTorrents(searchTerm, category, limit = 50, offset = 0) {
    const graphqlQuery = {
        query: `
            query Search($query: String!, $limit: Int, $offset: Int) {
              torrentContent {
                search(input: { queryString: $query, limit: $limit, offset: $offset }) {
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
            query: searchTerm,
            limit: limit,
            offset: offset
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

function renderPagination() {
    const existingPagination = document.getElementById('pagination');
    if (existingPagination) existingPagination.remove();

    if (lastResults.length === 0 && currentPage === 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'pagination';
    paginationDiv.className = 'pagination-container';

    paginationDiv.innerHTML = `
        <button class="page-btn" onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-left"></i> Previous
        </button>
        <span class="page-info">Page ${currentPage}</span>
        <button class="page-btn" onclick="changePage(1)" ${lastResults.length < itemsPerPage ? 'disabled' : ''}>
            Next <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    resultsContainer.parentNode.insertBefore(paginationDiv, resultsContainer.nextSibling);

    // If we have 0 results on a non-first page, we might want to allow going back, 
    // but the above disabled check handles next button.
}

window.changePage = (direction) => {
    currentPage += direction;
    performSearch(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

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
