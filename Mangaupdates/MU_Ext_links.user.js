// ==UserScript==
// @name           Mangaupdates External Links
// @author         Reibies
// @namespace      https://github.com/Reibies
// @downloadURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_Ext_links.user.js
// @updateURL      https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_Ext_links.user.js
// @version        3.1
// @match          https://www.mangaupdates.com/*
// @icon           https://www.google.com/s2/favicons?sz=64&domain=mangaupdates.com
// @description    Adds external links directly below the "Description" header on MU's series info page.
// @grant          GM.xmlHttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const faviconCache = new Map();

    function getFaviconAsBase64(url) {
        if (faviconCache.has(url)) {
            return Promise.resolve(faviconCache.get(url));
        }

        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64data = reader.result;
                            faviconCache.set(url, base64data);
                            resolve(base64data);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(response.response);
                    } else {
                        reject(new Error(`HTTP error! status: ${response.status}`));
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    function getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
        } catch (e) {
            return '';
        }
    }

    const linkStyles = {
        preset: {
            bgColor: 'var(--mu-light-bubble-light)',
            hoverColor: 'var(--mu-background-color-dark)',
            color: 'var(--mu-text-color)',
            borderColor: 'var(--mu-border-color)'
        },
        extracted: {
            bgColor: 'var(--mu-light-bubble-dark)',
            hoverColor: 'var(--mu-background-color-darker)',
            color: 'var(--mu-text-color-dull)',
            borderColor: 'none'
        }
    };

    function createStyledLink(href, text, style) {
        const link = document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.cssText = `
            display: inline-flex;
            align-items: center;
            margin: 3px;
            padding: 4px 8px;
            border: 1px solid ${style.borderColor};
            border-radius: 4px;
            background-color: ${style.bgColor};
            color: ${style.color};
            text-decoration: none;
            font-size: 14px;
            transition: background-color 0.2s;
        `;

        const icon = document.createElement('img');
        icon.style.cssText = 'width: 16px; height: 16px; margin-right: 6px; visibility: hidden;';
        link.prepend(icon);

        const faviconServiceUrl = getFaviconUrl(href);
        if (faviconServiceUrl) {
            getFaviconAsBase64(faviconServiceUrl)
                .then(dataUrl => {
                    icon.src = dataUrl;
                    icon.style.visibility = 'visible';
                })
                .catch(error => {
                    console.error('Favicon load failed:', href, error);
                });
        }

        link.appendChild(document.createTextNode(text));
        link.addEventListener('mouseover', () => link.style.backgroundColor = style.hoverColor);
        link.addEventListener('mouseout', () => link.style.backgroundColor = style.bgColor);
        return link;
    }

    function addExternalLinks() {
        if (document.querySelector('.mu-external-links-container')) {
            return;
        }

        const titleElement = document.querySelector(".releasestitle.tabletitle");
        const descriptionHeader = document.querySelector('[data-cy="info-box-description-header"]');
        const descriptionContent = document.querySelector('[data-cy="info-box-description"]');

        if (!titleElement || !descriptionHeader || !descriptionContent) {
            return;
        }

        const title = encodeURIComponent(titleElement.innerText.trim());
        const presetPages = [
            { name: "MangaDex", url: `https://mangadex.org/search?q=${title}` },
            { name: "Batoto", url: `https://batotoo.com/search?word=${title}` }
        ];

        const linksContainer = document.createElement('div');
        linksContainer.className = "sContent mu-external-links-container";

        const addedUrls = new Set();
        const fragment = document.createDocumentFragment();

        presetPages.forEach(({ name, url }) => {
            if (!addedUrls.has(url)) {
                const link = createStyledLink(url, name, linkStyles.preset);
                fragment.appendChild(link);
                addedUrls.add(url);
            }
        });

        descriptionContent.querySelectorAll('a[href^="http"]').forEach(existingLink => {
            if (!addedUrls.has(existingLink.href)) {
                const link = createStyledLink(existingLink.href, existingLink.innerText.trim(), linkStyles.extracted);
                fragment.appendChild(link);
                addedUrls.add(existingLink.href);
            }
        });

        if (fragment.hasChildNodes()) {
            linksContainer.appendChild(fragment);
            descriptionHeader.parentElement.insertBefore(linksContainer, descriptionContent);
        }
    }

    const observer = new MutationObserver(() => {
        if (window.location.pathname.startsWith('/series/')) {
            addExternalLinks();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (window.location.pathname.startsWith('/series/')) {
        setTimeout(addExternalLinks, 500);
    }
})();
