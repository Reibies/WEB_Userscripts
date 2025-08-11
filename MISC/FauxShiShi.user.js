// ==UserScript==
// @name         Faux-Shi-Shi
// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/WEB_Userscripts/MISC/FauxShiShi.user.js
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/WEB_Userscripts/MISC/FauxShiShi.user.js
// @version      2.0
// @description  Un-Scanlates your manga
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mangadex.org
// @match        https://mangadex.org/chapter/*
// @match        https://comick.io/comic/*
// @match        https://mangaplus.shueisha.co.jp/viewer/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const siteConfigs = {
        'mangadex.org': {
            containerSelector: '.md--page',
            imageSelector: '.md--page .img'
        },
        'comick.io': {
            containerSelector: 'div[id^="page"] .flex.justify-center',
            imageSelector: 'div[id^="page"] .flex.justify-center img'
        },
        'mangaplus.shueisha.co.jp': {
            containerSelector: '.zao-image-container',
            imageSelector: '.zao-image'
        }
    };

    const presets = {
        'senka': {
            name: 'Senka',
            filter: 'hue-rotate(-41deg) contrast(75%) sepia(15%) contrast(105%) hue-rotate(41deg)',
            textureOpacity: 0.15,
            blendMode: 'luminosity',
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
            filter: 'hue-rotate(-23deg) contrast(75%) sepia(35%) hue-rotate(23deg)',
            textureOpacity: 0.15,
            blendMode: 'luminosity',
            textureSvg: `
                <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'>
                    <filter id='noiseFilter'>
                        <feTurbulence type='fractalNoise' baseFrequency='.45' numOctaves='4' stitchTiles='stitch'/>
                        <feGaussianBlur stdDeviation='0.2'/>
                    </filter>
                    <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
                </svg>
            `
        },
        'e-ink': {
            name: 'E-Ink',
            filter: 'grayscale(100%) sepia(19%) hue-rotate(67deg) contrast(94%) brightness(96.8%) blur(0.2px);',
            textureOpacity: 0.4,
            blendMode: 'soft-light',
            textureSvg: `
                <svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'>
                    <filter id='noiseFilter'>
                        <feTurbulence type='fractalNoise' baseFrequency='.15' numOctaves='2' stitchTiles='stitch' />
                        <feGaussianBlur stdDeviation='0.3'/>
                    </filter>
                    <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
                </svg>
            `
        },
        'newsprint': {
            name: 'Newsprint',
            filter: 'hue-rotate(36deg) sepia(13%) hue-rotate(-36deg)',
            textureOpacity: 0.25,
            blendMode: 'multiply',
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
        'denoise': {
            name: 'Denoise',
            filter: 'blur(0.5px) brightness(103%) contrast(112%)',
            textureOpacity: 0,
            blendMode: 'normal',
            textureSvg: null
        },
        'disable': {
            name: 'Disable',
            filter: 'none',
            textureOpacity: 0,
            blendMode: 'normal',
            textureSvg: null
        }
    };

    let styleElement = null;

    function getTextureDataUri(preset) {
        if (!preset.textureSvg || preset.textureOpacity === 0) {
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
                position: relative !important;
                isolation: isolate;
                width: -moz-max-content !important;
                width: max-content !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            ${activeConfig.imageSelector} {
                filter: ${preset.filter};
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
                opacity: ${preset.textureOpacity};
                mix-blend-mode: ${preset.blendMode};
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
