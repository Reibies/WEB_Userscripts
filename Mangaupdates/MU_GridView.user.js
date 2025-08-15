// ==UserScript==
// @name         MangaUpdates Grid View
// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_GridView.user.js
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_GridView.user.js
// @version      3.0
// @description  MangaUpdates grid view.
// @icon         https://i.pinimg.com/originals/07/30/40/0730408ccb872a9caf0e54ab31a0c0d9.png
// @match        https://www.mangaupdates.com/lists/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      api.mangaupdates.com
// @connect      www.mangaupdates.com
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

    GM_addStyle(`
        #top-pagination-clone {
            padding: 5px 10px;
        }
        .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 8px;
            justify-content: center;
            padding: 10px;
        }
        .grid-item {
            display: flex;
            flex-direction: column;
            border: 2px solid var(--mu-border-color);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 190px;
            position: relative;
            transition: all 0.3s ease;
            background-color: var(--mu-background-color-main);
        }
        .grid-item.selected {
            outline: 2px solid var(--mu-text-color-highlight);
            outline-offset: -2px;
        }
        .cover-container {
            min-height: 250px;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
        }
        .info-container {
            background-color: var(--mu-background-color-dark);
            color: var(--mu-text-color);
            padding: 5px;
            height: 40px;
            text-align: center;
            margin-top: auto;
            cursor: pointer;
        }
        .title {
            font-weight: bold;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-size: 15px;
        }
        .title a {
            color: var(--mu-text-color);
            text-decoration: none;
        }
        .title a:hover {
            text-decoration: underline;
        }
        .grid-corner {
            position: absolute;
            width: 35px;
            height: 35px;
            background-color: rgb(from var(--mu-background-color-darker) r g b / .5);
            color: var(--mu-text-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            transition: background-color 0.2s;
            z-index: 1;
            line-height: 1.1;
            backdrop-filter: brightness(356%) blur(4px);
            border: 2px solid var(--mu-border-color);
        }
        .grid-corner:hover {
            background-color: rgb(from var(--mu-background-color-darker) r g b / .8);
        }
        .grid-corner.top-left {
            top: -2px;
            left: -2px;
            border-bottom-right-radius: 35px;
            flex-direction: column;
            padding: 3px 6px 6px 3px;
            gap: 1px;
        }
        .grid-corner.top-right {
            top: -2px;
            right: -2px;
            border-bottom-left-radius: 35px;
            padding: 0 0 5px 5px;
            font-size: 9px;
        }
        .corner-highlight {
            color: var(--mu-text-color-highlight);
        }
        .edit-container {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: var(--mu-background-color-dark);
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 10;
            height: 65px;
            box-sizing: border-box;
        }
        .edit-container label {
            color: var(--mu-text-color);
            font-weight: bold;
        }
        .edit-container input {
            width: 50px;
            text-align: center;
            background-color: var(--mu-background-color-main);
            color: var(--mu-text-color);
            border: none;
            border-radius: 3px;
            padding: 4px;
        }
        .edit-container button {
            padding: 4px 8px;
            cursor: pointer;
            border: none;
            background-color: var(--mu-background-color-main);
            color: var(--mu-text-color);
            border-radius: 3px;
            font-weight: bold;
            min-width: 28px;
        }
        .edit-container button:hover {
            background-color: var(--mu-background-color-highlight);
        }
    `);

    const updateCache = () => {
        const keys = Object.keys(cache);
        if (keys.length > config.CACHE_LIMIT) {
            const oldestKey = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)[0];
            delete cache[oldestKey];
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
                                cache[seriesId] = { imageUrl, timestamp: Date.now() };
                                updateCache();
                                resolve(imageUrl);
                            } else {
                                reject("Image URL not found");
                            }
                        } catch {
                            reject("Error parsing response");
                        }
                    } else if (status === 404) {
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

    const updateSeriesProgress = (seriesId, volume, chapter) => {
        return new Promise((resolve, reject) => {
            const payload = [{
                series: { id: parseInt(seriesId, 10) },
                status: {
                    volume: parseFloat(volume) || 0,
                    chapter: Math.floor(parseFloat(chapter) || 0),
                }
            }];
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://www.mangaupdates.com/api/v1/lists/series/update",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                data: JSON.stringify(payload),
                onload: ({ status, responseText }) => {
                    if (status >= 200 && status < 300) {
                        try { resolve(JSON.parse(responseText)); } catch (e) { reject('Failed to parse response'); }
                    } else { reject(`Error: ${status} - ${responseText}`); }
                },
                onerror: (error) => reject(error)
            });
        });
    };

    const updateSeriesRating = (seriesId, rating) => {
        return new Promise((resolve, reject) => {
            const isDelete = rating === null || rating === undefined || rating <= 0;
            const payload = isDelete ? undefined : JSON.stringify({ rating: parseInt(rating, 10) });

            GM_xmlhttpRequest({
                method: isDelete ? "DELETE" : "PUT",
                url: `https://www.mangaupdates.com/api/v1/series/${seriesId}/rating`,
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                data: payload,
                onload: ({ status, responseText }) => {
                    if (status >= 200 && status < 300) {
                        try { resolve(JSON.parse(responseText || '{}')); } catch (e) { resolve({}); }
                    } else { reject(`Error: ${status} - ${responseText}`); }
                },
                onerror: (error) => reject(error)
            });
        });
    };

    const getNumericValue = (text, isChapter = false) => {
        if (!text) return '';
        const match = text.match(/[\d\.]+/);
        if (match && match[0]) {
            let num = parseFloat(match[0]);
            if (!isNaN(num)) {
                return isChapter ? Math.floor(num).toString() : num.toString();
            }
        }
        return '';
    };

    const showInlineEditor = (gridItem, seriesId) => {
        if (gridItem.querySelector('.edit-container')) return;

        const infoContainer = gridItem.querySelector('.info-container');
        const topLeftCorner = gridItem.querySelector('.top-left');
        if (!topLeftCorner) return;

        const currentVcText = topLeftCorner.dataset.vcText || '';
        const initialVolume = getNumericValue(currentVcText.match(/v\.([\d\.]+)/i)?.[1]);
        const initialChapter = getNumericValue(currentVcText.match(/c\.([\d\.]+)/i)?.[1], true);

        if (infoContainer) infoContainer.style.visibility = 'hidden';
        topLeftCorner.style.visibility = 'hidden';

        const editor = document.createElement('div');
        editor.className = 'edit-container';
        editor.innerHTML = `
            <input type="number" class="volume-input" value="${initialVolume}" min="0" step="1">
            <input type="number" class="chapter-input" value="${initialChapter}" min="0" step="1">
            <button class="save-button" title="Save">✓</button>
            <button class="cancel-button" title="Cancel">✗</button>
        `;
        gridItem.appendChild(editor);

        const closeEditor = () => {
            editor.remove();
            if (infoContainer) infoContainer.style.visibility = 'visible';
            topLeftCorner.style.visibility = 'visible';
        };

        editor.querySelector('.cancel-button').addEventListener('click', closeEditor);
        editor.querySelector('.save-button').addEventListener('click', async (e) => {
            const saveButton = e.target;
            saveButton.textContent = '...';
            saveButton.disabled = true;
            const newVolume = editor.querySelector('.volume-input').value;
            const newChapter = editor.querySelector('.chapter-input').value;

            try {
                await updateSeriesProgress(seriesId, newVolume, newChapter);
                const parsedVolume = parseFloat(newVolume);
                const parsedChapter = Math.floor(parseFloat(newChapter));

                const cornerHighlightElement = topLeftCorner.querySelector('.corner-highlight');
                let cornerHTML = '';
                if (!isNaN(parsedChapter) && parsedChapter >= 0) {
                    cornerHTML += `<span class="corner-chapter">${parsedChapter}</span>`;
                }
                if (cornerHighlightElement) {
                    cornerHTML += cornerHighlightElement.outerHTML;
                }
                topLeftCorner.innerHTML = cornerHTML;

                const newVcParts = [];
                if (!isNaN(parsedVolume) && parsedVolume >= 0) newVcParts.push(`v.${parsedVolume}`);
                if (!isNaN(parsedChapter) && parsedChapter >= 0) newVcParts.push(`c.${parsedChapter}`);
                topLeftCorner.dataset.vcText = newVcParts.join(' / ');

                closeEditor();
            } catch (error) {
                console.error('Failed to update progress:', error);
                saveButton.textContent = 'Error';
                setTimeout(() => {
                    saveButton.textContent = '✓';
                    saveButton.disabled = false;
                }, 2000);
            }
        });
    };

    const showRatingEditor = (gridItem, seriesId) => {
        if (gridItem.querySelector('.edit-container')) return;

        const infoContainer = gridItem.querySelector('.info-container');
        const topRightCorner = gridItem.querySelector('.top-right');
        if (!topRightCorner) return;

        const initialRating = topRightCorner.dataset.userScore === 'Add' ? '' : topRightCorner.dataset.userScore || '';
        if (infoContainer) infoContainer.style.visibility = 'hidden';
        topRightCorner.style.visibility = 'hidden';

        const editor = document.createElement('div');
        editor.className = 'edit-container';
        editor.innerHTML = `
            <input type="number" class="rating-input" value="${initialRating}" min="1" max="10" step="1" placeholder="1-10">
            <button class="save-button" title="Save">✓</button>
            <button class="delete-button" title="Delete Rating">Del</button>
            <button class="cancel-button" title="Cancel">✗</button>
        `;
        gridItem.appendChild(editor);

        const ratingInput = editor.querySelector('.rating-input');
        ratingInput.focus();
        ratingInput.select();

        const closeEditor = () => {
            editor.remove();
            if (infoContainer) infoContainer.style.visibility = 'visible';
            topRightCorner.style.visibility = 'visible';
        };

        const updateCornerText = (newUserScore) => {
            const globalScore = topRightCorner.dataset.globalScore;
            const displayScore = newUserScore === 'Add' || !newUserScore ? 'Add' : newUserScore;
            topRightCorner.dataset.userScore = displayScore;

            if (globalScore && displayScore !== 'Add' && displayScore !== 'N/A') {
                topRightCorner.textContent = `${displayScore} / ${globalScore}`;
            } else {
                topRightCorner.textContent = displayScore !== 'Add' ? displayScore : (globalScore || 'Rate');
            }
        };

        editor.querySelector('.cancel-button').addEventListener('click', closeEditor);

        editor.querySelector('.save-button').addEventListener('click', async (e) => {
            const saveButton = e.target;
            const newRating = ratingInput.value;

            if (!newRating || newRating < 1 || newRating > 10) {
                 ratingInput.style.outline = '1px solid red';
                 setTimeout(() => { ratingInput.style.outline = 'none'; }, 1000);
                 return;
            }

            saveButton.textContent = '...';
            saveButton.disabled = true;

            try {
                await updateSeriesRating(seriesId, newRating);
                updateCornerText(newRating);
                closeEditor();
            } catch (error) {
                console.error('Failed to update rating:', error);
                saveButton.textContent = 'Error';
                setTimeout(() => {
                    saveButton.textContent = '✓';
                    saveButton.disabled = false;
                }, 2000);
            }
        });

        editor.querySelector('.delete-button').addEventListener('click', async (e) => {
            const deleteButton = e.target;
            deleteButton.textContent = '...';
            deleteButton.disabled = true;

            try {
                await updateSeriesRating(seriesId, null);
                updateCornerText('Add');
                closeEditor();
            } catch (error) {
                console.error('Failed to delete rating:', error);
                deleteButton.textContent = 'Error';
                setTimeout(() => {
                    deleteButton.textContent = 'Del';
                    deleteButton.disabled = false;
                }, 2000);
            }
        });
    };


    const processNextInQueue = () => {
        while (loadQueue.length > 0 && activeRequests < config.MAX_CONCURRENT_REQUESTS) {
            const gridItem = loadQueue.shift();
            if (gridItem) {
                const seriesId = gridItem.dataset.seriesId;
                const coverContainer = gridItem.querySelector('.cover-container');

                if (cache[seriesId]?.imageUrl) {
                    coverContainer.style.backgroundImage = `url(${cache[seriesId].imageUrl})`;
                } else {
                    activeRequests++;
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
            }
        }
    };

    const addToLoadQueue = (gridItem) => {
        if (!loadQueue.includes(gridItem)) {
            loadQueue.push(gridItem);
        }
        processNextInQueue();
    };

    const createGridItem = (row) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';

        const link = row.querySelector('a[href*="/series/"]');
        if (!link) return null;

        const checkbox = row.querySelector('input[type="checkbox"]');
        const seriesId = extractSeriesIdFromUrl(link.href);
        if (isNaN(seriesId)) return null;
        gridItem.dataset.seriesId = seriesId;

        const latestChapterElement = row.querySelector('.series-list-item_newlist__neJYV');
        const latestChapterText = latestChapterElement ? latestChapterElement.textContent : '';
        const unreadMatch = latestChapterText.match(/\d+/);
        const unreadCount = unreadMatch ? unreadMatch[0] : '';

        const pencilLink = row.querySelector('.bi-pencil-square')?.closest('a');
        if (pencilLink) {
            const vcContainer = row.querySelector('.series-list-item_lcol4__c1wPK .d-inline:not(.pe-2)');
            if (vcContainer) {
                const vcClone = vcContainer.cloneNode(true);
                vcClone.querySelectorAll('a[title*="+"], a[title*="-"]').forEach(el => el.remove());
                const vcParts = Array.from(vcClone.querySelectorAll('a')).map(a => a.textContent.trim());

                if (vcParts.length > 0) {
                    const topLeftCorner = document.createElement('div');
                    topLeftCorner.className = 'grid-corner top-left';
                    topLeftCorner.title = 'Edit Volume/Chapter';

                    const vcText = vcParts.join(' / ');
                    topLeftCorner.dataset.vcText = vcText;
                    const chapter = getNumericValue(vcText.match(/c\.([\d\.]+)/i)?.[1], true);

                    let cornerHTML = '';
                    if (chapter) cornerHTML += `<span class="corner-chapter">${chapter}</span>`;
                    if (unreadCount) cornerHTML += `<span class="corner-highlight">${unreadCount}</span>`;

                    topLeftCorner.innerHTML = cornerHTML;
                    topLeftCorner.addEventListener('click', () => {
                        showInlineEditor(gridItem, seriesId);
                    });
                    gridItem.appendChild(topLeftCorner);
                }
            }
        }

        const ratingLink = row.querySelector('a[title="Update rating"]');
        if (ratingLink) {
            const ratingContainer = ratingLink.closest('div');
            const scoreElement = ratingContainer?.nextElementSibling;
            const userScore = ratingLink.textContent.trim();
            const globalScore = scoreElement?.textContent.trim();

            const topRightCorner = document.createElement('div');
            topRightCorner.className = 'grid-corner top-right';

            topRightCorner.dataset.userScore = userScore;
            if (globalScore) topRightCorner.dataset.globalScore = globalScore;

            if (globalScore && userScore !== 'Add' && userScore !== 'N/A') {
                topRightCorner.textContent = `${userScore} / ${globalScore}`;
            } else {
                topRightCorner.textContent = userScore !== 'Add' ? userScore : (globalScore || 'Rate');
            }

            topRightCorner.title = 'Update Rating';
            topRightCorner.addEventListener('click', () => showRatingEditor(gridItem, seriesId));
            gridItem.appendChild(topRightCorner);
        }

        const coverLink = document.createElement('a');
        coverLink.href = link.href;
        coverLink.target = '_blank';
        const coverContainer = document.createElement('div');
        coverContainer.className = 'cover-container';
        coverLink.appendChild(coverContainer);
        gridItem.appendChild(coverLink);

        const infoContainer = document.createElement('div');
        infoContainer.className = 'info-container';

        const title = link.textContent.trim();
        infoContainer.innerHTML = `<div class="title"><a href="${link.href}" target="_blank">${title}</a></div>`;
        gridItem.appendChild(infoContainer);

        if (checkbox) {
            infoContainer.addEventListener('click', (event) => {
                if (!event.target.closest('a')) {
                    checkbox.click();
                }
            });

            const syncSelectionState = () => {
                gridItem.classList.toggle('selected', checkbox.checked);
            };
            checkbox.addEventListener('change', syncSelectionState);
            syncSelectionState();
        }

        return gridItem;
    };

    const addTopPagination = (gridContainer) => {
        if (document.getElementById('top-pagination-clone')) return;
        const bottomPagination = document.querySelector('.page-numbers_current_page__Ct_yX')?.closest('.p-1.col-12.pb-3');
        if (!bottomPagination) return;

        const topPaginationClone = bottomPagination.cloneNode(true);
        topPaginationClone.id = 'top-pagination-clone';
        gridContainer.parentElement.insertBefore(topPaginationClone, gridContainer);
    };

    const createOrUpdateGridView = () => {
        const listContainer = document.querySelector('.series-list-table_list_table__H2pQ5');
        if (!listContainer) return;

        const firstLink = listContainer.querySelector('a[href*="/series/"]');
        if (!firstLink) return;

        const contentIdentifier = firstLink.href;
        const existingGrid = listContainer.parentElement.querySelector('.grid-container');
        if (existingGrid && existingGrid.dataset.contentIdentifier === contentIdentifier) {
            return;
        }

        if (existingGrid) existingGrid.remove();
        const oldTopPagination = document.getElementById('top-pagination-clone');
        if (oldTopPagination) oldTopPagination.remove();

        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';
        gridContainer.dataset.contentIdentifier = contentIdentifier;

        const rows = listContainer.querySelectorAll('.row');
        rows.forEach(row => {
            const gridItem = createGridItem(row);
            if (gridItem) {
                gridContainer.appendChild(gridItem);
            }
        });

        listContainer.style.display = 'none';
        listContainer.parentElement.insertBefore(gridContainer, listContainer);

        addTopPagination(gridContainer);

        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    addToLoadQueue(entry.target);
                    intersectionObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '500px' });

        gridContainer.querySelectorAll('.grid-item').forEach(item => {
            intersectionObserver.observe(item);
        });
    };

    const mutationObserver = new MutationObserver(() => {
        createOrUpdateGridView();
    });

    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    createOrUpdateGridView();
})();
