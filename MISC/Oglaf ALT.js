// ==UserScript==
// @name         Oglaf ALT and Title
// @namespace    https://github.com/Reibies
// @version      1.0
// @description  Display hidden text in Oglaf's image
// @match        https://www.oglaf.com/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=Chelsea+Market&display=swap');

  .button.alt {
    color: #343a44 !important;
    font-weight: bold !important;
    font-family: 'Chelsea Market', cursive;
    text-indent: 0 !important;
  }

#altTextContainer {
    margin-top: 10px;
    font-size: 10px;
    color: #343a44;
}

#altTextContainer p {
    margin: 0;
    padding: 3px
}

#altTextContainer p:nth-of-type(2) {
    font-style: italic;
}

`);

(function() {
    'use strict';

    var img = document.getElementById('strip');
    if (img) {
        var altText = img.getAttribute('alt');
        var titleText = img.getAttribute('title');
        if (altText && titleText) {
            // Add a new button below the Patreon button in #nav
            var nav = document.getElementById('nav');
            if (nav) {
                var patreonButton = nav.querySelector('.button.patreon');
                if (patreonButton) {
                    var newButton = document.createElement('a');
                    newButton.textContent = 'ALT TEXT';
                    newButton.setAttribute('class', 'button alt');
                    newButton.addEventListener('click', function() {
                        // Display the hidden text in a div
                        var altTextContainer = document.getElementById('altTextContainer');
                        if (altTextContainer) {
                            altTextContainer.innerHTML = '<p><strong>' + altText + '</strong></p><p>' + titleText + '</p>';

                        } else {
                            altTextContainer = document.createElement('div');
                            altTextContainer.setAttribute('id', 'altTextContainer');
                            altTextContainer.innerHTML = '<p><strong>' + altText + '</strong></p><p>' + titleText + '</p>';

                            nav.insertBefore(altTextContainer, patreonButton.nextSibling);
                        }
                    });
                    nav.insertBefore(newButton, patreonButton.nextSibling);
                }
            }
        }
    }
})();
