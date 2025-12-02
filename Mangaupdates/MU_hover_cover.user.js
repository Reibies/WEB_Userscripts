// ==UserScript==
// @name         MangaUpdates Hover Preview
// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_hover_cover.user.js
// @version      2.0
// @description  Show cover image on hover over MangaUpdates series link. Synced with Grid View 4.2 cache.
// @match        https://www.mangaupdates.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mangaupdates.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      api.mangaupdates.com
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        COOLDOWN_TIME: 1000,
        RETRY_LIMIT: 2,
        RETRY_DELAY: 2000,
        CACHE_LIMIT: 5000, // Matches Grid View limit
        CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 Days
        BASE_URL: 'https://api.mangaupdates.com/v1/series/',
        PLACEHOLDER_IMAGE_URL: "https://placeholder.pics/svg/150x230/d0d8e2/52667c/[No%20Cover]",
        CACHE_KEY: 'mangaUpdatesCoverCache'
    };

    // Load Cache (Shared with Grid View)
    let cache = JSON.parse(localStorage.getItem(config.CACHE_KEY)) || {};
    let writeTimeout = null;
    let previewContainer = null;
    let currentTarget = null;
    const cooldowns = new Set();

    // CSS
    GM_addStyle(`
        #mu-hover-preview {
            position: absolute;
            z-index: 10000;
            border: 2px solid var(--mu-border-color, #ccc);
            background: var(--mu-background-color-dark, #fff);
            padding: 5px;
            display: none;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            border-radius: 4px;
            pointer-events: none; /* Let clicks pass through */
            min-width: 100px;
            min-height: 50px;
            text-align: center;
            color: var(--mu-text-color, #000);
        }
        #mu-hover-preview img {
            display: block;
            max-width: 250px;
            max-height: 350px;
            object-fit: contain;
        }
        #mu-hover-preview .loading-text { font-size: 12px; padding: 10px; }
        #mu-hover-preview .error-text { font-size: 12px; padding: 10px; color: #ff6b6b; }
    `);

    // Helper: Save Cache Debounced
    const scheduleCacheWrite = () => {
        if (writeTimeout) return;
        writeTimeout = setTimeout(() => {
            const keys = Object.keys(cache);
            if (keys.length > config.CACHE_LIMIT) {
                // Remove oldest
                const oldestKey = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)[0];
                delete cache[oldestKey];
            }
            localStorage.setItem(config.CACHE_KEY, JSON.stringify(cache));
            writeTimeout = null;
        }, 2000);
    };

    // Helper: Extract ID
    const extractSeriesIdFromUrl = url => {
        const match = url.match(/\/series\/([^\/]+)/);
        return match && match[1] ? parseInt(match[1], 36) : NaN;
    };

    // Helper: Fetch Image
    const fetchCoverImage = (seriesId, retryCount = 0) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `${config.BASE_URL}${seriesId}`,
                headers: { "Accept": "application/json" },
                onload: (response) => {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            const imageUrl = data?.image?.url?.original || config.PLACEHOLDER_IMAGE_URL;
                            cache[seriesId] = { imageUrl, timestamp: Date.now() };
                            scheduleCacheWrite();
                            resolve(imageUrl);
                        } catch (e) { reject("Parse Error"); }
                    } else if (response.status === 404) {
                        cache[seriesId] = { imageUrl: config.PLACEHOLDER_IMAGE_URL, timestamp: Date.now() };
                        scheduleCacheWrite();
                        resolve(config.PLACEHOLDER_IMAGE_URL);
                    } else if (response.status >= 500 && retryCount < config.RETRY_LIMIT) {
                        setTimeout(() => {
                            fetchCoverImage(seriesId, retryCount + 1).then(resolve).catch(reject);
                        }, config.RETRY_DELAY);
                    } else {
                        reject(`API ${response.status}`);
                    }
                },
                onerror: () => reject("Network Error")
            });
        });
    };

    // UI: Create Container
    const getPreviewContainer = () => {
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'mu-hover-preview';
            document.body.appendChild(previewContainer);
        }
        return previewContainer;
    };

    // UI: Position Logic
    const updatePosition = (e) => {
        if (!previewContainer || previewContainer.style.display === 'none') return;
        const offset = 15;
        const rect = previewContainer.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let left = e.pageX + offset;
        let top = e.pageY + offset;

        // Flip to left if offscreen right
        if (left + rect.width > scrollX + winW) {
            left = e.pageX - rect.width - offset;
        }
        // Flip up if offscreen bottom
        if (top + rect.height > scrollY + winH) {
            top = e.pageY - rect.height - offset;
        }

        previewContainer.style.left = `${left}px`;
        previewContainer.style.top = `${top}px`;
    };

    // Logic: Show Preview
    const showPreview = async (e, link) => {
        const url = link.href;
        if (!url || url.includes('?act=')) return;

        // Ignore if inside Grid View (already has cover)
        if (link.closest('.grid-item')) return;

        const seriesId = extractSeriesIdFromUrl(url);
        if (isNaN(seriesId)) return;

        currentTarget = link;
        const container = getPreviewContainer();
        container.innerHTML = '<div class="loading-text">Loading...</div>';
        container.style.display = 'block';
        updatePosition(e);

        // Define Image Loader
        const loadImageIntoPreview = (src) => {
            if (currentTarget !== link) return; // Cursor moved away
            const img = new Image();
            img.src = src;
            img.onload = () => {
                if (currentTarget !== link) return;
                container.innerHTML = '';
                container.appendChild(img);
                updatePosition(e); // Re-calc position for new size
            };
            img.onerror = () => {
                // Auto-healing: If cache was bad, refetch
                if (cache[seriesId]?.imageUrl === src && src !== config.PLACEHOLDER_IMAGE_URL) {
                    delete cache[seriesId];
                    scheduleCacheWrite();
                    // Refetch once
                    fetchCoverImage(seriesId).then(newUrl => loadImageIntoPreview(newUrl));
                } else {
                    img.src = config.PLACEHOLDER_IMAGE_URL;
                }
            };
        };

        // Check Cache
        const cached = cache[seriesId];
        const isExpired = cached && (Date.now() - cached.timestamp > config.CACHE_TTL);

        if (cached && !isExpired) {
            loadImageIntoPreview(cached.imageUrl);
        } else {
            // Check cooldown
            if (cooldowns.has(seriesId)) {
                container.innerHTML = '<div class="loading-text">Cooling down...</div>';
                return;
            }
            cooldowns.add(seriesId);
            setTimeout(() => cooldowns.delete(seriesId), config.COOLDOWN_TIME);

            try {
                const newUrl = await fetchCoverImage(seriesId);
                loadImageIntoPreview(newUrl);
            } catch (err) {
                if (currentTarget === link) {
                    container.innerHTML = `<div class="error-text">${err}</div>`;
                }
            }
        }
    };

    const hidePreview = () => {
        currentTarget = null;
        if (previewContainer) {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
        }
    };

    // Event Listeners (Delegation)
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a[href*="/series/"]');
        if (link && !link.href.includes('/-edit/')) {
            showPreview(e, link);
            link.addEventListener('mousemove', updatePosition, { passive: true });
        }
    });

    document.addEventListener('mouseout', (e) => {
        const link = e.target.closest('a[href*="/series/"]');
        if (link) {
            hidePreview();
            link.removeEventListener('mousemove', updatePosition);
        }
    });

    // Handle History API changes (SPA navigation)
    const wrapHistory = (type) => {
        const original = history[type];
        return function() {
            hidePreview();
            return original.apply(this, arguments);
        };
    };
    history.pushState = wrapHistory('pushState');
    history.replaceState = wrapHistory('replaceState');
    window.addEventListener('popstate', hidePreview);

})();
