// ==UserScript==
// @name TamperMonkeyRetroachievementsFixed
// @require https://github.com/abdolence/x2js/blob/master/xml2json.js
// @namespace https://archive.org/details/retroachievements_collection_v5
// @updateURL https://raw.githubusercontent.com/Galaxycorn/Tampermonkey-scripts/refs/heads/main/TamperMonkeyRetroachievementsFIXED.js
// @downloadURL https://raw.githubusercontent.com/Galaxycorn/Tampermonkey-scripts/refs/heads/main/TamperMonkeyRetroachievementsFIXED.js
// @version 1.0.1
// @description Add download links to retroachievements.org Supported Game Files page e.g. https://retroachievements.org/game/19339/hashes
// @author origin:wholee fixed by galaxycorn
// @match https://retroachievements.org/game/*/hashes
// @icon https://archive.org/images/glogo.jpg
// @grant none
// @run-at document-end
// ==/UserScript==

// 0.7: Updated archiveOrgLastModified URL
// 0.8: Don't call archive.org with every page refresh
// 0.9: Refactor code
// 0.9.1: Use {cache: 'no-cache'} for retroachievementsHashList download
// 0.9.2: Updated disclaimer
// 0.9.3: Split PS2 to new archive.org collection
// 0.9.4: Refactor PS2
// 0.9.5: Add note for FLYCAST ROMs
// 0.9.6: Added descriptive error messages
// 0.9.7: Added FBNeoZipLink
// 0.9.8: Due to page changes, updated disclaimer position
// 0.9.9: Cosmetic code changes, FBNeo link updates and disclaimer text
// 0.9.91: Cosmetic code changes, fix typo in PS2 download link
// 0.9.92: Separated NES and SNES to their own archive items
// 0.9.93: Separated Playstation
// 0.9.94: Separated Playstation Portable
// 0.9.95: Small code refactor
// 0.9.96: Added GameCube
// 0.9.97: HTML-encode links to archive.org
// 0.9.98: Remove HTML-encode links
// 1.0.00: Six months hiatus updates
// Update download link position due to site changes
// Add missing and Paid Hash info
// Split PlayStation 2 in two due to the size
// Rename NES and SNES collections to match ConsoleName update
// 1.0.01: wrapped download links in
// 1.0.1: Added gamecube + fixed issue with new website

