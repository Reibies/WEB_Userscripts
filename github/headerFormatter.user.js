// ==UserScript==
// @name         GitHub Userscript Header Formatter


// @version      0.1

// @description  Adds a button to format and copy userscript headers based on the GitHub URL.
// @match        https://github.com/*/*/edit/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createFormatButton() {
        const previewButton = document.querySelector('.BlobEditHeader-module__SegmentedControl--reacR');
        if (previewButton) {
            const formatButton = document.createElement('button');
            formatButton.innerHTML = '💫 Header';
            formatButton.className = 'btn ml-2';
            formatButton.style.cssText = 'border: 1px solid #2da44e; color: #2da44e;';

            formatButton.addEventListener('click', () => {
                const url = window.location.href;
                const parts = url.split('/');
                const author = parts[3];
                const repo = parts[4];
                const filePath = parts.slice(7).join('/');

                const formattedHeader = `// @author       ${author}\n` +
                                      `// @namespace    https://github.com/${author}\n` +
                                      `// @downloadURL  https://github.com/${author}/${repo}/raw/refs/head/master/${filePath}`;

                copyToClipboard(formattedHeader);
                alert('Userscript header copied to clipboard!');
            });

            previewButton.parentNode.insertBefore(formatButton, previewButton.nextSibling);
        }
    }

    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Run the script
    createFormatButton();
})();
