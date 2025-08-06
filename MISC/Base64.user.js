// ==UserScript==
// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://github.com/Reibies/WEB_Userscripts/raw/refs/head/master/MISC/Base64.user.js
// @version      1.0
// @name         4chan Base64 Decode
// @description  When selecting Base64 text a button appears to decode
// @match        https://boards.4chan.org/*
// @grant        none
// @run-at       document-end
// @icon         https://www.4chan.org/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // Function to decode base64
    function decodeBase64(encodedStr) {
        try {
            return atob(encodedStr);
        } catch (e) {
            console.error("Base64 decoding error:", e);
            return encodedStr;
        }
    }

    // Function to auto-embed URLs
    function autoEmbedLinks(text) {
        const urlPattern = /((https?:\/\/)[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?)/g;
        return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
    }

    // Create and style the "Decode" button
    function createDecodeButton() {
        const button = document.createElement('button');
        button.textContent = '🗝️';
        button.style.position = 'absolute';
        button.style.backgroundColor = '#f5f5f5';
        button.style.border = '1px solid #ccc';
        button.style.padding = '2px 6px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.display = 'none';
        button.style.fontSize = '12px';
        button.style.color = '#333';
        button.style.borderRadius = '3px';
        document.body.appendChild(button);
        return button;
    }

    // Show the button when text is highlighted
    function showButton(e) {
        const button = document.getElementById('decodeButton');
        if (!button) return;

        const selection = window.getSelection();
        if (selection.toString().trim() === '') {
            button.style.display = 'none';
            return;
        }

        // Find the post containing the highlighted text
        const postElement = Array.from(document.querySelectorAll('.postContainer, .post.op')).find(post => {
            return post.contains(window.getSelection().focusNode);
        });
        if (!postElement) return;

        // Find the menu-button within the post
        const targetElement = postElement.querySelector('.postInfo .menu-button');
        if (!targetElement) return;

        const rect = targetElement.getBoundingClientRect();
        button.style.left = `${rect.left + window.scrollX + targetElement.offsetWidth}px`;
        button.style.top = `${rect.top + window.scrollY}px`;
        button.style.display = 'block'; // Show button
        button.onclick = () => decodeSelectedText(postElement);
    }

    // Decode the selected base64 text within the post and auto-embed links
    function decodeSelectedText(postElement) {
        const selection = window.getSelection();
        if (selection.toString().trim()) {
            const base64Text = selection.toString().replace(/\s+/g, '');
            const decodedText = decodeBase64(base64Text);
            const autoEmbeddedText = autoEmbedLinks(decodedText);

            const range = selection.getRangeAt(0);
            const newNode = document.createElement('span');
            newNode.innerHTML = autoEmbeddedText;
            range.deleteContents();
            range.insertNode(newNode);
            selection.removeAllRanges();
        }
        document.getElementById('decodeButton').style.display = 'none';
    }

    // Hide the button when clicking outside the highlighted area
    function hideButtonOnClickOutside(e) {
        const button = document.getElementById('decodeButton');
        if (button && !button.contains(e.target)) {
            button.style.display = 'none';
        }
    }

    // Add event listeners
    document.addEventListener('mouseup', showButton);
    document.addEventListener('mousedown', hideButtonOnClickOutside);

    // Initialize
    window.addEventListener('load', () => {
        createDecodeButton().id = 'decodeButton';
    });
})();
