// ==UserScript==
// @name         GitHub Userscript Header Formatter

// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/github/headerFormatter.user.js
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/github/headerFormatter.user.js
// @version      0.3

// @description  Adds a button to format and copy userscript headers based on the GitHub URL.
// @match        https://github.com/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const BUTTON_ID = 'userscript-header-formatter-button';

    const githubIconSVG = `
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-table">
            <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25ZM6.5 6.5v8h7.75a.25.25 0 0 0 .25-.25V6.5Zm8-1.5V1.75a.25.25 0 0 0-.25-.25H6.5V5Zm-13 1.5v7.75c0 .138.112.25.25.25H5v-8ZM5 5V1.5H1.75a.25.25 0 0 0-.25.25V5Z"></path>
        </svg>
    `;

    function addHeaderButton() {
        const isEditPage = window.location.pathname.includes('/edit/');
        const isNewPage = window.location.pathname.includes('/new/');

        if (!isEditPage && !isNewPage) {
            return;
        }

        const buttonContainer = document.querySelector('ul[aria-label="Edit mode"]');
        if (!buttonContainer || document.getElementById(BUTTON_ID)) {
            return;
        }

        const formatButton = document.createElement('button');
        formatButton.innerHTML = `${githubIconSVG}<span style="margin-left: 5px;">user.js Header</span>`;
        formatButton.id = BUTTON_ID;
        formatButton.className = 'btn ml-2';

        formatButton.addEventListener('click', () => {
            const url = window.location.href;
            const parts = url.split('/');
            const author = parts[3];
            const repo = parts[4];
            let filePath = '';
            let branch = 'main'; // Default to 'main'

            if (isEditPage) {
                branch = parts[6];
                filePath = parts.slice(7).join('/');
            } else if (isNewPage) {
                branch = parts[6];

                const pathParts = [];
                const breadcrumbs = document.querySelectorAll('nav[data-testid="breadcrumbs"] ol li a');
                for (let i = 1; i < breadcrumbs.length; i++) {
                    pathParts.push(breadcrumbs[i].textContent);
                }

                const fileNameInput = document.querySelector('input[placeholder="Name your file..."]');
                if (fileNameInput && fileNameInput.value) {
                    pathParts.push(fileNameInput.value);
                }
                filePath = pathParts.join('/');
            }

            if (filePath) {
                const rawUrl = `https://raw.githubusercontent.com/${author}/${repo}/${branch}/${filePath}`;
                const formattedHeader = `// @author       ${author}\n` +
                                      `// @namespace    https://github.com/${author}\n` +
                                      `// @downloadURL  ${rawUrl}\n` +
                                      `// @updateURL    ${rawUrl}`;

                copyToClipboard(formattedHeader);
                alert('Userscript header copied to clipboard!');
            } else {
                alert('Could not determine file path. If creating a new file, please enter the file name first.');
            }
        });

        buttonContainer.parentNode.insertBefore(formatButton, buttonContainer.nextSibling);
    }

    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }


    const observer = new MutationObserver(() => {
        setTimeout(addHeaderButton, 100);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    addHeaderButton();
})();
