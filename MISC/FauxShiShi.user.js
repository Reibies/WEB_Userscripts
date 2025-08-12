// ==UserScript==
// @name         Faux-Shi-Shi
// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/WEB_Userscripts/MISC/FauxShiShi.user.js
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/WEB_Userscripts/MISC/FauxShiShi.user.js
// @version      2.1
// @description  Un-Scanlates your manga
// @icon         https://64.media.tumblr.com/d02418e50f89ee9923dfed2df3b92de2/f79674bd4b7ceb60-ba/s500x750/06318d7727f891a8ba2b16d2b5a87b2f76946822.pnj
// @match        https://mangadex.org/*
// @match        https://comick.io/*
// @match        https://mangaplus.shueisha.co.jp/*
// @match        https://weebcentral.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const siteConfigs = {
        'weebcentral.com': {
            containerSelector: 'section.flex-1',
            imageSelector: 'section.flex-1 img'
        },
        'mangadex.org': {
            containerSelector: '.md--page',
            imageSelector: '.md--page .img'
        },
        'comick.io': {
            containerSelector: 'div.justify-center',
            imageSelector: 'div.justify-center img'
        },
        'mangaplus.shueisha.co.jp': {
            containerSelector: '.zao-image-container',
            imageSelector: '.zao-image'
        }
    };

    const presets = {
        'senka': {
            name: 'Senka',
            imageCss: 'filter: hue-rotate(-41deg) contrast(75%) sepia(15%) contrast(105%) hue-rotate(41deg);',
            textureCss: 'opacity: 0.15; mix-blend-mode: luminosity;',
            textureSvg: `
                <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'>
                    <filter id='noiseFilter'>
                        <feTurbulence type='fractalNoise' baseFrequency='.4' numOctaves='3' stitchTiles='stitch' />
                    </filter>
                    <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
                </svg>
            `
        },
        'shimbun': {
            name: 'Shimbun',
            imageCss: 'filter: hue-rotate(-23deg) contrast(75%) sepia(35%) hue-rotate(23deg);',
            textureCss: 'opacity: 0.15; mix-blend-mode: luminosity;',
            textureSvg: `
                <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'>
                    <filter id='noiseFilter'>
                        <feTurbulence type='fractalNoise' baseFrequency='.4' numOctaves='3' stitchTiles='stitch' />
                    </filter>
                    <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
                </svg>
            `
        },
        'newsprint': {
            name: 'Newsprint',
            imageCss: 'filter: hue-rotate(36deg) sepia(13%) hue-rotate(-36deg);',
            textureCss: 'opacity: 0.25; mix-blend-mode: multiply;',
            textureSvg: `
                <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'>
                    <filter id='noiseFilter'>
                        <feTurbulence baseFrequency="0.3,0.3" numOctaves="1" type="fractalNoise" result="grain"/>
                        <feTurbulence baseFrequency="0.08,0.5" numOctaves="5" type="fractalNoise" result='fine'/>
                        <feBlend in='grain' in2='fine' mode='multiply'/>
                    </filter>
                    <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
                </svg>
            `
        },
        'e-ink': {
            name: 'E-Ink',
            imageCss: 'filter: grayscale(100%) sepia(19%) hue-rotate(67deg) contrast(94%) brightness(96.8%) blur(0.2px);',
            textureCss: 'opacity: 0.4; mix-blend-mode: soft-light;',
        },
        'denoise': {
            name: 'Denoise',
            imageCss: 'filter: blur(0.5px) brightness(103%) contrast(112%);',
        },
        'disable': {
            name: 'Disable',
        }
    };

    let styleElement = null;

    function getTextureDataUri(preset) {
        if (!preset.textureSvg) {
            return 'none';
        }
        const encodedSvg = window.btoa(preset.textureSvg);
        return `url("data:image/svg+xml;base64,${encodedSvg}")`;
    }

    function applyStyle(presetKey) {
        const preset = presets[presetKey];
        if (!preset) {
            console.warn('Invalid preset key:', presetKey);
            return;
        }

        const hostname = window.location.hostname;
        let activeConfig = null;
        for (const siteKey in siteConfigs) {
            if (hostname.includes(siteKey)) {
                activeConfig = siteConfigs[siteKey];
                break;
            }
        }

        if (!activeConfig) {
            return;
        }

        const textureDataUri = getTextureDataUri(preset);

        const css = `
            ${activeConfig.containerSelector} {
                position: relative;
                isolation: isolate;
                max-width: max-content !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            ${activeConfig.imageSelector} {
                ${preset.imageCss};
                max-width: 100% !important;
            }

            ${activeConfig.containerSelector}::after {
                content: " ";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                pointer-events: none;
                background-image: ${textureDataUri};
                ${preset.textureCss}
            }
        `;

        if (styleElement) {
            styleElement.innerHTML = css;
        } else {
            styleElement = GM_addStyle(css);
        }

        highlightSelectedPreset(presetKey);
        GM_setValue('selectedPreset', presetKey);
        console.log(`Faux-Shi-Shi Style Activated: ${preset.name}`);
    }

    function createSettingsMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.innerHTML = `
            <div id="faux-reader-settings-gear" class="faux-reader-icon">⚙️</div>
            <div id="faux-reader-settings-menu">
                ${Object.entries(presets).map(([key, preset]) => `
                    <button data-preset="${key}">${preset.name}</button>
                `).join('')}
            </div>
        `;
        document.body.appendChild(menuContainer);

        const gearButton = document.getElementById('faux-reader-settings-gear');
        const settingsMenu = document.getElementById('faux-reader-settings-menu');

        gearButton.addEventListener('click', () => {
            const isVisible = settingsMenu.style.display === 'block';
            settingsMenu.style.display = isVisible ? 'none' : 'block';
        });

        settingsMenu.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON') {
                const presetKey = event.target.getAttribute('data-preset');
                applyStyle(presetKey);
                settingsMenu.style.display = 'none';
            }
        });
    }

    function highlightSelectedPreset(presetKey) {
        const menu = document.getElementById('faux-reader-settings-menu');
        if (!menu) return;
        menu.querySelectorAll('button').forEach(btn => {
            if (btn.getAttribute('data-preset') === presetKey) {
                btn.style.backgroundColor = '#666';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.backgroundColor = '#333';
                btn.style.fontWeight = 'normal';
            }
        });
    }

    GM_addStyle(`
        #faux-reader-settings-gear {
            position: fixed;
            bottom: 15px;
            left: 15px;
            font-size: 24px;
            width: 40px;
            height: 40px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10001;
            user-select: none;
        }
        #faux-reader-settings-menu {
            position: fixed;
            bottom: 65px;
            left: 15px;
            display: none;
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 5px;
            padding: 5px;
            z-index: 10000;
        }
        #faux-reader-settings-menu button {
            display: block;
            width: 120px;
            padding: 8px 12px;
            margin: 5px;
            border: none;
            background-color: #333;
            color: white;
            cursor: pointer;
            text-align: left;
            border-radius: 3px;
            transition: background-color 0.2s, font-weight 0.2s;
        }
        #faux-reader-settings-menu button:hover {
            background-color: #555;
        }
    `);

    window.addEventListener('DOMContentLoaded', () => {
        createSettingsMenu();
        const savedPreset = GM_getValue('selectedPreset', 'senka');
        applyStyle(savedPreset);
    });

})();
