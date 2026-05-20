let allData = [];
const featuredGames = ["gta-sa-mod-v", "racing-master", "minecraft-mod", "war-thunder"];

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initSearch();

    fetch('games.json')
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            allData = data;
            loadPopularGames();
            generateGenreButtons(); // NEW FUNCTION
            filterCategory('game'); // Default tab
        })
        .catch(err => {
            console.error("Error loading games:", err);
            const grid = document.getElementById('main-grid');
            if(grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Error loading games.json</p>';
        });
});

// --- NEW GENRE FILTER LOGIC ---
function generateGenreButtons() {
    const genreList = document.getElementById('genre-list');
    if(!genreList) return;

    // 1. Get unique genres from data
    const genres = new Set();
    allData.forEach(item => {
        if(item.genre) {
            item.genre.split(',').forEach(g => genres.add(g.trim()));
        }
    });

    // 2. Create "All" button
    let html = `<button class="genre-btn active" onclick="filterByGenre('All', this)">All</button>`;

    // 3. Create buttons for each genre
    genres.forEach(g => {
        html += `<button class="genre-btn" onclick="filterByGenre('${g}', this)">${g}</button>`;
    });

    genreList.innerHTML = html;
}

function filterByGenre(genre, btn) {
    // Highlight button
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Filter Logic
    if (genre === 'All') {
        // If "All" is clicked, revert to the current main Tab (Game or App)
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            // Re-trigger the category filter
            if(activeTab.textContent.includes('Games')) filterCategory('game');
            else if(activeTab.textContent.includes('Apps')) filterCategory('app');
            else filterCategory('tool');
        } else {
            filterCategory('game');
        }
    } else {
        // Show ALL items that match this genre (ignoring Game/App tab for now to show more results)
        const filtered = allData.filter(item => item.genre.includes(genre));
        displayGrid(filtered);
    }
}

// --- STANDARD FUNCTIONS ---

function initDarkMode() {
    const toggle = document.getElementById('mode-toggle');
    if (!toggle) return;
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        toggle.checked = true;
    }
    toggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', toggle.checked ? 'dark' : 'light');
    });
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allData.filter(item => 
            item.title.toLowerCase().includes(term) || 
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
        );
        displayGrid(filtered);
    });
}

function filterCategory(category) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const btnText = btn.textContent.toLowerCase();
        const catName = category === 'game' ? 'games' : (category === 'app' ? 'apps' : 'tools');
        btn.classList.toggle('active', btnText.includes(catName));
    });
    const filtered = allData.filter(item => item.category === category);
    displayGrid(filtered);
}

function displayGrid(items) {
    const grid = document.getElementById('main-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (items.length === 0) { 
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">No results found.</p>'; 
        return; 
    }
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.animationDelay = `${index * 0.05}s`; 
        div.onclick = () => openModal(item);
        div.innerHTML = `
            <img src="${item.icon}" alt="${item.title}" referrerpolicy="no-referrer">
            <div class="card-info">
                <h3>${item.title}</h3>
                <div class="card-meta">
                    <span>${item.genre ? item.genre.split(',')[0] : 'App'}</span>
                    <span style="color:#f1c40f"><i class="fas fa-star"></i> ${item.rating}</span>
                </div>
            </div>`;
        grid.appendChild(div);
    });
}

function loadPopularGames() {
    const container = document.getElementById('popular-games');
    if (!container) return;
    const popular = allData.filter(item => featuredGames.includes(item.id) || (item.tags && item.tags.includes('hot')));
    container.innerHTML = popular.map(item => `
        <div class="popular-card" onclick="openModalById('${item.id}')">
            <img src="${item.icon}" referrerpolicy="no-referrer">
            <h4>${item.title}</h4>
        </div>`).join('');
}

function openModalById(id) {
    const item = allData.find(i => i.id === id);
    if(item) openModal(item);
}

