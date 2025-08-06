// ==UserScript==
// @name         MangaUpdates Grid View

// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://github.com/Reibies/WEB_Userscripts/raw/refs/head/master/Mangaupdates/MU_GridView.user.js

// @version      2.0

// @description  MangaUpdates grid view
// @icon         https://www.mangaupdates.com/favicon.ico
// @match        https://www.mangaupdates.com/lists/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      api.mangaupdates.com
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        RETRY_LIMIT: 3,
        MAX_CONCURRENT_REQUESTS: 4,
        BASE_URL: 'https://api.mangaupdates.com/v1/series/',
        CACHE_LIMIT: 5000,
        RETRY_BASE_DELAY: 1000,
        PLACEHOLDER_IMAGE_URL: "https://placeholder.pics/svg/150x230/d0d8e2/52667c/[No%20Cover]",
    };

    let cache = JSON.parse(localStorage.getItem('mangaUpdatesCoverCache')) || {};
    const loadQueue = [];
    let activeRequests = 0;

    // Use GM_addStyle instead of inline styles to comply with CSP
    GM_addStyle(`
        .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            justify-content: center;
            padding: 10px;
        }
        .grid-item {
            display: flex;
            flex-direction: column;
            border: 1px solid #ccc;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 230px;
            position: relative;
            transition: all 0.3s ease;
        }
        .cover-container {
            min-height: 250px;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            transition: min-height 0.3s ease;
        }
        .info-container {
            background-color: #e0e0e0;
            padding: 5px;
            height: 65px;
            text-align: center;
            margin-top: auto;
            transition: height 0.3s ease;
        }
        .title {
            font-weight: bold;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            transition: all 0.3s ease;
            font-size: 15px;
        }
        .expanded .title {
            -webkit-line-clamp: 4;
        }
        .controls-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 5px;
        }
        .toggle-btn {
            cursor: pointer;
        }
        .extra-info {
            display: none;
        }
        .expanded .info-container {
            height: 315px;
        }
        .expanded .cover-container {
            min-height: 0px;
        }
        .expanded .extra-info {
            display: block;
        }
    `);

    const updateCache = () => {
        const keys = Object.keys(cache);
        if (keys.length > config.CACHE_LIMIT) {
            delete cache[keys[0]];
        }
        localStorage.setItem('mangaUpdatesCoverCache', JSON.stringify(cache));
    };

    const extractSeriesIdFromUrl = url => {
        const match = url.match(/\/series\/([^\/]+)/);
        return match ? parseInt(match[1], 36) : NaN;
    };

    const fetchCoverImage = (seriesId, retryCount = 0) => {
        if (isNaN(seriesId) || seriesId <= 0) {
            delete cache[seriesId];
            updateCache();
            return Promise.reject('Invalid series ID');
        }

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `${config.BASE_URL}${seriesId}`,
                onload: ({ status, responseText }) => {
                    if (status === 200) {
                        try {
                            const responseJson = JSON.parse(responseText);
                            const imageUrl = responseJson?.image?.url?.original;
                            if (imageUrl) {
                                cache[seriesId] = { imageUrl };
                                updateCache();
                                resolve(imageUrl);
                            } else {
                                reject("Image URL not found");
                            }
                        } catch {
                            reject("Error parsing response");
                        }
                    } else if (status === 404) {
                        console.warn(`404 Error for series ID ${seriesId}: Image not found`);
                        delete cache[seriesId];
                        updateCache();
                        reject("Image not found (404)");
                    } else if (status === 503 && retryCount < config.RETRY_LIMIT) {
                        setTimeout(() => fetchCoverImage(seriesId, retryCount + 1)
                            .then(resolve)
                            .catch(reject),
                            config.RETRY_BASE_DELAY * 2 ** retryCount
                        );
                    } else {
                        reject(`Error: ${status}`);
                    }
                },
                onerror: () => reject("Unable to fetch image"),
            });
        });
    };

