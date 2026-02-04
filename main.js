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

let currentFilter = 'all';

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

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading(true);
    const startTime = performance.now();

    try {
        const results = await searchTorrents(query, currentFilter);
        const endTime = performance.now();

        displayResults(results);
        updateStats(results.length, Math.round(endTime - startTime));
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

// GraphQL Query
async function searchTorrents(searchTerm, category) {
    // Note: This query structure assumes standard Bitmagnet schema.
    // We might need to adjust based on specific version.
    const graphqlQuery = {
        query: `
            query Search($query: String!) {
              torrentContent {
                search(input: { queryString: $query }) {
                  items {
                    infoHash
                    title
                    fileSize
                    seeders
                    leechers
                    publishedAt
                    magnetLink: infoHash
                  }
                }
              }
            }
        `,
        variables: {
            // Bitmagnet expects an input object with queryString
            query: category === 'all' ? searchTerm : `${searchTerm} ${category}`
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
        const magnetLink = `magnet:?xt=urn:btih:${item.infoHash}&dn=${encodeURIComponent(item.title)}`;
        const date = new Date(item.publishedAt).toLocaleDateString();
        const size = formatBytes(item.fileSize);

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-info">
                <h3>${escapeHtml(item.title)}</h3>
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
                <button class="magnet-btn" onclick="copyMagnet('${magnetLink}')" title="Copy Magnet Link">
                    <i class="fa-solid fa-magnet"></i>
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

// Global scope for onclick
window.copyMagnet = async (link) => {
    try {
        await navigator.clipboard.writeText(link);
        showToast();
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
