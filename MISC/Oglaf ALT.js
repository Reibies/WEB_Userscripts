// ==UserScript==
// @name         Oglaf ALT and Title
// @description  Display hidden text in Oglaf's image
// @version      1.2
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAeZQTFRFMjtHMTgzISUU27s7ISAYHSEhHiAfkGoxICEZ2MBNKiUeKS8tMDo9rKBgQjApJyocKDAzKzExLC0sNjYzMDo/u61kNi4oMyoVJC4rw6E/JyUkIScXICUjoV0y6M1iW0YjrX82KicU79podlA0m4BLemwlLSseIigqKTI8LzU479ZYGSAjgVkjKDI628ZT8OOCYjkm9t1Jqok608BCcTsZLjQ1c0cqp2cx3cVAwZk3b0skaUAvuYM6nUstIyYVMzcySjgeuZM9z79IjVstJSQWtJlT2bEy4cpThUwhrI44JzA1HygywY84JSQS6dA9eHFBMDU6cGtCwZcwe21VHiQcISQUHyMiimQrJSwrLDg0JSYqIiIazqw4JCUU3r5Yz6UzMTk0MCsbHCUjISYVGiAfLTQqhV4n1K9P2spT7dVW0a5N38xHqog08eGKeTYbWE4bJy8xlE8n68pVsp05+d9JLzM1XDscgz0aLSkV9+mPHSAenGwtHCIaMTo0KCceJiojKi0ZJyYWJSknOiwlRisZJCktnFAzLzIyelAm18FE8thHMTpFMjcqonU9oGQuqn01Li4p4sxEHCAeKy8u8txHMjlAkGku59NEJSwq/fKqwrNU6cE8f1YszLVKIiUmJSgcrmY18dxmaHh/EAAAAM5JREFUeNpiYMABGBkTRJC4qaHJ0iE1kXA+U37nRKeFvA0CIM5UBgY71ZIp0431Z+bymwIFhANKiw0tcsLT2F0r5WInqzGkF83ukvQwk6pTnuOp5OcWz6CYZelYPa3JW1dGRccohrmCoVG8zKp/bli3RlJwh7O8QyIDT71gnoJWq3rEDNFegwku7UBjvVr6MvUC/WdlyFqzaoKdwVJuHueezWljKzQJ4q4CNpPCIJ8FbWLaPVCXSlRxNfNFzUuxh7udmymaw3d+LVZvAwQYAIjiMvUcAsHGAAAAAElFTkSuQmCC
// @namespace    https://github.com/Reibies
// @author       Reibies
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/MISC/Oglaf%20ALT.js
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/MISC/Oglaf%20ALT.js
//
// @match        https://www.oglaf.com/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=Chelsea+Market&display=swap');

  .button.alt {
    color: #343a44 !important;
    font-family: 'Chelsea Market', cursive;
    text-indent: 0 !important;
    text-shadow: 0 0 1px #313842, 0 0 2px #9c9ea0;
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
                            altTextContainer.innerHTML = '<p><strong>' + titleText + '</strong></p><p>' + altText + '</p>';

                        } else {
                            altTextContainer = document.createElement('div');
                            altTextContainer.setAttribute('id', 'altTextContainer');
                            altTextContainer.innerHTML = '<p><strong>' + titleText + '</strong></p><p>' + altText + '</p>';

                            nav.insertBefore(altTextContainer, patreonButton.nextSibling);
                        }
                    });
                    nav.insertBefore(newButton, patreonButton.nextSibling);
                }
            }
        }
    }
})();