window.addEventListener('load', () => {
    (function() {

        'use strict';
    
        const collectionName = 'retroachievements_collection';
        const mainCollectionItem = 'v5';
        const separateCollectionItems = ['NES-Famicom', 'SNES-Super Famicom', 'PlayStation', 'PlayStation 2', 'PlayStation Portable'];
    
        const collectionDownloadURL = 'https://archive.org/download/' + collectionName;
        const collectionDetailsURL = 'https://archive.org/details/' + collectionName + '_' + mainCollectionItem;
        const collectionLastModifiedURL = 'https://archive.org/metadata/' + collectionName + '_' + mainCollectionItem + '/item_last_updated';
        const FBNeoROMSDownloadURL = 'https://archive.org/download/2020_01_06_fbn/roms/';
        const FBNeoROMSDetailsURL = 'https://archive.org/details/2020_01_06_fbn/';
        const collectionGameCubeDownloadURL = 'https://archive.org/download/ngcgciso0z-ztm/';
    
        const retroachievementsHashList = 'TamperMonkeyRetroachievements.json';
    
        const updateInterval = 86400; // 24 hours
        const currentUnixTimestamp = Math.floor(Date.now() / 1000);
        const collectionLastUpdated = parseInt(localStorage.getItem('collectionLastUpdated'));
        const collectionLastModified = parseInt(localStorage.getItem('collectionLastModified'));
    
        // add disclaimer
        const disclaimer = 'Downloads are provided through ' + collectionDetailsURL + ' TamperMonkey scriptand are not endorsed or supported by retroachievements.orgPlease respect retroachievements.org\'s policies and do not post links to ROMs on their website or Discord.';
        document.querySelector("body > div:nth-child(5) > main > article > div.bg-embed.rounded.p-4.mt-2.flex.flex-col.gap-y-4");
        // console.log(collectionLastUpdated)
        // console.log(currentUnixTimestamp)
        // console.log(collectionLastUpdated + updateInterval)

        // parse gameCube data from my git
        if(!localStorage.getItem('CollectionGameCube')){
            getGameCube();
        }

        if (document.querySelector("#app > div > main > article > div > div.navpath.mb-3.hidden.sm\\:block > nav > ol > li:nth-child(3) > a").textContent == 'GameCube'){
            injectGamecubeData(JSON.parse(localStorage.getItem('CollectionGameCube')));
        }
        else {
            if(isNaN(collectionLastUpdated) || currentUnixTimestamp > collectionLastUpdated + updateInterval){
    
                fetch(collectionLastModifiedURL)
                    .then(response => response.json())
                    .then(output => {
        
                    if(output.result === undefined){ // archive.org returns 200/OK and {"error" : "*error description*"} on errors
        
                        throw 'Can\'t get last modified date from archive.org. ' + output.error;
        
                    } else {
        
                        localStorage.setItem('collectionLastModified', output.result);
        
                    }
                    if(parseInt(output.result) === collectionLastModified){ // don't download retroachievementsHashList if we already have the latest
        
                        localStorage.setItem('collectionLastUpdated', currentUnixTimestamp);
                        injectArchiveGames(JSON.parse(localStorage.getItem('collectionROMList')));
        
                    } else {
        
                        fetch(collectionDownloadURL + '_' + mainCollectionItem + '/' + retroachievementsHashList, {cache: 'no-cache'})
                            .then(response => response.json())
                            .then(output => {
                                injectArchiveGames(output);
                                localStorage.setItem('collectionROMList', JSON.stringify(output));
                                localStorage.setItem('collectionLastUpdated', currentUnixTimestamp);
                        })
                            .catch(error => {
                                console.log(error);
                                // if we can't download retroachievementsHashList
                                injectArchiveGames(null, true, 'Can\'t get retroachievements hash list from archive.org. Please try again later.');
                                localStorage.removeItem('collectionLastModified');
                                localStorage.removeItem('collectionLastUpdated');
                                localStorage.removeItem('collectionROMList');
                        });
                    }
                })
                    .catch(error => {
        
                    console.log(error);
                    // we still have to let the end user know that script is working but archive.org is not
                    injectArchiveGames(null, true, 'Can\'t get required information from archive.org. Please try again later.');
                    localStorage.removeItem('collectionLastModified');
                    localStorage.removeItem('collectionLastUpdated');
                    localStorage.removeItem('collectionROMList');
        
                });
        
            } else {
        
                injectArchiveGames(JSON.parse(localStorage.getItem('collectionROMList')));
        
            }
        }
        

        function getGameCube() {
            fetch("https://raw.githubusercontent.com/Galaxycorn/Tampermonkey-scripts/refs/heads/main/gamecubeList.json", {cache: 'no-cache'})
                        .then(response => response.json())
                        .then(output => {
                        console.log(output);
                        injectArchiveGames(output);
                        localStorage.setItem('CollectionGameCube', JSON.stringify(output));
                        })
                        .catch(error => {
                            
                            console.log(error);
                            // if we can't download retroachievementsHashList
                            injectArchiveGames(null, true, 'Can\'t get gamecube game list from archive.org. Please try again later.');
                            localStorage.removeItem('CollectionGameCube');
                        });
        }

        function injectArchiveGames(gameData, boolArchiveOrgDown = false, message = ''){
            let hashLists = document.querySelector("#app > div > main > article > div > div.flex.flex-col.gap-5 > div.flex.flex-col.gap-1 > div > ul").getElementsByTagName('li'); // get hash list
            let gameId = window.location.pathname.split("/")[2]; // get gameID from URL
            for(let x = 0; x < hashLists.length; ++x) {
                let retroHashNode = hashLists[x].querySelector("div > p");
                let retroHash = retroHashNode.innerText.trim().toUpperCase();
                retroHashNode.innerText = retroHash;// fix hash capitalization on the page
    
                if(boolArchiveOrgDown){
    
                    retroHashNode.insertAdjacentHTML("beforeend", '' + message + '');
    
                } else {
                    try {
                       
                        if (gameData[gameId] != undefined && gameData[gameId][0][retroHash] != undefined){
                            let hashData = gameData[gameId][0][retroHash]; // for now, we only have one item in the gameData[gameId] array
                            let link, appendExtraInfo = '';
    
                            let ROMdataArray = hashData.split('/');
                            let system = ROMdataArray[0];
                            let fileName = ROMdataArray[ROMdataArray.length - 1];
    
                            switch(true) {
    
                                case hashData.indexOf('\\') !== -1: // '\' is used to easily identify FBNeo ROMs in retroachievementsHashList, 'arcade\10yard.zip', 'nes\finalfaniii.zip'
    
                                    ROMdataArray = hashData.split('\\');
                                    system = ROMdataArray[0].replace('megadriv', 'megadrive');
                                    fileName = ROMdataArray[ROMdataArray.length - 1];
                                    
                                    // example link: https://archive.org/download/2020_01_06_fbn/roms/nes.zip/nes/finalfaniii.zip
                                    link = FBNeoROMSDownloadURL + system + '.zip/' + system + '/' + fileName;
                                    appendExtraInfo = 'FBNeo ' + system.toUpperCase() + ' ROM set maintained by a 3rd party at ' + FBNeoROMSDetailsURL + 'Download FULL ' + system.toUpperCase() + ' SET: ' + system + '.zip'; // add a note for FBNeo ROMs
    
                                    retroHashNode.insertAdjacentHTML("beforeend", '<p><a href="' + link + '">'+'Download game'+ '</a></p>');
                                    break;
    
                                case hashData.startsWith('Dreamcast/!_flycast/'):
    
                                    link = collectionDownloadURL + '_' + mainCollectionItem + '/' + hashData;
                                    appendExtraInfo = 'Use https://github.com/flyinghead/flycast or https://github.com/libretro/flycast to run this ROM.'; // add a note for FLYCAST ROMs
    
                                    retroHashNode.insertAdjacentHTML("beforeend", '<p><a href="' + link + '">'+'Download game'+ '</a></p>');
                                    break;
    
                                case separateCollectionItems.includes(system):
    
                                    // PlayStation 2 is split based on filename over two archive.org items due to it's size
                                    if(system == 'PlayStation 2'){
                                        /^[n-z].*$/gim.test(fileName) ? system = 'PlayStation_2_N-Z' : system = 'PlayStation_2_A-M';
                                    }
    
                                    link = collectionDownloadURL + '_' + system.replace(' ', '_') + '/' + hashData; // archive.org is not allowing spaces in item name
                                    //appendExtraInfo = 'Download provided through ' + collectionDetailsURL + '';
                                    console.log(link);
                                    console.log(window);
                                    retroHashNode.insertAdjacentHTML("beforeend", '<p><a href="' + link + '">'+'Download game'+ '</a></p>');
                                    break;
    
                                case hashData.startsWith('missing'):
    
                                    // TODO
                                    retroHashNode.insertAdjacentHTML("beforeend", '');
                                    break;
    
                                case hashData.startsWith('paid'):
    
                                    //TODO
                                    retroHashNode.insertAdjacentHTML("beforeend", '');
                                    break;
    
                                case hashData.startsWith('ignore'):
    
                                    //TODO
                                    retroHashNode.insertAdjacentHTML("beforeend", '');
                                    break;
    
                                default:
    
                                    link = collectionDownloadURL + '_' + mainCollectionItem + '/' + hashData;
                                    //appendExtraInfo = 'Download provided through ' + collectionDetailsURL + '';
    
                                    retroHashNode.insertAdjacentHTML("beforeend", '<p><a href="' + link + '">'+'Download game'+ '</a></p>');
                                    break;
                            }
    
                        } else {
    
                            retroHashNode.insertAdjacentHTML("beforeend", '<p>Download not available.</p>');
    
                        }
    
                    } catch(error) {
    
                        console.log(error);
    
                    }
                }
            }
        }
    })();

    function injectGamecubeData(gameData){
        let gameElement = document.querySelector("#app > div > main > article > div > div.flex.flex-col.gap-5 > div.flex.flex-col.gap-1 > div > ul > li:nth-child(1) > p > span");
        let gameNames = gameElement.textContent;
        let gameCorretedName = gameNames.split(')')[0].replaceAll(/[^\w\s]+/g, '.').replaceAll(/\s+/g, '.').replaceAll(/\.+/g, '.');;
        console.log(gameCorretedName)
            try {
                const game = gameData.files.file.find(game => game._name.split('.NGC-ZTM.rar')[0] === gameCorretedName);
                console.log(game)
                if (game !== undefined) {
                    link = 'https://archive.org/download/ngcgciso0z-ztm/' + '/' + gameCorretedName + '.NGC-ZTM.rar';
                    if (game.filecount > 1) gameElement.insertAdjacentHTML("beforeend", '<p><a href="' + link + '">'+'Download game for both discs, only USA roms are available for the moment'+ '</a></p>');
                    else gameElement.insertAdjacentHTML("beforeend", '<p><a href="' + link + '">'+'Download game, only USA roms are available for the moment'+ '</a></p>');
                }
                else {
                    console.log("else")
                    gameElement.insertAdjacentHTML("beforeend", '<p style="color:#FF0000"><b>Game not found, only USA roms are available for the moment</b></p>');
                }
                
            } catch(error) {
                console.log(error);
            } 
    }
});
