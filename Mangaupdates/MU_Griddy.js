// ==UserScript==
// @name         MangaUpdates Grid View
// @namespace    http://tampermonkey.net/
// @version      4.8
// @description  MangaUpdates grid view with expand/collapse functionality and additional series details
// @author       Reibies
// @icon         https://www.mangaupdates.com/favicon.ico
// @match        https://www.mangaupdates.com/mylist.html*
// @match        https://www.mangaupdates.com/author/*
// @match        https://www.mangaupdates.com/lists/*
// @grant        GM_xmlhttpRequest
// @connect      api.mangaupdates.com
// ==/UserScript==

(function () {
    'use strict';

    const config = {
        RETRY_LIMIT: 3,
        MAX_CONCURRENT_REQUESTS: 4,
        BASE_URL: 'https://api.mangaupdates.com/v1/series/',
        CACHE_LIMIT: 5000, //Covers cached, it's about 60MB full
        RETRY_BASE_DELAY: 1000,
        PLACEHOLDER_IMAGE_URL: "https://placeholder.pics/svg/150x230/d0d8e2/52667c/[No%20Cover]",
    };

    let cache = JSON.parse(localStorage.getItem('mangaUpdatesCoverCache')) || {};
    const loadQueue = [];
    let activeRequests = 0;

    const updateCache = () => {
        const keys = Object.keys(cache);
        if (keys.length > config.CACHE_LIMIT) {
            delete cache[keys[0]];
        }
        localStorage.setItem('mangaUpdatesCoverCache', JSON.stringify(cache));
    };

    const style = document.createElement('style');
    style.textContent = `
        .grid-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; justify-content: center; }
        .grid-item { display: flex; flex-direction: column; border: 1px solid #ccc; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 230px; position: relative; transition: all 0.3s ease; }
        .cover-container { min-height: 250px; background-size: contain; background-position: center; background-repeat: no-repeat; transition: min-height 0.3s ease; }
        .info-container { background-color: #e0e0e0; padding: 5px; height: 65px; text-align: center; margin-top: auto; transition: height 0.3s ease; }
        .title {font-weight: bold; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; transition: all 0.3s ease;}
        .expanded .title {-webkit-line-clamp: 4}
        .volume-chapter, .custom-rating, .average, .checkbox-container { margin-top: 10px; }
        .checkbox-container input { margin-right: 5px; }
        .controls-container, .custom-rating { display: flex; flex-direction: column; align-items: center; margin: 5px; }
        .toggle-btn { cursor: pointer; }
        .extra-info { display: none; }
        .expanded .info-container { height: 315px; }
        .expanded .cover-container { min-height: 0px; }
        .expanded .extra-info { display: block; }
    `;
    document.head.appendChild(style);

    const listContainer = document.getElementById('list_table');
    if (!listContainer) return;

    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';
    listContainer.parentElement.replaceChild(gridContainer, listContainer);

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
                    setTimeout(() => fetchCoverImage(seriesId, retryCount + 1).then(resolve).catch(reject), config.RETRY_BASE_DELAY * 2 ** retryCount);
                } else {
                    reject(`Error: ${status}`);
                }
            },
            onerror: () => reject("Unable to fetch image"),
        });
    });
};

const loadCoverImageInView = gridItem => {
    const coverContainer = gridItem.querySelector('.cover-container');
    const seriesId = gridItem.dataset.seriesId;

    if (cache[seriesId] && cache[seriesId].imageUrl) {
        const imageUrl = cache[seriesId].imageUrl;

        const img = new Image();
        img.onload = () => {
            coverContainer.style.backgroundImage = `url(${imageUrl})`;
            coverContainer.classList.add('loaded');
        };
        img.onerror = () => {
            console.warn(`Cached image failed to load for series ID ${seriesId}. Attempting to refetch.`);
            delete cache[seriesId];
            updateCache();
            refetchCoverImage(seriesId, coverContainer);
        };
        img.src = imageUrl;
    } else {
        refetchCoverImage(seriesId, coverContainer);
    }
};

const refetchCoverImage = (seriesId, coverContainer) => {
    fetchCoverImage(seriesId).then(imageUrl => {
        coverContainer.style.backgroundImage = `url(${imageUrl})`;
        coverContainer.classList.add('loaded');
    }).catch(() => handleCoverImageError(seriesId)).finally(() => {
        activeRequests--;
        processNextInQueue();
    });
};