const createGridItem = (row) => {
    const gridItem = document.createElement('div');
    gridItem.className = 'grid-item collapsed';

    const link = row.querySelector('a[href*="/series/"]');
    if (!link) return null;

    const seriesId = extractSeriesIdFromUrl(link.href);
    if (!seriesId) return null;

    gridItem.dataset.seriesId = seriesId;

    const coverLink = document.createElement('a');
    coverLink.href = link.href;
    coverLink.target = '_blank';

    const coverContainer = document.createElement('div');
    coverContainer.className = 'cover-container';
    coverLink.appendChild(coverContainer);
    gridItem.appendChild(coverLink);

    const infoContainer = document.createElement('div');
    infoContainer.className = 'info-container';

    const title = link.textContent;
    const extraInfoElement = row.querySelector('.series-list-item_newlist__neJYV');
    const extraInfoText = extraInfoElement ? extraInfoElement.textContent : '';

    const chapterMatch = extraInfoText.match(/\d+/);
    const chapterNumber = chapterMatch ? chapterMatch[0] : '';

    let infoHtml = `
        <div class="title"><a href="${link.href}">${title}</a></div>
    `;
    if (chapterNumber) {
        infoHtml += `Unread: ${chapterNumber}<br>`;
    }

    infoHtml += `<div class="extra-info"></div>`;

    infoContainer.innerHTML = infoHtml;

    gridItem.appendChild(infoContainer);

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    controlsContainer.innerHTML = '<span class="toggle-btn">⚙️</span>';
    gridItem.appendChild(controlsContainer);

    return gridItem;
};
    const loadCoverImageInView = gridItem => {
        const coverContainer = gridItem.querySelector('.cover-container');
        const seriesId = gridItem.dataset.seriesId;

        if (cache[seriesId]?.imageUrl) {
            coverContainer.style.backgroundImage = `url(${cache[seriesId].imageUrl})`;
        } else {
            fetchCoverImage(seriesId)
                .then(imageUrl => {
                    coverContainer.style.backgroundImage = `url(${imageUrl})`;
                })
                .catch(() => {
                    coverContainer.style.backgroundImage = `url(${config.PLACEHOLDER_IMAGE_URL})`;
                })
                .finally(() => {
                    activeRequests--;
                    processNextInQueue();
                });
        }
    };

    const processNextInQueue = () => {
        if (loadQueue.length && activeRequests < config.MAX_CONCURRENT_REQUESTS) {
            const nextItem = loadQueue.shift();
            if (nextItem && nextItem.gridItem) {
                activeRequests++;
                loadCoverImageInView(nextItem.gridItem);
            }
        }
    };

    const toggleExpandCollapse = gridItem => {
        gridItem.classList.toggle('expanded');
        gridItem.classList.toggle('collapsed');
    };

   const initializeGrid = () => {
    const listContainer = document.querySelector('.series-list-table_list_table__H2pQ5');
    if (!listContainer) return;

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';

    const rows = listContainer.querySelectorAll('.row');
    rows.forEach(row => {
        const gridItem = createGridItem(row);
        if (gridItem) {
            gridContainer.appendChild(gridItem);
            gridItem.querySelector('.toggle-btn').addEventListener('click', () => toggleExpandCollapse(gridItem));
            loadQueue.push({ gridItem });
        }
    });

    listContainer.style.display = 'none';
    listContainer.parentElement.insertBefore(gridContainer, listContainer);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadCoverImageInView(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });

    gridContainer.querySelectorAll('.grid-item').forEach(item => {
        observer.observe(item);
    });

    const mutationObserver = new MutationObserver(() => {
        initializeGrid();
    });

    mutationObserver.observe(listContainer.parentElement, {
        childList: true,
        subtree: true
    });
};


   const waitForList = setInterval(() => {
    if (document.querySelector('.series-list-table_list_table__H2pQ5')) {
        clearInterval(waitForList);
        initializeGrid();
    }
}, 500);
})();
