// ==UserScript==
// @name         MangaUpdates Hover Preview
// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_hover_cover.user.js
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_hover_cover.user.js
// @version      1.5
// @description  Show cover image on hover over MangaUpdates series link, now with edge detection and optimizations.
// @match        https://www.mangaupdates.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mangaupdates.com
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
    let previewElement = null;

    const updateCache = () => {
        const keys = Object.keys(cache);
        if (keys.length > config.CACHE_LIMIT) {
            delete cache[keys[0]];
        }
        localStorage.setItem('mangaUpdatesCoverCache', JSON.stringify(cache));
    };

    const fetchCoverImage = (seriesId, callback, retryCount = 0) => {
        if (cache[seriesId]) {
            return callback(null, cache[seriesId].url);
        }

        if (cooldown[seriesId]) return;

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
                        callback(null, imageUrl);
                    } catch (e) {
                        callback("Error parsing response");
                    }
                } else if (response.status === 404) {
                    cache[seriesId] = { url: config.PLACEHOLDER_IMAGE_URL, timestamp: Date.now() };
                    updateCache();
                    callback(null, config.PLACEHOLDER_IMAGE_URL);
                } else if (response.status >= 500 && retryCount < config.RETRY_LIMIT) {
                    setTimeout(() => fetchCoverImage(seriesId, callback, retryCount + 1), config.RETRY_DELAY);
                } else {
                    callback(`API Error: ${response.status}`);
                }
            },
            onerror: () => callback("Network error"),
        });
    };

    const createPreviewElement = () => {
        if (previewElement && previewElement.length) return previewElement;
        previewElement = $('<div id="preview-image"></div>').css({
            position: 'absolute',
            zIndex: 1000,
            border: '1px solid #ccc',
            background: '#fff',
            padding: '5px',
            display: 'none',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
            borderRadius: '5px',
        }).appendTo('body');
        return previewElement;
    };

    const positionPreview = (event) => {
        if (!previewElement || previewElement.is(':hidden')) return;

        const offset = 15;
        const viewportWidth = $(window).width();
        const viewportHeight = $(window).height();
        const scrollX = $(window).scrollLeft();
        const scrollY = $(window).scrollTop();

        let top = event.pageY + offset;
        let left = event.pageX + offset;

        const previewWidth = previewElement.outerWidth();
        const previewHeight = previewElement.outerHeight();

        if (left + previewWidth > scrollX + viewportWidth) {
            left = event.pageX - previewWidth - offset;
        }

        if (top + previewHeight > scrollY + viewportHeight) {
            top = event.pageY - previewHeight - offset;
        }

        previewElement.css({ top: `${top}px`, left: `${left}px` });
    };

    const updatePreviewContent = (htmlContent, event) => {
        const preview = createPreviewElement();
        preview.html(htmlContent).show();
        positionPreview(event);
    };

    const showPreviewImage = function(event) {
        const linkElement = $(this);
        const url = linkElement.attr('href');

        if (!url || url.includes('?act=')) return;

        const seriesId = extractSeriesIdFromUrl(url);
        if (!seriesId) return;

        currentPreviewLink = this;

        if (cooldown[seriesId]) {
            const remainingTime = Math.ceil((cooldown[seriesId] - Date.now()) / 1000);
            const message = `<div style="padding: 10px; text-align: center;"><span>⚠️ Cooling down for ${remainingTime}s</span></div>`;
            updatePreviewContent(message, event);
            return;
        }

        const loadingMessage = `<div style="padding: 10px; text-align: center;"><span>Loading...</span></div>`;
        updatePreviewContent(loadingMessage, event);

        fetchCoverImage(seriesId, (error, imageUrl) => {
            if (this !== currentPreviewLink) return;

            let content;
            if (error) {
                content = `<div style="padding: 10px; text-align: center;"><span>⚠️ ${error}</span></div>`;
            } else {
                content = `<img src="${imageUrl}" alt="Cover Image" style="display: block; max-width: 200px; max-height: 300px; border-radius: 3px;">`;
            }
            updatePreviewContent(content, event);
        });

        linkElement.on('mousemove.preview', (e) => positionPreview(e));
    };

    const hidePreviewImage = function() {
        if (previewElement) {
            previewElement.hide().empty();
        }
        if (currentPreviewLink) {
            $(currentPreviewLink).off('mousemove.preview');
            currentPreviewLink = null;
        }
    };

    const originalPushState = history.pushState;
    history.pushState = function(...args) {
        hidePreviewImage();
        originalPushState.apply(this, args);
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
        hidePreviewImage();
        originalReplaceState.apply(this, args);
    };
    window.addEventListener('popstate', hidePreviewImage);
    $(document).on('click', hidePreviewImage);

    const extractSeriesIdFromUrl = (url) => {
        try {
            const base36EncodedId = url.split('/series/')[1].split('/')[0];
            return parseInt(base36EncodedId, 36);
        } catch (e) {
            return null;
        }
    };

    $(document).ready(() => {
        const seriesLinkSelector = 'a[href^="https://www.mangaupdates.com/series/"]:not([href*="/-edit/"])';

        $('body').on('mouseenter', seriesLinkSelector, function(event) {
            if ($(this).closest('.grid-item').length) {
                return;
            }
            showPreviewImage.call(this, event);
        });

        $('body').on('mouseleave', seriesLinkSelector, hidePreviewImage);
    });
})();
