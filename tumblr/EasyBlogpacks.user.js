// ==UserScript==
// @name         EasyBlogpacks
// @version      1.69
// @author       Reibies
// @namespace    https://github.com/Reibies
// @downloadURL  https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/tumblr/EasyBlogpacks.user.js
// @updateURL    https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/tumblr/EasyBlogpacks.user.js
// @description  Manage and route to native Tumblr blogpack feeds natively.
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tumblr.com
// @match        *://*.tumblr.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    /* ANCHOR: Font & Style Injection */
    const initStyles = () => {
        GM_addStyle(`
            @font-face {
                font-family: 'tumblr-icons';
                src: url("https://assets.tumblr.com/fonts/tumblr-icons/tumblr-icons_8a421f9ad671642549106ef53964c839.woff2?v=10c2e44f8f62635ebbcdb60b001c5800") format("woff2");
                font-style: normal;
                font-weight: 400;
            }

            .ti:before {
                font-family: 'tumblr-icons', Blank !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                font-style: normal;
                font-variant: normal;
                font-weight: 400;
                text-decoration: none;
                text-transform: none;
                display: block;
                text-align: center;
            }

            .ti-trash:before { content: "\\EA21"; }
            .ti-edit:before { content: "\\EA28"; }
            .ti-plus:before { content: "\\EA69"; }
            .ti-gear:before { content: "\\EA41"; }
            .ti-add-user:before { content: "\\EA45"; }
            .ti-feed:before { content: "\\EA22"; }

            .bp-feed-strip { display: flex; gap: 8px; overflow-x: auto; padding: 10px 0; align-items: center; scrollbar-width: none; }
            .bp-feed-strip::-webkit-scrollbar { display: none; }
            .bp-feed-btn { display: inline-flex; align-items: center; gap: 8px; background: var(--color-bluespace-card-background); border: 1px solid rgba(var(--white-on-dark), 0.2); border-radius: 20px; padding: 6px 14px; font-family: var(--font-family); font-weight: 600; font-size: 14px; text-decoration: none; color: var(--color-text); white-space: nowrap; transition: 0.2s; cursor: pointer; }
            .bp-feed-btn:hover { background: rgba(var(--white-on-dark), 0.1); }
            .bp-feed-btn.bp-active { background: rgb(var(--deprecated-accent)); color: #fff; border-color: transparent; }
            .bp-feed-btn .ti { font-size: 18px; }

            .bp-header-hover-target .bp-dash-icon {
                font-size: 24px;
                color: var(--color-text);
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px;
                display: block;
                text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease-in-out;
            }
            .bp-header-hover-target:hover .bp-dash-icon,
            .bp-header-hover-target .bp-dash-icon.bp-menu-open {
                opacity: 1;
                pointer-events: auto;
            }
            .bp-dash-icon.bp-active { color: rgb(var(--deprecated-accent)); }

            .tmblr-iframe--unified-controls {
                transform: translateX(-40px) !important;
                transition: transform 0.3s ease;
            }
            .bp-iframe-ext {
                position: fixed;
                z-index: 2147483647;
                pointer-events: none;
                display: flex;
            }
            .bp-iframe-ext-btn {
                pointer-events: auto;
                cursor: pointer;
                background: transparent;
                border: none;
                width: 24px;
                height: 24px;
                padding: 0;
                color: #fff;
                font-size: 24px;
                line-height: 24px;
                text-shadow: 1px 1px 1px rgba(68, 68, 68, 0.4), -1px -1px 1px rgba(68, 68, 68, 0.4), -1px 1px 1px rgba(68, 68, 68, 0.4), 1px -1px 1px rgba(68, 68, 68, 0.4);
            }
            .bp-iframe-ext-btn.bp-active { color: rgb(var(--deprecated-accent)); }

            .bp-profile-btn {
                border-radius: 50%;
                border: 2px solid var(--blog-link-color-40, rgba(var(--white-on-dark), 0.2));
                background-color: var(--button-bg, transparent);
                color: var(--button-text, var(--icon-color-primary));
                width: 36px;
                height: 36px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                margin-left: 8px;
            }
            .bp-profile-btn:hover {
                background-color: rgba(var(--white-on-dark), 0.1);
            }
            .bp-profile-btn.bp-active {
                color: rgb(var(--deprecated-accent));
                border-color: rgb(var(--deprecated-accent));
            }
            .bp-profile-btn .ti {
                font-size: 20px;
            }

            .bp-menu { position: absolute; z-index: 100001; background: var(--content-panel); color: var(--color-text); border: 1px solid rgba(var(--white-on-dark), 0.2); border-radius: 8px; padding: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; flex-direction: column; min-width: 160px; font-family: var(--font-family); }
            .bp-menu label { display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; padding: 8px; border-radius: 4px; }
            .bp-menu label:hover { background: rgba(var(--white-on-dark), 0.1); }
            .bp-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--content-panel); color: var(--color-text); padding: 24px; border-radius: 12px; z-index: 100001; width: 340px; border: 1px solid rgba(var(--white-on-dark), 0.2); box-shadow: 0 20px 50px rgba(0,0,0,0.5); font-family: var(--font-family); }
            .bp-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100000; }
        `);
    };

    /* ANCHOR: Data Logic */
    const getCats = () => GM_getValue('categories', { 'mutuals': [], 'favorites': [] });
    const setCats = (c) => GM_setValue('categories', c);
    const getAssigned = (u) => Object.entries(getCats()).filter(([_, b]) => b.includes(u)).map(([n]) => n);

    let activeFilter = 'all';
    let activeMenuClose = null;

    const initRouteState = () => {
        if (!window.location.pathname.includes('/timeline/blogpack')) return;
        const b = new URLSearchParams(window.location.search).get('blogs') || '';
        activeFilter = Object.keys(getCats()).find(n => getCats()[n].join(',') === b) || (b ? 'custom' : 'all');
    };

    /* ANCHOR: UI Logic */
    const toggleTag = (user, cat, isChecked) => {
        const data = getCats();
        if (isChecked && !data[cat].includes(user)) data[cat].push(user);
        else if (!isChecked) data[cat] = data[cat].filter(i => i !== user);
        setCats(data);
        if (activeFilter === cat) window.location.href = `/timeline/blogpack?blogs=${encodeURIComponent(data[cat].join(','))}`;
        else document.querySelectorAll('.bp-feed-strip').forEach(() => renderStrips());
    };

    const renderMenu = (anchor, user) => {
        const isAlreadyOpen = anchor.classList.contains('bp-menu-open');

        // INFO: Nuke existing menus
        document.getElementById('bp-active-tag-menu')?.remove();
        document.querySelectorAll('.bp-menu-open').forEach(el => el.classList.remove('bp-menu-open'));

        if (activeMenuClose) {
            document.removeEventListener('click', activeMenuClose, true);
            activeMenuClose = null;
        }

        // INFO: True toggle
        if (isAlreadyOpen) return;

        anchor.classList.add('bp-menu-open');

        const m = document.createElement('div');
        m.id = 'bp-active-tag-menu';
        m.className = 'bp-menu';

        const r = anchor.getBoundingClientRect();
        m.style.top = `${r.bottom + window.scrollY + 8}px`;
        const leftPos = r.left + window.scrollX - 80;
        m.style.left = `${Math.max(10, Math.min(leftPos, window.innerWidth - 180))}px`;

        const has = getAssigned(user);
        const cats = Object.keys(getCats());

        if (cats.length === 0) {
            m.innerHTML = '<span style="font-size:12px;opacity:0.6;padding:10px;text-align:center;">No Blogpacks.</span>';
        } else {
            cats.forEach(c => {
                const l = document.createElement('label');
                l.innerHTML = `<input type="checkbox" ${has.includes(c) ? 'checked' : ''}> <span>${c}</span>`;
                l.querySelector('input').onchange = (e) => {
                    toggleTag(user, c, e.target.checked);
                    anchor.classList.toggle('bp-active', getAssigned(user).length > 0);
                };
                m.append(l);
            });
        }

        document.body.append(m);

        activeMenuClose = (e) => {
            if (!m.contains(e.target) && !anchor.contains(e.target)) {
                m.remove();
                anchor.classList.remove('bp-menu-open');
                document.removeEventListener('click', activeMenuClose, true);
                activeMenuClose = null;
            }
        };

        // INFO: capture phase greed
        setTimeout(() => document.addEventListener('click', activeMenuClose, true), 0);
    };

    const renderStrips = () => {
        document.querySelectorAll('.bp-feed-strip').forEach(s => {
            const cats = getCats();
            s.innerHTML = `
                <a href="/dashboard" class="bp-feed-btn ${activeFilter === 'all' ? 'bp-active' : ''}"><i class="ti ti-feed"></i> All</a>
                ${Object.keys(cats).map(n => `<a href="/timeline/blogpack?blogs=${encodeURIComponent(cats[n].join(','))}" class="bp-feed-btn ${activeFilter === n ? 'bp-active' : ''}">${n}</a>`).join('')}
                <button class="bp-feed-btn bp-settings-btn"><i class="ti ti-gear"></i></button>
            `;
            s.querySelector('.bp-settings-btn').onclick = renderSettings;
        });
    };

    const renderSettings = () => {
        document.getElementById('bp-modal-root')?.remove();
        const root = document.createElement('div');
        root.id = 'bp-modal-root';
        root.innerHTML = `
            <div class="bp-backdrop"></div>
            <div class="bp-modal">
                <h3 style="margin:0 0 20px 0; font-size:18px;">Manage Blogpacks</h3>
                <form id="bp-add" style="display:flex;gap:8px;margin-bottom:15px;">
                    <input type="text" placeholder="New blogpack..." required style="flex:1;padding:10px;border-radius:6px;border:1px solid rgba(var(--white-on-dark),0.2);background:rgba(var(--white-on-dark),0.05);color:inherit;font-family:inherit;">
                    <button class="bp-feed-btn ti ti-plus" type="submit" style="padding:10px;"></button>
                </form>
                <div id="bp-list-container" style="max-height:300px;overflow-y:auto;padding-right:5px;"></div>

                <div style="display:flex; gap:8px; margin-top:20px; padding-top:20px; border-top:1px solid rgba(var(--white-on-dark), 0.1);">
                    <button id="bp-btn-imp" class="bp-feed-btn" style="flex:1;justify-content:center;">Import JSON</button>
                    <button id="bp-btn-exp" class="bp-feed-btn" style="flex:1;justify-content:center;">Export JSON</button>
                </div>
            </div>`;

        const listCont = root.querySelector('#bp-list-container');
        Object.keys(getCats()).forEach(n => {
            const li = document.createElement('div');
            li.style = "display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(var(--white-on-dark),0.1);";
            li.innerHTML = `<strong>${n}</strong><div><button class="bp-dash-icon ti ti-edit" style="display:inline-block;font-size:18px;opacity:1;pointer-events:auto;"></button><button class="bp-dash-icon ti ti-trash" style="display:inline-block;font-size:18px;color:rgb(var(--red));opacity:1;pointer-events:auto;"></button></div>`;
            li.querySelector('.ti-edit').onclick = () => {
                const nn = prompt('Rename:', n);
                if(nn && nn !== n && !getCats()[nn]) { const d = getCats(); d[nn] = d[n]; delete d[n]; setCats(d); renderStrips(); renderSettings(); }
            };
            li.querySelector('.ti-trash').onclick = () => {
                if(confirm(`Delete "${n}"?`)) { const d = getCats(); delete d[n]; setCats(d); renderStrips(); renderSettings(); }
            };
            listCont.append(li);
        });

        root.querySelector('.bp-backdrop').onclick = () => root.remove();
        root.querySelector('#bp-add').onsubmit = (e) => {
            e.preventDefault();
            const v = e.target.querySelector('input').value.trim();
            if(v && !getCats()[v]) { const d = getCats(); d[v] = []; setCats(d); renderStrips(); renderSettings(); }
        };
        root.querySelector('#bp-btn-exp').onclick = () => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(getCats())], { type: 'application/json' }));
            a.download = 'tumblr_blogpacks.json'; a.click();
        };
        root.querySelector('#bp-btn-imp').onclick = () => {
            const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
            inp.onchange = (e) => {
                const fr = new FileReader();
                fr.onload = (ev) => { try { setCats(JSON.parse(ev.target.result)); location.reload(); } catch { alert('Invalid JSON.'); } };
                fr.readAsText(e.target.files[0]);
            };
            inp.click();
        };

        document.body.append(root);
    };

    /* ANCHOR: Iframe Hook */
    const injectExtControl = (ifr) => {
        const u = new URL(ifr.src).searchParams.get('tumblelogName');
        if (!u || ifr.hasAttribute('data-bp')) return;
        ifr.setAttribute('data-bp', 'true');

        const container = document.createElement('div');
        container.className = 'bp-iframe-ext';
        container.innerHTML = `<button class="bp-iframe-ext-btn ti ti-add-user"></button>`;
        const btn = container.querySelector('button');

        const updatePos = () => {
            const r = ifr.getBoundingClientRect();
            if (r.width === 0) return;
            container.style.top = `${r.top + 15}px`;
            container.style.right = `8px`;
            btn.classList.toggle('bp-active', getAssigned(u).length > 0);
        };

        btn.onclick = (e) => { e.stopPropagation(); renderMenu(btn, u); };
        document.body.append(container);

        const ro = new ResizeObserver(updatePos);
        ro.observe(ifr);
        window.addEventListener('scroll', updatePos, { passive: true });

        requestAnimationFrame(() => {
            updatePos();
            setTimeout(updatePos, 100);
            setTimeout(updatePos, 500);
        });
    };

    /* ANCHOR: Observer */
    const runObserver = () => {
        const dash = document.querySelector('.wttFd:not(.bp-injected)');
        if (dash) {
            dash.classList.add('bp-injected');
            dash.insertAdjacentHTML('afterend', '<div class="bp-feed-strip"></div>');
            renderStrips();
        }
        if (window.location.pathname.includes('/timeline/blogpack')) {
            const title = document.querySelector('div[data-cell-id*="timelineObject:title:"]:not(.bp-swapped)');
            if (title) {
                title.classList.add('bp-swapped');
                (title.querySelector('.ge_yK') || title).innerHTML = '<div class="bp-feed-strip"></div>';
                renderStrips();
            }
        }

        document.querySelectorAll('header.DEkbl:not(.bp-processed), div._7Vla9:not(.bp-processed)').forEach(header => {
            header.classList.add('bp-processed', 'bp-header-hover-target');

            const ctrl = header.querySelector('.RIcm_');
            const link = header.querySelector('a[href^="/"]');

            if (ctrl && link) {
                const hrefParts = link.getAttribute('href').split('/');
                const user = hrefParts[1];

                if (user && user !== "post" && user !== "tagged") {
                    const btn = document.createElement('button');
                    btn.className = 'bp-dash-icon ti ti-add-user';
                    btn.classList.toggle('bp-active', getAssigned(user).length > 0);
                    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); renderMenu(btn, user); };
                    ctrl.prepend(btn);
                }
            }
        });

        document.querySelectorAll('div.uk9FI:not(.bp-processed)').forEach(container => {
            container.classList.add('bp-processed');
            const header = container.closest('.F8bg3') || container.parentElement;
            const link = header.querySelector('a.Da0mp[href^="/"]');

            if (link) {
                const user = link.getAttribute('href').replace(/\//g, '').trim();
                if (user) {
                    const btn = document.createElement('button');
                    btn.className = 'bp-profile-btn ti ti-add-user';
                    btn.classList.toggle('bp-active', getAssigned(user).length > 0);
                    btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); renderMenu(btn, user); };
                    container.appendChild(btn);
                }
            }
        });

        document.querySelectorAll('iframe.tmblr-iframe--unified-controls').forEach(injectExtControl);
    };

    /* ANCHOR: Start */
    if (window.self === window.top) {
        initStyles();
        initRouteState();
        const obs = new MutationObserver(() => requestAnimationFrame(runObserver));
        obs.observe(document.body, { childList: true, subtree: true });
        runObserver();
    }
})();
