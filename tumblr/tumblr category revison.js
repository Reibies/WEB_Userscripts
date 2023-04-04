// ==UserScript==
// @name         Tumblr Followers Categorizer
// @version      1
// @description  Categorize your Tumblr followers and filter them by category.
// @match        https://www.tumblr.com/dashboard
// ==/UserScript==


(function () {
    'use strict';

    // Create the drop-down menu
    let dropdown = document.createElement('select');
    dropdown.id = 'categoryDropdown';
    let topBar = document.querySelector('.rllUD');
    topBar.appendChild(dropdown);

    // Add the "All" option to the drop-down menu
    let allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.text = '🍂All';
    dropdown.appendChild(allOption);

    // Get the current object of categories from localStorage
    let categories = JSON.parse(localStorage.getItem('categories')) || {};

    // Add the categories to the drop-down menu
    for (let category in categories) {
        let newOption = document.createElement('option');
        newOption.value = category;
        newOption.text = category;
        dropdown.appendChild(newOption);
    }

    // Add the settings button
    let settingsButton = document.createElement('button');
    settingsButton.id = 'categorySettingsButton';
    settingsButton.textContent = '⚙️';
    topBar.appendChild(settingsButton);

    // Add event listener to the settings button
    settingsButton.addEventListener('click', function () {
        let settingsMenu = document.querySelector('#categorySettingsMenu');
        if (settingsMenu) {
            // If the settings menu is already open, close it
            document.body.removeChild(settingsMenu);
        } else {
            // If the settings menu is not open, open it
            openSettingsMenu();
        }
    });

    function openSettingsMenu() {
        // Create the settings menu
        let settingsMenu = document.createElement('div');
        settingsMenu.id = 'categorySettingsMenu';
        settingsMenu.style.position = 'fixed';
        settingsMenu.style.overflow = 'scroll';
        settingsMenu.style.top = '50px';
        settingsMenu.style.right = '30%';
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
        // Add content to the settings menu (you will need to create this)
        populateSettingsMenu(settingsMenu);
    }

    function populateSettingsMenu(settingsMenu) {
        // Create a form to edit categories
        let categoryForm = document.createElement('form');
        categoryForm.id = 'categoryForm';
        settingsMenu.appendChild(categoryForm);

        // Add a text input to the form
        let categoryInput = document.createElement('input');
        categoryInput.type = 'text';
        categoryInput.style.margin = '3px';
        categoryInput.style.borderRadius = '3px';
        categoryInput.style.border = 'none';
        categoryInput.style.color = 'rgba(var(--white-on-dark),.65)';
        categoryInput.style.background = 'rgba(var(--white-on-dark),.25)';
        categoryInput.placeholder = 'Enter a new category';
        categoryForm.appendChild(categoryInput);


        // Add a submit button to the form
        let submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = '➕';
        categoryForm.appendChild(submitButton);

        // Add event listener to the form
        categoryForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // Get the value of the text input
            let newCategory = categoryInput.value;

            // Add the new category to the list of categories (you will need to create this)
            addCategory(newCategory);

            // Clear the text input
            categoryInput.value = '';
        });

        // Get the current object of categories from localStorage
        let categories = JSON.parse(localStorage.getItem('categories')) || {};

        // Create a list of categories
        let categoryList = document.createElement('ul');
        categoryList.id = 'categoryList';
        settingsMenu.appendChild(categoryList);

        // Add each category to the list
        for (let category in categories) {
            let listItem = document.createElement('li');
            listItem.textContent = category;

            // Add a button to edit the category
            let editButton = document.createElement('button');

            editButton.style.borderRadius = '5px';
            editButton.style.margin = '3px';
            editButton.style.padding = '3px';
            editButton.textContent = '🔧';
            editButton.addEventListener('click', function () {
                // Edit the category (you will need to create this)
                editCategory(category);
            });
            listItem.appendChild(editButton);

            // Add a button to delete the category
            let deleteButton = document.createElement('button');
            deleteButton.style.borderRadius = '5px';
            deleteButton.style.margin = '3px';
            deleteButton.style.padding = '3px';
            deleteButton.textContent = '🗑️';
            deleteButton.addEventListener('click', function () {
                // Delete the category (you will need to create this)
                deleteCategory(category);
            });
            listItem.appendChild(deleteButton);

            categoryList.appendChild(listItem);
        }


        function importCategories() {
            // Prompt the user to select a file
            let input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.addEventListener('change', function () {
                let file = input.files[0];
                let reader = new FileReader();
                reader.addEventListener('load', function () {
                    // Parse the JSON data from the file
                    let categories = JSON.parse(reader.result);

                    // Save the categories to localStorage
                    localStorage.setItem('categories', JSON.stringify(categories));

                    // Update the drop-down menus (you will need to create this)
                    updateDropdowns();
                });
                reader.readAsText(file);
            });
            input.click();
        }

        function exportCategories() {
            // Get the current object of categories from localStorage
            let categories = JSON.parse(localStorage.getItem('categories')) || {};

            // Create a Blob with the JSON data
            let blob = new Blob([JSON.stringify(categories)], { type: 'application/json' });

            // Create a URL for the Blob
            let url = URL.createObjectURL(blob);

            // Create a link to download the file
            let link = document.createElement('a');
            link.href = url;
            link.download = 'categories.json';
            link.click();

            // Revoke the URL
            URL.revokeObjectURL(url);
        }




        // Create a button to import categories
        let importButton = document.createElement('button');
        importButton.textContent = 'Import';
        importButton.style.fontWeight = 'bold';
        importButton.style.borderRadius = '5px';
        importButton.style.margin = '5px';
        importButton.style.padding = '3px';
        settingsMenu.appendChild(importButton);

        // Add event listener to the import button
        importButton.addEventListener('click', function () {
            // Import categories
            importCategories();
        });

        // Create a button to export categories
        let exportButton = document.createElement('button');
        exportButton.textContent = 'Export';
        exportButton.style.fontWeight = 'bold';
        exportButton.style.borderRadius = '5px';
        exportButton.style.margin = '5px';
        exportButton.style.padding = '3px';
        settingsMenu.appendChild(exportButton);


        // Add event listener to the export button
        exportButton.addEventListener('click', function () {
            // Export categories
            exportCategories();
        });
    }

    function addCategory(newCategory) {
        // Get the current object of categories from localStorage
        let categories = JSON.parse(localStorage.getItem('categories')) || {};

        // Add the new category to the object
        categories[newCategory] = [];

        // Save the updated object of categories to localStorage
        localStorage.setItem('categories', JSON.stringify(categories));

        // Update the drop-down menu
        let dropdown = document.querySelector('#categoryDropdown');
        let newOption = document.createElement('option');
        newOption.value = newCategory;
        newOption.text = newCategory;
        dropdown.appendChild(newOption);

        // Update the settings menu
        let settingsMenu = document.querySelector('#categorySettingsMenu');
        populateSettingsMenu(settingsMenu);
    }

    function deleteCategory(categoryToDelete) {
        // Get the current object of categories from localStorage
        let categories = JSON.parse(localStorage.getItem('categories')) || {};

        // Remove the category from the object
        delete categories[categoryToDelete];

        // Save the updated object of categories to localStorage
        localStorage.setItem('categories', JSON.stringify(categories));

        // Update the drop-down menu
        let dropdown = document.querySelector('#categoryDropdown');
        let optionToRemove = dropdown.querySelector(`option[value="${categoryToDelete}"]`);
        dropdown.removeChild(optionToRemove);
    }

    function editCategory(categoryToEdit) {
        // Create a modal dialog
        let modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        document.body.appendChild(modal);

        // Create a form to edit the category
        let editForm = document.createElement('form');
        editForm.style.position = 'absolute';
        editForm.style.top = '50%';
        editForm.style.left = '50%';
        editForm.style.transform = 'translate(-50%, -50%)';
        editForm.style.backgroundColor = '#ffffff';
        editForm.style.padding = '20px';
        modal.appendChild(editForm);

        // Add a text input to the form
        let categoryInput = document.createElement('input');
        categoryInput.type = 'text';
        categoryInput.value = categoryToEdit;
        editForm.appendChild(categoryInput);

        // Add a submit button to the form
        let submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Save Changes';
        editForm.appendChild(submitButton);



        // Add event listener to the form
        editForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // Get the value of the text input
            let newCategoryName = categoryInput.value;

            // Update the category (you will need to create this)
            updateCategory(categoryToEdit, newCategoryName);

            // Remove the modal dialog from the page
            document.body.removeChild(modal);
        });
    }
    function updateCategory(oldCategoryName, newCategoryName) {
        // Get the current list of categories from localStorage
        let categories = JSON.parse(localStorage.getItem('categories')) || [];

        // Find the index of the category to update
        let index = categories.indexOf(oldCategoryName);

        // Update the category name
        categories[index] = newCategoryName;

        // Save the updated list of categories to localStorage
        localStorage.setItem('categories', JSON.stringify(categories));

        // Update the drop-down menu
        let dropdown = document.querySelector('#categoryDropdown');
        let optionToUpdate = dropdown.querySelector(`option[value="${oldCategoryName}"]`);
        optionToUpdate.value = newCategoryName;
        optionToUpdate.text = newCategoryName;
    }

    // Add a drop-down menu under each user's avatar
    let avatars = document.querySelectorAll('.JZ10N');
    for (let avatar of avatars) {
        // Create the drop-down menu
        let dropdown = document.createElement('select');
        dropdown.multiple = true;
        avatar.appendChild(dropdown);

        // Get the current object of categories from localStorage
        let categories = JSON.parse(localStorage.getItem('categories')) || {};

        // Add the categories to the drop-down menu
        for (let category in categories) {
            let newOption = document.createElement('option');
            newOption.value = category;
            newOption.text = category;
            dropdown.appendChild(newOption);
        }

        // Add event listener to the drop-down menu
        dropdown.addEventListener('change', function () {
            // Update the appearance of selected options
            for (let option of dropdown.options) {
                if (option.selected) {
                    option.style.backgroundColor = '#b5e0ff';
                } else {
                    option.style.backgroundColor = '';
                }
            }

            // Get the selected categories
            let selectedCategories = Array.from(dropdown.selectedOptions).map(option => option.value);

            // Get the username of the user
            let usernameElement = avatar.querySelector('.BSUG4');
            let username = usernameElement.getAttribute('title');

            // Assign the selected categories to the user (you will need to create this)
            assignCategoriesToUser(username, selectedCategories);
        });
    }

    function assignCategoriesToUser(username, categories) {
        // Get the current object of categories from localStorage
        let allCategories = JSON.parse(localStorage.getItem('categories')) || {};

        // Remove this user from all categories
        for (let category in allCategories) {
            allCategories[category] = allCategories[category].filter(user => user !== username);
        }

        // Assign this user to the specified categories
        for (let category of categories) {
            allCategories[category].push(username);
        }

        // Save the updated object of categories to localStorage
        localStorage.setItem('categories', JSON.stringify(allCategories));
    }

    // Add event listener to the category drop-down menu
    let categoryDropdown = document.querySelector('#categoryDropdown');
    categoryDropdown.addEventListener('change', function () {
        // Get the selected category
        let selectedCategory = categoryDropdown.value;

        // Filter the posts on the dashboard (you will need to create this)
        filterDashboard(selectedCategory);
    });


    function filterDashboard(selectedCategory) {
        // Get all posts on the dashboard
        let posts = document.querySelectorAll('.post');



        // Show or hide each post based on its assigned categories
        for (let post of posts) {
            // Get the username of the user who created the post
            let usernameElement = post.querySelector('.BSUG4');
            let username = usernameElement.getAttribute('title');

            // Get the categories assigned to this user (you will need to create this)
            let assignedCategories = getAssignedCategories(username);

            // Show or hide the post based on whether it matches the selected category
            if (selectedCategory === 'all' || assignedCategories.includes(selectedCategory)) {
                post.style.display = '';
            } else {
                post.style.display = 'none';
            }
        }
    }
    function updateDropdowns() {
        // Get all drop-down menus on the page
        let dropdowns = document.querySelectorAll('select');

        // Get the current object of categories from localStorage
        let categories = JSON.parse(localStorage.getItem('categories')) || {};

        // Update each drop-down menu
        for (let dropdown of dropdowns) {
            // Remove all options from the drop-down menu
            while (dropdown.firstChild) {
                dropdown.removeChild(dropdown.firstChild);
            }

            // Add the categories to the drop-down menu
            for (let category in categories) {
                let newOption = document.createElement('option');
                newOption.value = category;
                newOption.text = category;
                dropdown.appendChild(newOption);
            }
        }
    }
    function getAssignedCategories(username) {
        // Get the current object of categories from localStorage
        let allCategories = JSON.parse(localStorage.getItem('categories')) || {};

        // Find all categories that this user is assigned to
        let assignedCategories = [];
        for (let category in allCategories) {
            if (allCategories[category].includes(username)) {
                assignedCategories.push(category);
            }
        }

        return assignedCategories;
    }


})();
