# Userscripts & Styles
Userscript requirements: [Tampermonkey](https://www.tampermonkey.net/)
Userstyle/CSS requirements: [Stylus](https://addons.mozilla.org/en-US/firefox/addon/styl-us/)

Image previews will be within the dropdown arrows.

---

## Mangaupdates

### [Cover Previewer](https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_hover_cover.user.js)
<details>
<summary>Uses the official API so it's faster and better than the older versions of this but it's bare bones so no options (yet)</summary>
<img src="https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/cover_hover.png" width="400">
</details>

### [External Links](https://raw.githubusercontent.com/Reibies/WEB_Userscripts/refs/heads/master/Mangaupdates/MU_Ext_links.user.js)
<details>
<summary>Takes all links from description and makes them buttons for easy access/ 2 external site searches</summary>
<img src="https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_externalLinks.png" width="400">
</details>

### [GridView](https://raw.githubusercontent.com/Reibies/WEB_Userscripts/refs/heads/master/Mangaupdates/MU_GridView.user.js)
<details>
<summary>Allows you to view a more modern(2005) version of mangaupdates! Your lists will have covers and all the same functionality.</summary>

- Version 3.0! Finally working(?)
- RECOMENDATION: Set all your lists to `Show (under 100) per page` It's not necessary but obviously a grid is longer and more laggy than a list 
- You can update, change score, and move all via the API
- Clicking the bottom area areound the title acts as the checkbox/select the orange border means it's selected
- Clicking the upper left or right areas expand input for score and current read
- Native MU variables were used for the colors so if you have css that changes things try and ovveride those
</details>
<img src="https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/GridView2.png" width="500">

### Custom Style Sheets!
[IconFix](https://github.com/Reibies/WEB_Userscripts/raw/refs/heads/master/Mangaupdates/MU__iconFixes.user.css) /
[Vanilla Enhanced](https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/mangaupdates\MU__vanillaEnhanced.user.css)

- CSS that simply tries to modernize the look of Mangaupdates whithout being an overhaul. WIP.
- Requirement: Stylus > Manage > Options > Advanced > `Circumvent CSP 'style-src' via adoptedSty­leSheets` enabled

| iconFix | Vanilla Enhanced |
| --- | --- |
| <img src="https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/iconFix.webp" width="400">   |  <img src="https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/Mangaupdates/MU_VH.webp" width="400">    |

---

## tumblr

### Tumblr Blogpack Manager[Broken and in need of an overhaul]
<details>
<summary>Lets you curate your blogpack lists on tumblr a hidden feature that creates custom feeds based on a comma separated list of  usernames.</summary>
Currently removed until I can properly maintain and fix it but I have not been using tumblr much lately
</details>

---

## Misc
### [FauxShishi](https://github.com/Reibies/WEB_Userscripts/raw/refs/heads/master/MISC/FauxShiShi.user.js)
<details>
<summary>Lets you simulate real paper scans on—currently—mangadex</summary>

**Modes**
- Senka: greyish and faded manga stock
- Shimbun: Japanese newsprint stock
- e-ink: (bad right now since I don't have an e-reader to cross refrence)
- Newsprint: Old Sunday funnies style, it leans salmonish and the paper grain is more horizontally coarse and chromatic
- Denoise: just ups the contrast a bit
- "Filter:" is what you alter for the tinting and contrast effects if you feel like it's subpar on your screen (My tip is you can stack and re-order filters)
- This used to be a userstyle that I converted to JS for convenience so this is probably a sub-par way of handling it.

![](https://github.com/Reibies/WEB_Userscripts/blob/master/MISC/img/FauxShishi.png?raw=true)

[Manga Source](https://www.mangaupdates.com/series/imd4qxa/tensei-akujo-no-kuro-rekishi)
</details>

### [Oglaf ALT and Title text viewer](https://raw.githubusercontent.com/Reibies/WEB_Userscripts/master/MISC/Oglaf%20ALT.user.js)

Allows you to see the hidden text when clicking the "ALT TEXT" button on the webcomic site [Oglaf](https://www.oglaf.com/)

