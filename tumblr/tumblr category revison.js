// ==UserScript==
// @name         Tumblr Blogpack Manager
// @version      1.0
// @description  Manage Tumblr Blogpacks
// @author       Reibies
// @match        https://www.tumblr.com/*

// ==/UserScript==

(function() {
    'use strict';

    // Add the settings button
    let topBar = document.querySelector('.rllUD');
    let settingsButton = document.createElement('button');
    settingsButton.id = 'blogpackSettingsButton';
    settingsButton.textContent = '📋';
    topBar.appendChild(settingsButton);

    // Add event listener to the settings button
    settingsButton.addEventListener('click', function() {
        let settingsMenu = document.querySelector('#blogpackSettingsMenu');
        if (settingsMenu) {
            document.body.removeChild(settingsMenu);
        } else {
            openSettingsMenu();
        }
    });

    function openSettingsMenu() {
        let settingsMenu = document.createElement('div');
        settingsMenu.id = 'blogpackSettingsMenu';
        settingsMenu.style.position = 'fixed';
        settingsMenu.style.overflow = 'scroll';
        settingsMenu.style.top = '50px';
        settingsMenu.style.right = '50%';
        settingsMenu.style.width = 'auto';
        settingsMenu.style.height = 'auto';
        settingsMenu.style.maxheight = '20%';
        settingsMenu.style.padding = '5px';
        settingsMenu.style.background = 'rgb(var(--navy))';
        settingsMenu.style.color = 'rgb(var(--white-on-dark))';
        settingsMenu.style.border = '1px solid #000000';
        settingsMenu.style.borderRadius = '5px';
        settingsMenu.style.zIndex = '9999';
        document.body.appendChild(settingsMenu);
        populateSettingsMenu(settingsMenu);
    }

    function populateSettingsMenu(settingsMenu) {
        let blogpackForm = document.createElement('form');
        blogpackForm.id = 'blogpackForm';
        settingsMenu.appendChild(blogpackForm);

        let blogpackInput = document.createElement('input');
        blogpackInput.type = 'text';
        blogpackInput.style.margin = '3px';
        blogpackInput.style.borderRadius = '3px';
        blogpackInput.style.border = 'none';
        blogpackInput.style.color = 'rgba(var(--white-on-dark),.65)';
        blogpackInput.style.background = 'rgba(var(--white-on-dark),.25)';
        blogpackInput.placeholder = 'Enter a new blogpack';
        blogpackForm.appendChild(blogpackInput);

        // Add a submit button to the form
        let submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = '➕';
        blogpackForm.appendChild(submitButton);

        // Add event listener to the form
        blogpackForm.addEventListener('submit', function(event) {
            event.preventDefault();
            let newBlogpack = blogpackInput.value;
            let blogList = prompt('Enter a comma separated list of blogs, no spaces:');
            if (blogList !== null) {
                addBlogpack(newBlogpack, blogList);
            }
            blogpackInput.value = '';
        });

        // Get the current list of blogpacks from localStorage
        let blogpacks = JSON.parse(localStorage.getItem('blogpacks')) || [];

        // Create a list of blogpacks
        let blogpackList = document.createElement('ul');
        blogpackList.id = 'blogpackList';
        blogpackList.style.listStyleType = 'none'; // Remove bullet points
        settingsMenu.appendChild(blogpackList);

        // Add each blogpack to the list
        for (let blogpack of blogpacks) {
            let listItem = document.createElement('li');
            listItem.id = blogpack;
            
            let blogpackLink = document.createElement('a');
            blogpackLink.textContent = blogpack;
            blogpackLink.href = createBlogpackLink(blogpack);
            blogpackLink.target = '_blank';
            blogpackLink.style.marginRight = '5px';
            listItem.appendChild(blogpackLink);

            // Add a button to edit the blogpack
            let editButton = document.createElement('button');
            editButton.style.borderRadius = '5px';
            editButton.style.margin = '3px';
            editButton.style.padding = '3px';
            editButton.textContent = '✏️';
            editButton.addEventListener('click', function() {
                editBlogpack(blogpack);
            });
            listItem.appendChild(editButton);

            // Add a button to delete the blogpack
            let deleteButton = document.createElement('button');
            deleteButton.style.borderRadius = '5px';
            deleteButton.style.margin = '3px';
            deleteButton.style.padding = '3px';
            deleteButton.textContent = '🗑️';
            deleteButton.addEventListener('click', function() {
                deleteBlogpack(blogpack);
            });
            listItem.appendChild(deleteButton);

            blogpackList.appendChild(listItem);
        }
    }

    function createBlogpackLink(blogpack) {
        let blogList = localStorage.getItem(blogpack) || '';
        let blogpackLink = 'https://www.tumblr.com/timeline/blogpack?blogs=';
        blogpackLink += blogList;
        return blogpackLink;
    }

    function addBlogpack(blogpack, blogList) {
        let blogpacks = JSON.parse(localStorage.getItem('blogpacks')) || [];
        blogpacks.push(blogpack);
        localStorage.setItem('blogpacks', JSON.stringify(blogpacks));
        localStorage.setItem(blogpack, blogList);
        let blogpackList = document.querySelector('#blogpackList');
        let listItem = document.createElement('li');
        listItem.id = blogpack;
        
        let blogpackLink = document.createElement('a');
        blogpackLink.textContent = blogpack;
        blogpackLink.href = createBlogpackLink(blogpack);
        blogpackLink.target = '_blank';
        blogpackLink.style.marginRight = '5px';
        listItem.appendChild(blogpackLink);

        // Add a button to edit the blogpack
        let editButton = document.createElement('button');
        editButton.style.borderRadius = '5px';
        editButton.style.margin = '3px';
        editButton.style.padding = '3px';
        editButton.textContent = '✏️';
        editButton.addEventListener('click', function() {
            editBlogpack(blogpack);
        });
        listItem.appendChild(editButton);

        // Add a button to delete the blogpack
        let deleteButton = document.createElement('button');
        deleteButton.style.borderRadius = '5px';
        deleteButton.style.margin = '3px';
        deleteButton.style.padding = '3px';
        deleteButton.textContent = '🗑️';
        deleteButton.addEventListener('click', function() {
            deleteBlogpack(blogpack);
        });
        listItem.appendChild(deleteButton);

        blogpackList.appendChild(listItem);
    }

    function editBlogpack(blogpack) {
        let blogpacks = JSON.parse(localStorage.getItem('blogpacks')) || [];
        let index = blogpacks.indexOf(blogpack);
        if (index > -1) {
            let currentTitle = blogpacks[index];
            let currentBlogList = localStorage.getItem(currentTitle);

            let newTitle = prompt('Enter a new title for the blogpack:', currentTitle);
            if (newTitle === null) {
                return;
            }
            let newBlogList = prompt('Enter a comma separated list of blogs, no spaces:', currentBlogList);
            if (newBlogList === null) {
                return;
            }

            blogpacks[index] = newTitle;
            localStorage.setItem('blogpacks', JSON.stringify(blogpacks));
            localStorage.removeItem(currentTitle);
            localStorage.setItem(newTitle, newBlogList);

            let listItem = document.getElementById(blogpack);
            listItem.id = newTitle;

            let blogpackLink = listItem.querySelector('a');
            blogpackLink.textContent = newTitle;
            blogpackLink.href = createBlogpackLink(newTitle);

        }
    }

    function deleteBlogpack(blogpack) {
        if (confirm('Are you sure you want to delete this blogpack?')) {
            let blogpacks = JSON.parse(localStorage.getItem('blogpacks')) || [];
            let index = blogpacks.indexOf(blogpack);
            if (index > -1) {
                blogpacks.splice(index, 1);
                localStorage.removeItem(blogpack);
                localStorage.setItem('blogpacks', JSON.stringify(blogpacks));
                let listItem = document.getElementById(blogpack);
                listItem.textContent = '';
                listItem.remove();
            }
        }
    }
})();