function openModal(item) {
    const modal = document.getElementById('game-modal');
    if (!modal) return;
    const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
    document.getElementById('modal-icon').src = item.icon;
    setText('modal-title', item.title);
    setText('modal-rating-value', item.rating);
    setText('modal-downloads', (item.total_downloads || 0).toLocaleString() + ' Downloads');
    setText('modal-updated', item.updated || 'N/A');
    setText('modal-version', item.version || 'Latest');
    setText('modal-genre', item.genre || 'Game');
    setText('modal-desc', item.description);
    
    if(document.getElementById('modal-tags')) document.getElementById('modal-tags').innerHTML = (item.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
    if(document.getElementById('modal-screenshots')) document.getElementById('modal-screenshots').innerHTML = (item.screenshots || []).map(s => `<img src="${s}" referrerpolicy="no-referrer">`).join('');
    
    setupDownloadButton('btn-android', item.downloads ? item.downloads.android : '#');
    setupDownloadButton('btn-ios', item.downloads ? item.downloads.ios : '#');
    
    if(document.getElementById('related-items')) {
        const related = allData.filter(i => i.id !== item.id && i.category === item.category).slice(0, 4);
        document.getElementById('related-items').innerHTML = related.map(rel => `
            <div class="related-card" onclick="openModalById('${rel.id}')">
                <img src="${rel.icon}" referrerpolicy="no-referrer">
                <h4>${rel.title}</h4>
            </div>`).join('');
    }
    if(document.getElementById('modal-comments')) {
        document.getElementById('modal-comments').innerHTML = (item.comments || []).map(c => `
            <div class="comment" style="background:var(--bg-color);padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid var(--border-color);">
                <strong style="color:var(--primary-color)">${c.user}</strong>: ${c.text}
            </div>
        `).join('');
    }
    modal.style.display = 'flex';
}

function setupDownloadButton(btnId, url) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.style.pointerEvents = 'auto'; btn.style.opacity = '1'; btn.style.background = ''; 
    btn.innerHTML = btnId === 'btn-android' ? '<i class="fab fa-android"></i> Download APK' : '<i class="fab fa-apple"></i> iOS Version';
    btn.removeAttribute('href'); btn.onclick = null; 
    if (!url || url === '#' || url === '') { btn.style.display = 'none'; return; }
    btn.style.display = 'flex';
    btn.onclick = (e) => {
        e.preventDefault(); 
        if (btn.dataset.counting === "true") return; 
        btn.dataset.counting = "true";
        btn.style.pointerEvents = 'none'; btn.style.backgroundColor = '#555'; 
        let timeLeft = 5;
        btn.innerHTML = `<i class="fas fa-hourglass-half"></i> Wait ${timeLeft}s...`;
        const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) { btn.innerHTML = `<i class="fas fa-hourglass-half"></i> Wait ${timeLeft}s...`; } 
            else {
                clearInterval(timer);
                btn.innerHTML = `<i class="fas fa-check"></i> Download Now`;
                btn.style.backgroundColor = '#00d65d'; 
                btn.style.pointerEvents = 'auto'; btn.dataset.counting = "false";
                window.open(url, '_blank');
            }
        }, 1000);
    };
}

function openRequestModal() { const m = document.getElementById('request-modal'); if(m) m.style.display = 'flex'; }
function closeRequestModal() { const m = document.getElementById('request-modal'); if(m) m.style.display = 'none'; }
function submitRequest(e) {
    e.preventDefault(); closeRequestModal();
    showToast("Request Sent Successfully!", "success"); e.target.reset();
}
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
function closeModal() { const m = document.getElementById('game-modal'); if(m) m.style.display = 'none'; }
window.onclick = function(e) { 
    const gameModal = document.getElementById('game-modal'); const reqModal = document.getElementById('request-modal');
    if (e.target === gameModal) closeModal(); if (e.target === reqModal) closeRequestModal(); 
}
