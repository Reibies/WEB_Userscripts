// ==UserScript==
// @name         Tumblr Blogpack custom blogs
// @version      1.0
// @description  Demo
// @author       Reibies
// @match        https://www.tumblr.com/*
// @match        https://*.tumblr.com/*
// ==/UserScript==

(function() {
    'use strict';

    // Function to get the blog name from the URL
    function getBlogName() {
        const iframeControlsContainer = document.querySelector('.iframe-controls-container');
        const blogLink = iframeControlsContainer.querySelector('.open-in-peepr-button');
        const blogURL = new URL(blogLink.href);
        return blogURL.pathname.split('/')[1];
    }

    // Function to create the "Add to Blogpack" button
    function createAddToBlogpackButton() {
        const blogName = getBlogName();
        const buttonsContainer = document.querySelector('.buttons-container');
        const addToBlogpackButton = document.createElement('button');
        addToBlogpackButton.textContent = 'Add to Blogpack';
        addToBlogpackButton.className = 'tx-button follow-button';

        addToBlogpackButton.addEventListener('click', function() {
            openAddToBlogpackPopup(blogName);
        });

        buttonsContainer.appendChild(addToBlogpackButton);
    }

    // Function to open the "Add to Blogpack" popup
    function openAddToBlogpackPopup(blogName) {
        const blogpacks = JSON.parse(localStorage.getItem('blogpacks')) || [];
        const checkedBlogpacks = [];

        const popupWindow = window.open('', '_blank', 'width=400,height=300');
        const popupContent = `
            <html>
            <head>
                <title>Add to Blogpack</title>
                <style>
                    label {
                        display: block;
                        margin-bottom: 5px;
                    }
                </style>
            </head>
            <body>
                <h2>Add to Blogpack</h2>
                <form id="blogpack-form">
                    <p>Select the blogpacks:</p>
                    ${blogpacks.map(blogpack => `
                        <label>
                            <input type="checkbox" name="blogpack" value="${blogpack}" ${localStorage.getItem(blogpack)?.includes(blogName) ? 'checked' : ''}>
                            ${blogpack}
                        </label>
                    `).join('')}
                    <br>
                    <button type="submit">Save</button>
                    <button type="button" onclick="window.close()">Cancel</button>
                </form>
                <script>
                    document.getElementById('blogpack-form').addEventListener('submit', function(event) {
                        event.preventDefault();

                        var addedBlogpacks = [];
                        var removedBlogpacks = [];

                        var checkboxes = document.getElementsByName('blogpack');
                        for (var i = 0; i < checkboxes.length; i++) {
                            var checkbox = checkboxes[i];
                            var blogpack = checkbox.value;
                            var blogList = localStorage.getItem(blogpack) || '';

                            if (checkbox.checked && !blogList.includes('${blogName}')) {
                                var updatedBlogList = blogList ? blogList + ',' + '${blogName}' : '${blogName}';
                                localStorage.setItem(blogpack, updatedBlogList);
                                addedBlogpacks.push(blogpack);
                            } else if (!checkbox.checked && blogList.includes('${blogName}')) {
                                var updatedBlogList = blogList.replace('${blogName}', '').replace(/,,/g, ',').replace(/^,|,$/g, '');
                                localStorage.setItem(blogpack, updatedBlogList);
                                removedBlogpacks.push(blogpack);
                            }
                        }

                        var successMessage = '';

                        if (addedBlogpacks.length > 0) {
                            successMessage += '${blogName}' + ' was added to blogpack(s): ' + addedBlogpacks.join(', ') + '\\n';
                        }

                        if (removedBlogpacks.length > 0) {
                            successMessage += '${blogName}' + ' was removed from blogpack(s): ' + removedBlogpacks.join(', ') + '\\n';
                        }

                        if (successMessage !== '') {
                            alert(successMessage);
                        }

                        window.close();
                    });
                </script>
            </body>
            </html>
        `;

        popupWindow.document.write(popupContent);
        popupWindow.document.close();
    }

    createAddToBlogpackButton();
})();

