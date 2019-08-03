# Mangaupdates-External-Links-BadFix
Fixes External link script for Mangaupdates in a poor but usable way, I fully welcome a better, more permanent fix to this fix.

[Original](https://greasyfork.org/en/scripts/39045-mangaupdates-external-links2)

[Download](https://github.com/Reibies/Mangaupdates-External-Links-BadFix/raw/master/EXTlink_fix.user.js)



if you want to remove a link for example MAL, delete the lines between "//MAL" and "// Mangadex link" you can also add links by copying a search link from the site you want, removing the searched query in that link and replace X with the title you want to show and y with the link, you can look at the contained links for an example.


//x
pageNames.push("x");
pageAdressBeginning.push("y");
searchName.push(encodeURIComponent(title));
pageAdressEnding.push("");
