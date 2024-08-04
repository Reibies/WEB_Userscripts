// ==UserScript==
// @name         MangaUpdates Cover Image Preview
// @namespace    http://tampermonkey.net/
// @version      1.16
// @description  Show cover image on hover over MangaUpdates series link with dynamic countdown and caching
// @author       Reibies
// @match        https://www.mangaupdates.com/*
// @icon         https://www.mangaupdates.com/favicon.ico
// @grant        GM_xmlhttpRequest
// @connect      api.mangaupdates.com
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    let cooldown = {};
    const COOLDOWN_TIME = 1000; // 1 seconds cooldown
    let cache = {}; // Cache object

    function base36ToDecimal(base36) {
        return parseInt(base36, 36);
    }

    function fetchCoverImage(seriesId, callback) {
        if (cache[seriesId]) {
            // Use cached image
            return callback(null, cache[seriesId]);
        }

        if (cooldown[seriesId]) {
            const remainingTime = Math.ceil((cooldown[seriesId] - Date.now()) / 1000);
            return callback(`Cooling down for ${remainingTime} seconds.`);
        }

        cooldown[seriesId] = Date.now() + COOLDOWN_TIME;
        setTimeout(() => delete cooldown[seriesId], COOLDOWN_TIME);

        GM_xmlhttpRequest({
            method: "GET",
            url: `https://api.mangaupdates.com/v1/series/${seriesId}`,
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        const data = JSON.parse(response.responseText);
                        const imageUrl = data.image.url.original;
                        cache[seriesId] = imageUrl; // Cache the image URL
                        callback(null, imageUrl);
                    } catch (e) {
                        callback("Error parsing response");
                    }
                } else {
                    callback(`Error: ${response.status}`);
                }
            },
            onerror: function() {
                callback("Unable to fetch image");
            }
        });
    }

    function extractSeriesIdFromUrl(url) {
        const base36EncodedId = url.split('/')[4]; // Extract base 36 encoded ID from URL
        return base36ToDecimal(base36EncodedId);
    }

    function showPreviewImage(event) {
        const linkElement = $(this);
        const url = linkElement.attr('href');

        // Exclude URLs with '?act='
        if (url.includes('?act=')) {
            return;
        }

        const seriesId = extractSeriesIdFromUrl(url);

        if (!seriesId) {
            return;
        }

        let preview = $('#preview-image');
        if (preview.length === 0) {
            preview = $('<div id="preview-image"></div>').css({
                'position': 'absolute',
                'z-index': 1000,
                'border': '1px solid #ccc',
                'background': '#fff',
                'padding': '5px',
                'max-width': '200px',
                'max-height': '300px',
                'display': 'none',
                'box-shadow': '0 0 10px rgba(0, 0, 0, 0.5)',
                'border-radius': '5px'
            });
            $('body').append(preview);
        }

        function updatePreview(content) {
            preview.html(content);
            preview.css({
                'top': event.pageY + 10 + 'px',
                'left': event.pageX + 10 + 'px',
                'display': 'block'
            });
        }

        function refreshCountdown() {
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
                clearInterval(linkElement.data('countdownInterval')); // Clear interval after refresh
            }
        }

        // Clear any existing interval
        if (linkElement.data('countdownInterval')) {
            clearInterval(linkElement.data('countdownInterval'));
        }

        // Start countdown
        linkElement.data('countdownInterval', setInterval(refreshCountdown, 1000));

        // Initial refresh
        refreshCountdown();

        $(this).on('mousemove', function(e) {
            preview.css({
                'top': e.pageY + 10 + 'px',
                'left': e.pageX + 10 + 'px'
            });
        });
    }

    function hidePreviewImage() {
        $('#preview-image').hide();
        $(this).off('mousemove');

        // Clear countdown interval when hiding
        clearInterval($(this).data('countdownInterval'));
    }

    $(document).ready(function() {
        // Use a more general selector to cover all series links
        $('body').on('mouseenter', 'a[href^="https://www.mangaupdates.com/series/"]', function(event) {
            showPreviewImage.call(this, event);
        });

        $('body').on('mouseleave', 'a[href^="https://www.mangaupdates.com/series/"]', hidePreviewImage);
    });
})();
