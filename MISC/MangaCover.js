// ==UserScript==
// @name         MangaUpdates Cover Image Preview
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  Show cover image on hover over MangaUpdates series link with dynamic countdown
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
    const COOLDOWN_TIME = 5000; // 5 seconds cooldown

    function fetchCoverImage(seriesId, callback) {
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
                    const data = JSON.parse(response.responseText);
                    callback(null, data.image.url.original);
                } else {
                    callback("Unable to fetch image");
                }
            },
            onerror: function() {
                callback("Unable to fetch image");
            }
        });
    }

    function extractSeriesIdFromDiv(element) {
        const parentDiv = $(element).closest('div[id^="r"]');
        const idMatch = parentDiv.attr('id').match(/^r(\d+)$/);
        return idMatch ? idMatch[1] : null;
    }

    function showPreviewImage(event) {
        const linkElement = $(this);
        const seriesId = extractSeriesIdFromDiv(linkElement);

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
        $('body').on('mouseenter', 'a[title="Series Info"]', function(event) {
            showPreviewImage.call(this, event);
        });

        $('body').on('mouseleave', 'a[title="Series Info"]', hidePreviewImage);
    });
})();
