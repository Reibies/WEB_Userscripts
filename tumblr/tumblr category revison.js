// ==UserScript==
// @name         Tumblr Blogpack Manager
// @version      1.6
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/tumblr/tumblr%20category%20revison.js
// @downloadURL   https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/tumblr/tumblr%20category%20revison.js
// @description  Manage Tumblr Blogpacks
// @author       Reibies
// @match        https://www.tumblr.com/*
// ==/UserScript==

(function() {
    'use strict';

// Add the settings button
let topBar = document.querySelector('.uuWZ2');
let settingsButton = document.createElement('button');
settingsButton.id = 'blogpackSettingsButton';
settingsButton.textContent = '📋'; // Button can be changed
settingsButton.style.fontSize = '20px';
settingsButton.style.color = 'rgb(var(--black))';
settingsButton.style.background = 'rgb(var(--white))';
settingsButton.style.borderRadius = '3px';
settingsButton.style.padding = '3px';
settingsButton.style.marginRight = '3px';
topBar.insertBefore(settingsButton, topBar.firstChild);


    // Add event listener to the settings button
    settingsButton.addEventListener('click', function() {
        let settingsMenu = document.querySelector('#blogpackSettingsMenu');
        if (settingsMenu) {
            settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
        } else {
            openSettingsMenu();
        }
    });

function openSettingsMenu() {
  let settingsButton = document.querySelector('#blogpackSettingsButton');
  let settingsMenu = document.querySelector('#blogpackSettingsMenu');

  if (settingsMenu) {
    settingsMenu.remove();
    return;
  }

  settingsMenu = document.createElement('div');
  settingsMenu.id = 'blogpackSettingsMenu';
  settingsMenu.style.display = 'block';
  settingsMenu.style.position = 'absolute';
  settingsMenu.style.top = `${settingsButton.offsetTop + settingsButton.offsetHeight}px`;
  settingsMenu.style.left = `${settingsButton.offsetLeft}px`;
  settingsMenu.style.width = 'auto';
  settingsMenu.style.height = 'auto';
  settingsMenu.style.maxHeight = '20%';
  settingsMenu.style.padding = '5px';
  settingsMenu.style.background = 'rgb(var(--white))';
  settingsMenu.style.color = 'rgb(var(--black))';
  settingsMenu.style.boxShadow = '0px 2px 4px rgb(var(--navy))';
  settingsMenu.style.borderRadius = '3px';
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
        blogpackInput.style.color = 'rgba(var(--white-on-dark))';
        blogpackInput.style.background = 'rgba(var(--white-on-dark),.15)';
        blogpackInput.placeholder = 'New blogpack';
        blogpackForm.appendChild(blogpackInput);

        // Add a submit button to the form
        let submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = '➕';// Button can be changed
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
        blogpackList.style.paddingLeft = '1.5em'; // Set the desired padding-left

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
            editButton.textContent = '✏️';// Button can be changed
            editButton.addEventListener('click', function() {
                editBlogpack(blogpack);
            });
            listItem.appendChild(editButton);

            // Add a button to delete the blogpack
            let deleteButton = document.createElement('button');
            deleteButton.style.borderRadius = '5px';
            deleteButton.style.margin = '3px';
            deleteButton.style.padding = '3px';
            deleteButton.textContent = '🗑️';// Button can be changed
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
        editButton.style.borderRadius = '3px';
        editButton.style.margin = '3px';
        editButton.style.padding = '3px';
        editButton.textContent = '✏️';// Button can be changed
        editButton.addEventListener('click', function() {
            editBlogpack(blogpack);
        });
        listItem.appendChild(editButton);

        // Add a button to delete the blogpack
        let deleteButton = document.createElement('button');
        deleteButton.style.borderRadius = '3px';
        deleteButton.style.margin = '3px';
        deleteButton.style.padding = '3px';
        deleteButton.textContent = '🗑️';// Button can be changed
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

    // Function to get the blog name from the URL
    function getBlogName() {
        const header = document.querySelector('header.uYpYy');
        const blogNameLink = header.querySelector('a[href^="/"]');
        const blogURL = new URL(blogNameLink.href);
        return blogURL.pathname.split('/')[1];
    }

    // Function to create the "Add to Blogpack" button
    function createAddToBlogpackButton(){
        const blogName = getBlogName();
        const addToBlogpackButton = document.createElement('button');
        addToBlogpackButton.className = 'TRX6J CxLjL qjTo7 IMvK3 qNKBC';
        addToBlogpackButton.setAttribute('style', '--button-text:RGB(var(--black));--button-bg:RGB(var(--accent));border-color:rgba(var(--black), 0.40)');
        const addToBlogpackSpan = document.createElement('span');
        addToBlogpackSpan.className = 'EvhBA nh7eU';
        addToBlogpackSpan.style.color = 'var(--blog-background-color)';
        addToBlogpackSpan.tabIndex = '-1';
        addToBlogpackSpan.textContent = 'Add to Blogpack';

        addToBlogpackButton.appendChild(addToBlogpackSpan);

        addToBlogpackButton.addEventListener('click', function() {
            openAddToBlogpackPopup(blogName);
        });

        const buttonsContainer = document.querySelector('.uk9FI');
        buttonsContainer.appendChild(addToBlogpackButton);
    }

  function openAddToBlogpackPopup(blogName) {
  const blogpacks = JSON.parse(localStorage.getItem('blogpacks')) || [];
  const checkedBlogpacks = [];
  let popup = document.querySelector('#addBlogpackPopup');

  if (popup) {
    // Popup is already open, close it
    popup.remove();
    return;
  }

  popup = document.createElement('div');
  popup.id = 'addBlogpackPopup';
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.maxWidth = '220px';
  popup.style.padding = '10px';
  popup.style.background = 'rgb(var(--white))';
  popup.style.color = 'rgb(var(--black))';
  popup.style.boxShadow = '0px 2px 4px rgb(var(--navy))';
  popup.style.borderRadius = '3px';
  popup.style.zIndex = '9999';

  const blogListContainer = document.createElement('div');
  blogListContainer.style.maxHeight = '200px';
  blogListContainer.style.overflowY = 'auto';

  for (const blogpack of blogpacks) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = blogpack;
    checkbox.checked = localStorage.getItem(blogpack)?.includes(blogName) || false;
    checkbox.style.marginRight = '5px';
    checkedBlogpacks.push(checkbox);

    const label = document.createElement('label');
    label.textContent = blogpack;
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    label.prepend(checkbox);

    blogListContainer.appendChild(label);
  }

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.style.marginTop = '10px';
  saveButton.style.borderRadius = '5px';
  saveButton.style.padding = '5px';

  saveButton.addEventListener('click', function() {
    const addedBlogpacks = [];
    const removedBlogpacks = [];

    for (const checkbox of checkedBlogpacks) {
      const blogpack = checkbox.value;
      const blogList = localStorage.getItem(blogpack) || '';

      if (checkbox.checked && !blogList.includes(blogName)) {
        const updatedBlogList = blogList ? `${blogList},${blogName}` : blogName;
        localStorage.setItem(blogpack, updatedBlogList);
        addedBlogpacks.push(blogpack);
      } else if (!checkbox.checked && blogList.includes(blogName)) {
        const updatedBlogList = blogList.replace(blogName, '').replace(/,,/g, ',').replace(/^,|,$/g, '');
        localStorage.setItem(blogpack, updatedBlogList);
        removedBlogpacks.push(blogpack);
      }
    }

    let successMessage = '';

    if (addedBlogpacks.length > 0) {
      successMessage += `${blogName} was added to blogpack(s): ${addedBlogpacks.join(', ')}`;
    }

    if (removedBlogpacks.length > 0) {
      successMessage += `${blogName} was removed from blogpack(s): ${removedBlogpacks.join(', ')}`;
    }

    alert(successMessage);
    popup.remove();
  });

  popup.appendChild(blogListContainer);
  popup.appendChild(saveButton);
  document.body.appendChild(popup);
}

    createAddToBlogpackButton();
})();

