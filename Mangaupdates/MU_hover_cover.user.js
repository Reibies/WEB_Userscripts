// ==UserScript==
// @name         MangaUpdates Hover Preview

// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://github.com/Reibies/WEB_Userscripts/raw/refs/head/master/Mangaupdates/MU_hover_cover.user.js
// @version      1.21

// @description  Show cover image on hover over MangaUpdates series link
// @match        https://www.mangaupdates.com/*
// @icon         https://www.mangaupdates.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @connect      api.mangaupdates.com
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        COOLDOWN_TIME: 1000,
        RETRY_LIMIT: 3,
        RETRY_DELAY: 3000,
        CACHE_LIMIT: 1000,
        BASE_URL: 'https://api.mangaupdates.com/v1/series/',
        PLACEHOLDER_IMAGE_URL: "https://placeholder.pics/svg/150x230/d0d8e2/52667c/[No%20Cover]",
    };

    let cache = JSON.parse(localStorage.getItem('mangaUpdatesCoverCache')) || {};
    const cooldown = {};
    let currentPreviewLink = null;

    const updateCache = () => {
        const keys = Object.keys(cache);
        if (keys.length > config.CACHE_LIMIT) {
            delete cache[keys[0]];
        }
        localStorage.setItem('mangaUpdatesCoverCache', JSON.stringify(cache));
    };

    const fetchCoverImage = (seriesId, callback, retryCount = 0) => {
        if (cache[seriesId] && (Date.now() - cache[seriesId].timestamp < config.COOLDOWN_TIME)) {
            return callback(null, cache[seriesId].url);
        }

        if (cooldown[seriesId]) {
            const remainingTime = Math.ceil((cooldown[seriesId] - Date.now()) / 1000);
            return callback(`Cooling down for ${remainingTime} seconds.`);
        }

        cooldown[seriesId] = Date.now() + config.COOLDOWN_TIME;
        setTimeout(() => delete cooldown[seriesId], config.COOLDOWN_TIME);

        GM_xmlhttpRequest({
            method: "GET",
            url: `${config.BASE_URL}${seriesId}`,
            onload: (response) => {
                if (response.status === 200) {
                    try {
                        const { image } = JSON.parse(response.responseText);
                        const imageUrl = image?.url?.original || config.PLACEHOLDER_IMAGE_URL;
                        cache[seriesId] = { url: imageUrl, timestamp: Date.now() };
                        updateCache();
                        return callback(null, imageUrl);
                    } catch (e) {
                        return callback("Error parsing response");
                    }
                } else if (response.status === 404) {
                    cache[seriesId] = { url: config.PLACEHOLDER_IMAGE_URL, timestamp: Date.now() };
                    updateCache();
                    return callback("Image not found");
                } else if (response.status >= 500 && retryCount < config.RETRY_LIMIT) {
                    setTimeout(() => fetchCoverImage(seriesId, callback, retryCount + 1), config.RETRY_DELAY);
                } else {
                    return callback(`Error: ${response.status}`);
                }
            },
            onerror: () => callback("Unable to fetch image"),
        });
    };

    const createPreviewElement = () => {
        let preview = $('#preview-image');
        if (preview.length === 0) {
            preview = $('<div id="preview-image"></div>').css({
                position: 'absolute',
                zIndex: 1000,
                border: '1px solid #ccc',
                background: '#fff',
                padding: '5px',
                maxWidth: '200px',
                maxHeight: '300px',
                display: 'none',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
                borderRadius: '5px',
            });
            $('body').append(preview);
        }
        return preview;
    };

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const cleanupPreview = () => {
        const preview = $('#preview-image');
        if (preview.length) {
            preview.hide();
            if (currentPreviewLink) {
                $(currentPreviewLink).off('mousemove');
                clearInterval($(currentPreviewLink).data('countdownInterval'));
                currentPreviewLink = null;
            }
        }
    };

    const showPreviewImage = function(event) {
        const linkElement = $(this);
        const url = linkElement.attr('href');

        if (url.includes('?act=')) return;

        currentPreviewLink = this;
        const seriesId = extractSeriesIdFromUrl(url);

        if (!seriesId) return;

        const preview = createPreviewElement();

        const updatePreview = (content) => {
            preview.html(content).css({
                top: `${event.pageY + 10}px`,
                left: `${event.pageX + 10}px`,
                display: 'block'
            });
        };

      const refreshCountdown = () => {
    const remainingTime = Math.ceil((cooldown[seriesId] - Date.now()) / 1000);
    if (remainingTime > 0) {
        updatePreview(`<div style="width: 200px; height: 300px; display: flex; justify-content: center; align-items: center;"><span>⚠️ Cooling down for ${remainingTime} seconds</span></div>`);
    } else {
        fetchCoverImage(seriesId, (err, imageUrl) => {
            if (err || !imageUrl) {
                updatePreview(`<div style="width: 200px; height: 300px; display: flex; justify-content: center; align-items: center;"><span>⚠️ ${err}</span></div>`);
            } else {
                updatePreview(`<img src="${imageUrl}" alt="Cover Image" style="max-width: 100%; max-height: 100%;">`);
            }
        });
        clearInterval(linkElement.data('countdownInterval'));
    }
};

        if (linkElement.data('countdownInterval')) {
            clearInterval(linkElement.data('countdownInterval'));
        }

linkElement.data('countdownInterval', setInterval(refreshCountdown, 1000));
refreshCountdown();

        $(this).on('mousemove', debounce((e) => {
            preview.css({
                top: `${e.pageY + 10}px`,
                left: `${e.pageX + 10}px`
            });
        }, 10));
    };

    const hidePreviewImage = function() {
        cleanupPreview();
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        cleanupPreview();
    };

    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        cleanupPreview();
    };

    window.addEventListener('popstate', cleanupPreview);

    $(document).ready(() => {
        $(document).on('click', cleanupPreview);

        $('body').on('mouseenter', 'a[href^="https://www.mangaupdates.com/series/"]', function(event) {
            showPreviewImage.call(this, event);
        });

        $('body').on('mouseleave', 'a[href^="https://www.mangaupdates.com/series/"]', hidePreviewImage);
    });

    const extractSeriesIdFromUrl = (url) => {
        const base36EncodedId = url.split('/')[4];
        return parseInt(base36EncodedId, 36);
    };
})();