const handleCoverImageError = seriesId => {
    const coverContainer = gridContainer.querySelector(`.cover-container[data-series-id="${seriesId}"]`);
    if (coverContainer) {
        coverContainer.style.backgroundImage = `url(${config.PLACEHOLDER_IMAGE_URL})`;
        coverContainer.classList.add('loaded');
        delete cache[seriesId];
        updateCache();
    }
};

    const processNextInQueue = () => {
        if (loadQueue.length && activeRequests < config.MAX_CONCURRENT_REQUESTS) {
            loadCoverImageInView(loadQueue.shift().gridItem);
        }
    };

    const createInfoContainer = (seriesInfo, status, rating, average, seriesId) => {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'info-container';

        let latestChapter = '';
        let currentChapter = '';

        if (seriesInfo) {
            const title = seriesInfo.querySelector('a');
            const latestChapterLink = seriesInfo.querySelector('span.newlist a');
            if (latestChapterLink) {
                latestChapter = latestChapterLink.textContent.replace(/[^\d]/g, ''); // Extract the chapter number
            }
        }

        if (status) {
            const currentChapterLink = status.querySelector('a[href*="incrementChapter2"]');
            if (currentChapterLink) {
                currentChapter = currentChapterLink.textContent.replace(/[^\d]/g, ''); // Extract the chapter number
            }
        }

        const chapterInfo = latestChapter && currentChapter ? `${currentChapter}/${latestChapter}` : '';

        if (seriesInfo) {
            const title = seriesInfo.querySelector('a');
            infoContainer.innerHTML = `
            <div class="title"><a href="${title.href}">${title.textContent}</a></div>
            <div>${chapterInfo}</div>
        `;
        }

        const extraInfoContainer = document.createElement('div');
        extraInfoContainer.className = 'extra-info';

        // Add checkbox element
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        checkboxContainer.innerHTML = `
        <input type="checkbox" id="${seriesId}" name="DELETE[${seriesId}]" value="1">
    `;
        extraInfoContainer.appendChild(checkboxContainer);

        if (status) {
            const volumeChapter = document.createElement('div');
            volumeChapter.className = 'volume-chapter';
            volumeChapter.id = status.id;
            volumeChapter.innerHTML = status.innerHTML;
            extraInfoContainer.appendChild(volumeChapter);
        }

        // Add custom rating element
        if (rating) {
            const customRatingElement = document.createElement('div');
            customRatingElement.className = 'custom-rating';
            customRatingElement.innerHTML = `
            <div id="k${seriesId}" class="p-1 col-md-1 d-none d-md-block text-center text">
            <a href="javascript:mu.lists.addRating(${seriesId})" title="Add Rating"><u>${rating}</u></a>
            </div>
        `;
            extraInfoContainer.appendChild(customRatingElement);
        }

        // Add average element
        if (average) {
            const averageElement = document.createElement('div');
            averageElement.className = 'average';
            averageElement.innerHTML = `Average: ${average}`;
            extraInfoContainer.appendChild(averageElement);
        }

        infoContainer.appendChild(extraInfoContainer);

        return infoContainer;
    };

    const createControlsContainer = () => {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-container';
        controlsContainer.innerHTML = `<span class="toggle-btn">⚙️</span>`;
        return controlsContainer;
    };

    const convertRowToGridItem = row => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item collapsed';
        const seriesId = extractSeriesIdFromUrl(row.querySelector('a').href);
        gridItem.dataset.seriesId = seriesId;

        const coverLink = document.createElement('a');
        coverLink.href = row.querySelector('a').href;
        coverLink.target = '_blank';

        const coverContainer = document.createElement('div');
        coverContainer.className = 'cover-container';
        coverLink.appendChild(coverContainer);

        gridItem.appendChild(coverLink);

        const seriesInfo = row.querySelector('div:nth-child(2)');
        const status = row.querySelector('div[id^="s"]');
        const ratingElement = row.querySelector('div[id^="k"]');
        const rating = ratingElement ? ratingElement.textContent.trim() : '';
        const average = ratingElement ? ratingElement.nextElementSibling?.textContent.trim() : '';

        gridItem.appendChild(createInfoContainer(seriesInfo, status, rating, average, seriesId));
        gridItem.appendChild(createControlsContainer());

        gridContainer.appendChild(gridItem);
        gridItem.querySelector('.toggle-btn').addEventListener('click', () => toggleExpandCollapse(gridItem));
        loadQueue.push({ gridItem });
    };

    const toggleExpandCollapse = gridItem => {
        gridItem.classList.toggle('expanded');
        gridItem.classList.toggle('collapsed');
    };

    const lazyLoadObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadCoverImageInView(entry.target);
            }
        });
    }, { rootMargin: '0px', threshold: 0.25 });

    const initializeGrid = () => {
        gridContainer.innerHTML = '';
        loadQueue.length = 0;
        listContainer.querySelectorAll('.lrow').forEach(convertRowToGridItem);
        gridContainer.querySelectorAll('.grid-item').forEach(item => {
            lazyLoadObserver.observe(item);
            if (item.getBoundingClientRect().top < window.innerHeight) {
                loadCoverImageInView(item);
            }
        });
    };

    initializeGrid();
    new MutationObserver(initializeGrid).observe(listContainer, { childList: true, subtree: true });

    setTimeout(() => {
        gridContainer.querySelectorAll('.grid-item').forEach(item => {
            if (item.getBoundingClientRect().top < window.innerHeight) {
                loadCoverImageInView(item);
            }
        });
    }, 1000);
})();
