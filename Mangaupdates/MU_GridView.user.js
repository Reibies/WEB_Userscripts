// ==UserScript==
// @name         MangaUpdates Grid View
// @author       Reibies
// @namespace    https://github.com/Reibies
// @version      4.2
// @description  MangaUpdates grid view for personal and public lists with an optimized, shared cache and modern framework compatibility. Includes auto-healing for broken covers.
// @icon         https://raw.githubusercontent.com/Reibies/WEB_Userscripts/refs/heads/master/Mangaupdates/Mu-tama.webp
// @match        https://www.mangaupdates.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      api.mangaupdates.com
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_GridView.user.js
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_GridView.user.js
// ==/UserScript==

(function() {
    'use strict';
    const config = {
        RETRY_LIMIT: 3,
        MAX_CONCURRENT_REQUESTS: 5,
        CACHE_LIMIT: 5000,
        BASE_URL: 'https://api.mangaupdates.com/v1/series/',
        RETRY_BASE_DELAY: 1500,
        CACHE_KEY: 'mangaUpdatesCoverCache',
        PLACEHOLDER_IMAGE_URL: "https://placeholder.pics/svg/150x230/d0d8e2/52667c/[No%20Cover]",
        CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 Days in milliseconds
    };

    let cache = JSON.parse(localStorage.getItem(config.CACHE_KEY)) || {};
    let writeTimeout = null;
    const loadQueue = new Set();
    let activeRequests = 0;
    let gridUpdateTimeout = null;

    GM_addStyle(`
        .mu-grid-hidden { display: none !important; }
        #top-pagination-clone { padding: 5px 10px; }
        .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; justify-content: center; padding: 10px; }
        .grid-item { display: flex; flex-direction: column; border: 2px solid var(--mu-border-color); box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden; max-width: 190px; position: relative; transition: all 0.3s ease; background-color: var(--mu-background-color-main); }
        .grid-item.selected { outline: 2px solid var(--mu-text-color-highlight); outline-offset: -2px; }
        .cover-container { min-height: 250px; display: flex; align-items: center; justify-content: center; }
        .cover-image { width: 100%; height: 100%; object-fit: contain; }
        .info-container { background-color: var(--mu-background-color-dark); color: var(--mu-text-color); padding: 5px; height: 40px; text-align: center; margin-top: auto; cursor: pointer; }
        .title { font-weight: bold; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 15px; }
        .title a { color: var(--mu-text-color); text-decoration: none; }
        .title a:hover { text-decoration: underline; }
        .grid-corner { position: absolute; width: 35px; height: 35px; background-color:var(--mu-background-color-darker); color: var(--mu-text-color); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; cursor: pointer; text-align: center; transition: background-color 0.2s; z-index: 1; line-height: 1.1; border: 2px solid var(--mu-border-color); }
        .grid-corner:hover { background-color: var(--mu-text-color-highlight); }
        .grid-corner.top-left { top: -2px; left: -2px; border-bottom-right-radius: 35px; flex-direction: column; padding: 3px 6px 6px 3px; gap: 1px; }
        .grid-corner.top-right { top: -2px; right: -2px; border-bottom-left-radius: 35px; padding: 0 0 5px 5px; font-size: 9px; }
        .grid-corner.top-right:not([title]) { cursor: default; }
        .grid-corner.top-right:not([title]):hover { background-color: rgb(from var(--mu-background-color-darker) r g b / .5); }
        .corner-highlight { color: var(--mu-text-color-lighter); font-size: 1.2rem; }
        .mu-editor-active .info-container, .mu-editor-active .grid-corner { visibility: hidden; }
        .edit-container { position: absolute; bottom: 0; left: 0; right: 0; background-color: var(--mu-background-color-dark); padding: 5px; display: flex; align-items: center; justify-content: space-around; z-index: 10; height: 65px; box-sizing: border-box; }
        .edit-container input { width: 50px; text-align: center; background-color: var(--mu-background-color-main); color: var(--mu-text-color); border: none; border-radius: 3px; padding: 4px; }
        .edit-container button { padding: 4px 8px; cursor: pointer; border: none; background-color: var(--mu-background-color-main); color: var(--mu-text-color); border-radius: 3px; font-weight: bold; min-width: 28px; }
        .edit-container button:hover { background-color: var(--mu-background-color-highlight); }
    `);

    const scheduleCacheWrite = () => {
        if (writeTimeout) return;
        writeTimeout = setTimeout(() => {
            const keys = Object.keys(cache);
            if (keys.length > config.CACHE_LIMIT) {
                const oldestKey = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)[0];
                delete cache[oldestKey];
            }
            localStorage.setItem(config.CACHE_KEY, JSON.stringify(cache));
            writeTimeout = null;
        }, 2500);
    };

    const extractSeriesIdFromUrl = url => url.match(/\/series\/([^\/]+)/)?.[1] ? parseInt(url.match(/\/series\/([^\/]+)/)[1], 36) : NaN;

    const apiRequest = (options) => new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            ...options,
            headers: { "Content-Type": "application/json", "Accept": "application/json", ...options.headers },
            data: options.data ? JSON.stringify(options.data) : undefined,
            onload: ({ status, responseText }) => (status >= 200 && status < 300) ? resolve(JSON.parse(responseText || '{}')) : reject({ status, responseText }),
            onerror: reject
        });
    });

    const fetchCoverImage = (seriesId, retryCount = 0) => {
        if (isNaN(seriesId) || seriesId <= 0) return Promise.reject('Invalid series ID');
        return apiRequest({ method: "GET", url: `${config.BASE_URL}${seriesId}` })
            .then(response => {
                const imageUrl = response?.image?.url?.original || config.PLACEHOLDER_IMAGE_URL;
                cache[seriesId] = { imageUrl, timestamp: Date.now() };
                scheduleCacheWrite();
                return imageUrl;
            })
            .catch(err => {
                if (err.status === 404) {
                    cache[seriesId] = { imageUrl: config.PLACEHOLDER_IMAGE_URL, timestamp: Date.now() };
                    scheduleCacheWrite();
                }
                if (err.status >= 500 && retryCount < config.RETRY_LIMIT) {
                    return new Promise(resolve => setTimeout(resolve, config.RETRY_BASE_DELAY * (retryCount + 1)))
                        .then(() => fetchCoverImage(seriesId, retryCount + 1));
                }
                return Promise.reject(err);
            });
    };

    const updateSeriesProgress = (seriesId, volume, chapter) => apiRequest({
        method: "POST", url: "https://www.mangaupdates.com/api/v1/lists/series/update",
        data: [{ series: { id: parseInt(seriesId, 10) }, status: { volume: parseFloat(volume) || 0, chapter: Math.floor(parseFloat(chapter) || 0) } }]
    });

    const updateSeriesRating = (seriesId, rating) => {
        const isDelete = rating === null || rating <= 0;
        return apiRequest({
            method: isDelete ? "DELETE" : "PUT", url: `https://www.mangaupdates.com/api/v1/series/${seriesId}/rating`,
            data: isDelete ? undefined : { rating: parseInt(rating, 10) }
        });
    };

    const handleButtonError = (button, originalText, errorText = 'Error') => {
        button.textContent = errorText;
        button.disabled = true;
        setTimeout(() => { button.textContent = originalText; button.disabled = false; }, 2000);
    };

    const showEditor = (gridItem, seriesId, isRatingEditor) => {
        if (gridItem.querySelector('.edit-container')) return;
        const corner = gridItem.querySelector(isRatingEditor ? '.top-right' : '.top-left');
        if (!corner) return;
        gridItem.classList.add('mu-editor-active');
        const editor = document.createElement('div');
        editor.className = 'edit-container';
        const closeEditor = () => { editor.remove(); gridItem.classList.remove('mu-editor-active'); };
        if (isRatingEditor) {
            const initialRating = corner.dataset.userScore === 'Add' ? '' : corner.dataset.userScore || '';
            editor.innerHTML = `<input type="number" class="rating-input" value="${initialRating}" min="1" max="10" step="1" placeholder="1-10"><button class="save-button" title="Save">✓</button><button class="delete-button" title="Delete Rating">Del</button><button class="cancel-button" title="Cancel">✗</button>`;
            const ratingInput = editor.querySelector('.rating-input');
            ratingInput.focus();
            ratingInput.select();
            editor.querySelector('.save-button').addEventListener('click', async (e) => {
                const button = e.target, newRating = ratingInput.value;
                if (!newRating || newRating < 1 || newRating > 10) return;
                button.textContent = '...'; button.disabled = true;
                try {
                    await updateSeriesRating(seriesId, newRating);
                    const globalScore = corner.dataset.globalScore;
                    corner.dataset.userScore = newRating;
                    corner.textContent = (globalScore) ? `${newRating} / ${globalScore}` : newRating;
                    closeEditor();
                } catch (error) { handleButtonError(button, '✓'); }
            });
            editor.querySelector('.delete-button').addEventListener('click', async (e) => {
                const button = e.target;
                button.textContent = '...'; button.disabled = true;
                try {
                    await updateSeriesRating(seriesId, null);
                    const globalScore = corner.dataset.globalScore;
                    corner.dataset.userScore = 'Add';
                    corner.textContent = globalScore || 'Rate';
                    closeEditor();
                } catch (error) { handleButtonError(button, 'Del'); }
            });
        } else {
            const getNum = (text, isChap) => { const n = parseFloat(text?.match(/[\d\.]+/)?.[0]); return isNaN(n) ? '' : (isChap ? Math.floor(n) : n).toString(); };
            const currentVcText = corner.dataset.vcText || '';
            const initialVol = getNum(currentVcText.match(/v\.([\d\.]+)/i)?.[1]);
            const initialChap = getNum(currentVcText.match(/c\.([\d\.]+)/i)?.[1], true);
            editor.innerHTML = `<input type="number" class="volume-input" value="${initialVol}" min="0" step="any"><input type="number" class="chapter-input" value="${initialChap}" min="0" step="1"><button class="save-button" title="Save">✓</button><button class="cancel-button" title="Cancel">✗</button>`;
            editor.querySelector('.save-button').addEventListener('click', async (e) => {
                const button = e.target;
                button.textContent = '...'; button.disabled = true;
                const newVolume = editor.querySelector('.volume-input').value, newChapter = editor.querySelector('.chapter-input').value;
                try {
                    await updateSeriesProgress(seriesId, newVolume, newChapter);
                    const v = parseFloat(newVolume), c = Math.floor(parseFloat(newChapter));
                    let newHtml = !isNaN(c) && c >= 0 ? `<span class="corner-chapter">${c}</span>` : '';
                    if (corner.querySelector('.corner-highlight')) newHtml += corner.querySelector('.corner-highlight').outerHTML;
                    corner.innerHTML = newHtml || '...';
                    corner.dataset.vcText = [!isNaN(v) && v >= 0 ? `v.${v}` : '', !isNaN(c) && c >= 0 ? `c.${c}` : ''].filter(Boolean).join(' / ');
                    closeEditor();
                } catch (error) { handleButtonError(button, '✓'); }
            });
        }
        editor.querySelector('.cancel-button').addEventListener('click', closeEditor);
        gridItem.appendChild(editor);
    };

    const processNextInQueue = () => {
        while (loadQueue.size > 0 && activeRequests < config.MAX_CONCURRENT_REQUESTS) {
            const gridItem = loadQueue.values().next().value;
            loadQueue.delete(gridItem);
            const seriesId = gridItem.dataset.seriesId;
            const coverImg = gridItem.querySelector('.cover-image');

            const fetchAndSet = () => {
                activeRequests++;
                fetchCoverImage(seriesId)
                    .then(imageUrl => {
                        coverImg.onerror = () => {
                            coverImg.src = config.PLACEHOLDER_IMAGE_URL;
                            coverImg.onerror = null;
                        };
                        coverImg.src = imageUrl;
                    })
                    .catch(() => { coverImg.src = config.PLACEHOLDER_IMAGE_URL; })
                    .finally(() => { activeRequests--; processNextInQueue(); });
            };

            const cached = cache[seriesId];
            const isExpired = cached && (Date.now() - cached.timestamp > config.CACHE_TTL);

            if (cached && !isExpired) {
                // Attach error handler BEFORE setting src to catch broken cached links
                coverImg.onerror = () => {
                    coverImg.onerror = null; // Prevent infinite loop
                    delete cache[seriesId]; // Invalidate bad cache
                    scheduleCacheWrite();
                    fetchAndSet(); // Fetch fresh URL
                };
                coverImg.src = cached.imageUrl;
            } else {
                fetchAndSet();
            }
        }
    };

    const createGridItem = (row, isPublicList) => {
        const link = row.querySelector('a[href*="/series/"]');
        if (!link) return null;
        const seriesId = extractSeriesIdFromUrl(link.href);
        if (isNaN(seriesId)) return null;
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.dataset.seriesId = seriesId;
        const coverLink = document.createElement('a');
        coverLink.href = link.href;
        coverLink.target = '_blank';
        coverLink.innerHTML = `<div class="cover-container"><img class="cover-image" src="${config.PLACEHOLDER_IMAGE_URL}" alt="Cover for ${link.textContent.trim()}"></div>`;
        const infoContainer = document.createElement('div');
        infoContainer.className = 'info-container';
        infoContainer.innerHTML = `<div class="title"><a href="${link.href}" target="_blank">${link.textContent.trim()}</a></div>`;
        gridItem.append(coverLink, infoContainer);
        if (isPublicList) {
            const ratingEl = row.querySelector('.text.text-center.col-1');
            if (ratingEl?.textContent.trim()) {
                const corner = document.createElement('div');
                corner.className = 'grid-corner top-right';
                corner.textContent = ratingEl.textContent.trim();
                gridItem.appendChild(corner);
            }
        } else {
            if (row.querySelector('.bi-pencil-square')) {
                const vcContainer = row.querySelector('.series-list-item_lcol4__c1wPK .d-inline:not(.pe-2)');
                if (vcContainer) {
                    const vcClone = vcContainer.cloneNode(true);
                    vcClone.querySelectorAll('a[title*="+"], a[title*="-"]').forEach(el => el.remove());
                    const vcText = Array.from(vcClone.querySelectorAll('a')).map(a => a.textContent.trim()).join(' / ');
                    const corner = document.createElement('div');
                    corner.className = 'grid-corner top-left';
                    corner.title = 'Edit Volume/Chapter';
                    corner.dataset.vcText = vcText;
                    const chapter = vcText.match(/c\.([\d\.]+)/i)?.[1];
                    const unreadCount = row.querySelector('.series-list-item_newlist__neJYV')?.textContent.match(/\d+/)?.[0] || '';
                    corner.innerHTML = (chapter ? `<span class="corner-chapter">${Math.floor(parseFloat(chapter))}</span>` : '') + (unreadCount ? `<span class="corner-highlight">${unreadCount}</span>` : '');
                    corner.addEventListener('click', () => showEditor(gridItem, seriesId, false));
                    gridItem.appendChild(corner);
                }
            }
            const ratingLink = row.querySelector('a[title="Update rating"]');
            if (ratingLink) {
                const corner = document.createElement('div');
                corner.className = 'grid-corner top-right';
                const userScore = ratingLink.textContent.trim();
                const globalScore = ratingLink.closest('div')?.nextElementSibling?.textContent.trim();
                corner.dataset.userScore = userScore;
                if (globalScore) corner.dataset.globalScore = globalScore;
                corner.textContent = (globalScore && userScore !== 'Add' && userScore !== 'N/A') ? `${userScore} / ${globalScore}` : (userScore !== 'Add' ? userScore : (globalScore || 'Rate'));
                corner.title = 'Update Rating';
                corner.addEventListener('click', () => showEditor(gridItem, seriesId, true));
                gridItem.appendChild(corner);
            }
        }
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox) {
            infoContainer.addEventListener('click', e => !e.target.closest('a') && checkbox.click());
            const syncSelection = () => gridItem.classList.toggle('selected', checkbox.checked);
            checkbox.addEventListener('change', syncSelection);
            syncSelection();
        }
        return gridItem;
    };

    const triggerGridUpdate = () => {
        if (document.querySelector('.grid-container')) return; // Already processed
        const listContainer = document.querySelector('.series-list-table_list_table__H2pQ5, .p-1.col-12.pb-3')?.parentElement;
        if (!listContainer || listContainer.dataset.gridProcessed) return;
        const rows = listContainer.querySelectorAll('.row.g-0[class*="public-list-row"], .series-list-table_list_table__H2pQ5 > .row');
        if (rows.length === 0) return;

        // Debounce the update to avoid React hydration issues
        clearTimeout(gridUpdateTimeout);
        gridUpdateTimeout = setTimeout(() => {
            listContainer.dataset.gridProcessed = "true";
            const containerToHide = rows[0].parentElement;
            const existingGrid = containerToHide.parentElement.querySelector('.grid-container');
            if (existingGrid) existingGrid.remove();
            document.getElementById('top-pagination-clone')?.remove();
            const gridContainer = document.createElement('div');
            gridContainer.className = 'grid-container';
            rows.forEach(row => {
                const isPublic = row.className.includes('public-list-row');
                const gridItem = createGridItem(row, isPublic);
                if (gridItem) gridContainer.appendChild(gridItem);
            });
            containerToHide.classList.add('mu-grid-hidden');
            const listHeader = document.querySelector('.specialtext.text-start')?.closest('.row.g-0');
            if(listHeader) listHeader.classList.add('mu-grid-hidden');
            containerToHide.parentElement.insertBefore(gridContainer, containerToHide);
            const bottomPagination = document.querySelector('.page-numbers_current_page__Ct_yX')?.closest('.p-1.col-12.pb-3');
            if (bottomPagination && !document.getElementById('top-pagination-clone')) {
                const topPaginationClone = bottomPagination.cloneNode(true);
                topPaginationClone.id = 'top-pagination-clone';
                gridContainer.parentElement.insertBefore(topPaginationClone, gridContainer);
            }
            const intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadQueue.add(entry.target);
                        processNextInQueue();
                        intersectionObserver.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '600px' });
            gridContainer.querySelectorAll('.grid-item').forEach(item => intersectionObserver.observe(item));
        }, 250); // 250ms delay to allow React to hydrate
    };

    const targetNode = document.querySelector('main#mu-main') || document.body;
    const observer = new MutationObserver(triggerGridUpdate);
    observer.observe(targetNode, { childList: true, subtree: true });
    triggerGridUpdate(); // Initial check on script load
})();
