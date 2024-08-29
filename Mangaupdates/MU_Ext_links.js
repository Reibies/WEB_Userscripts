// ==UserScript==
// @name           Mangaupdates External Links
// @namespace      Reibies
// @match          https://www.mangaupdates.com/series/*
// @match          https://www.mangaupdates.com/series.html?id=*
// @grant          none
// @version        1.0
// @description    Adds external links section to MU's series info page, avoiding duplicates.
// ==/UserScript==

// Create a styled link element
function createStyledLink(href, text, bgColor, hoverColor, color = "#333") {
    const link = document.createElement('a');
    link.href = href;
    link.innerText = text;
    link.style.cssText = `
        display: inline-block;
        margin: 2px;
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: ${bgColor};
        color: ${color};
        text-decoration: none;
        font-size: 14px;
    `;
    link.addEventListener('mouseover', () => link.style.backgroundColor = hoverColor);
    link.addEventListener('mouseout', () => link.style.backgroundColor = bgColor);
    return link;
}

function addExternalLinks() {
    const titleElement = document.querySelector(".releasestitle.tabletitle");
    const title = titleElement ? encodeURIComponent(titleElement.innerText) : "";

    const descriptionHeader = Array.from(document.querySelectorAll('.sCat'))
                                   .find(cat => cat.textContent.includes('Description'));

    if (!descriptionHeader) {
        console.error("Description header not found");
        return;
    }

    let descriptionContent = descriptionHeader.nextElementSibling;
    while (descriptionContent && !descriptionContent.classList.contains('sContent')) {
        descriptionContent = descriptionContent.nextElementSibling;
    }

    if (!descriptionContent || !descriptionContent.classList.contains('sContent')) {
        console.error("Description content not found or malformed.");
        return;
    }

    const externalLinksContainer = document.createElement('div');
    externalLinksContainer.className = "external-links-container";

    const linksCat = document.createElement('div');
    linksCat.className = "sCat";
    linksCat.innerHTML = "<b>External Links</b>";

    const linksContent = document.createElement('div');
    linksContent.className = "sContent";

    externalLinksContainer.append(linksCat, linksContent);
    descriptionHeader.parentNode.insertBefore(externalLinksContainer, descriptionHeader);

    const pages = [
        { name: "MangaDex", url: `https://mangadex.org/titles/?page=1&q=${title}` },
        { name: "Madokami", url: `https://manga.madokami.al/search?q=${title}` },
        { name: "DynastyScans", url: `https://dynasty-scans.com/search?q=${title}` }
    ];

    const addedLinks = new Set();

    // Add predefined links
    pages.forEach(({ name, url }) => {
        const link = createStyledLink(url, name, "#f8f8f8", "#ddd");
        linksContent.appendChild(link);
        addedLinks.add(url);
    });

    // Add description links, avoiding duplicates
    descriptionContent.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!addedLinks.has(link.href)) {
            linksContent.appendChild(createStyledLink(link.href, link.innerText, "#e0e0ff", "#b3b3ff", "#0000ff"));
            addedLinks.add(link.href);
        }
    });
}

// Run the function to add external links
addExternalLinks();
