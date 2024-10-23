// ==UserScript==
// @name           Mangaupdates External Links
// @namespace      none
// @match          https://www.mangaupdates.com/series/*
// @match          https://www.mangaupdates.com/series.html?id=*
// @grant          none
// @version        v1.5
// @description    Adds external links directly below the "Description" header on MU's series info page.
// ==/UserScript==

// favicons
const favicons = {
    "MangaDex": "https://mangadex.org/favicon.ico",
    "Madokami": "https://media.tenor.com/iP6vWMgbHQUAAAAi/madokamagica-madoka.gif"//,
    // "(site name)": "(image link)"
};

// Button Style
function createStyledLink(href, text, bgColor, hoverColor, color = "#333", iconUrl) {
    const link = document.createElement('a');
    link.href = href;
    link.style.cssText = `
        display: inline-flex;
        align-items: center;
        margin: 2px;
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: ${bgColor};
        color: ${color};
        text-decoration: none;
        font-size: 14px;
        vertical-align: middle;
    `;
    // Favicon style
    if (iconUrl) {
        const icon = document.createElement('img');
        icon.src = iconUrl;
        icon.style.cssText = `
            width: 16px;
            height: 16px;
            margin-right: 5px;
        `;
        link.appendChild(icon);
    }

    const textNode = document.createTextNode(text);
    link.appendChild(textNode);

    link.addEventListener('mouseover', () => link.style.backgroundColor = hoverColor);
    link.addEventListener('mouseout', () => link.style.backgroundColor = bgColor);
    return link;
}

// Preset Links
function addExternalLinks() {
    const titleElement = document.querySelector(".releasestitle.tabletitle");
    const title = titleElement ? encodeURIComponent(titleElement.innerText) : "";
    const pages = [
        { name: "MangaDex", url: `https://mangadex.org/titles/?page=1&q=${title}` },
        { name: "Madokami", url: `https://manga.madokami.al/search?q=${title}` }//,
        // { name: "(site name)", url: `(URL)${title}` }
    ];

    // Locate the description section header (updated)
    const descriptionHeader = document.querySelector('.info-box_sCat__QFEaH');

    if (!descriptionHeader) return;

    // Locate the description content (updated)
    const descriptionContent = document.querySelector('.info-box_sContent__CTwJh');

    if (!descriptionContent) return;

    // Create the external links container (without external links header)
    const linksContent = document.createElement('div');
    linksContent.className = "sContent external-links-container";

    const addedLinks = new Set();

    // Preset links
    pages.forEach(({ name, url }) => {
        const faviconUrl = favicons[name];
        const link = createStyledLink(url, name, "#f8f8f8", "#ddd", "#333", faviconUrl);
        linksContent.appendChild(link);
        addedLinks.add(url);
    });

    // Add description links
    descriptionContent.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!addedLinks.has(link.href)) {
            linksContent.appendChild(createStyledLink(link.href, link.innerText, "#d0d8e2", "#a4b1c2", "#52667c"));
            addedLinks.add(link.href);
        }
    });

    // Insert the external links right after the description header, but before the description content
    descriptionHeader.parentNode.insertBefore(linksContent, descriptionContent);
}

// Run
addExternalLinks();
