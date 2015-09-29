/* globals self, window */
/* jshint jquery:true */

const LIST_MARGIN = 20;

let bookmarkCount;


function __getOptimalTileLayout(bookmarkCount, containerWidth, containerHeight) {
    let newLineCount = 0;
    let newTileHeight = 0;
    let newTileWidth = 0;
    let newTilesPerLine = 0;

    let previousLineCount = 0;
    let previousTileHeight = 0;
    let previousTileWidth = 0;
    let previousTilesPerLine = 0;

    while (newTileWidth >= previousTileWidth && newTileWidth <= self.options.THUMBNAIL_WIDTH) {
        previousLineCount = newLineCount;
        previousTileHeight = newTileHeight;
        previousTileWidth = newTileWidth;
        previousTilesPerLine = newTilesPerLine;

        newTilesPerLine++;
        newLineCount = Math.ceil(bookmarkCount / newTilesPerLine);
        newTileWidth = Math.min(
            self.options.THUMBNAIL_WIDTH,
            Math.floor(containerWidth / newTilesPerLine)
        );
        newTileHeight = Math.floor(newTileWidth / 3 * 2);
        if (newTileHeight * newLineCount > containerHeight) {
            newTileHeight = Math.min(
                Math.floor(containerHeight / newLineCount),
                self.options.THUMBNAIL_WIDTH / 3 * 2
            );
            newTileWidth = Math.floor(newTileHeight / 2 * 3);
        }
    }
    return [previousTilesPerLine, previousLineCount, previousTileWidth, previousTileHeight];
}


function __setStyle(layout, windowWidth, windowHeight) {
    console.log("Setting size", layout, windowWidth, windowHeight);
    let [tilesPerLine, lineCount, tileWidth, tileHeight] = layout;
    let listWidth = tileWidth * tilesPerLine;
    let listHeight = tileHeight * lineCount;

    let horizontalPadding = Math.ceil((windowWidth - listWidth) / 2) + "px";
    let verticalPadding = Math.floor((windowHeight - listHeight) / 2) + "px";

    let labelHeight = 5 + tileHeight / 20;
    let busyImage = tileWidth > 150 ? "busy.png" : "busy-small.png";
    let styleString = "" +
        "li {" +
            "max-width: " + self.options.THUMBNAIL_WIDTH + "px;" +
            "width: calc(100% / " + tilesPerLine + ");" +
        "}" +
        "\n" +
        "ol {" +
            "width: calc(100% - " + LIST_MARGIN + "px);" +
            "height: calc(100% - " + LIST_MARGIN + "px);" +
            "margin: " + LIST_MARGIN / 2 + "px;" +
            "padding: calc(" + verticalPadding + ") calc(" + horizontalPadding + ") 0;" +
        "}" +
        "\n" +
        "div {" +
            "height: " + labelHeight * 2 + "px;" +
        "}" +
        "\n" +
        "span {" +
            "font-size: " + labelHeight + "px;" +
        "}" +
        "\n" +
        "a.busy {" +
            "background-image: url('" + busyImage + "');" +
        "}" +
    "";
    $("style#sizingStyle").text(styleString);
}

function updateStyle(styleString) {
    console.log("Update style");
    $("style#givenStyle").text(styleString);
}

function makeLayout() {
    if (!bookmarkCount) {
        return;
    }
    console.log("Calculate layout");
    let containerWidth = window.innerWidth - LIST_MARGIN;
    let containerHeight = window.innerHeight - LIST_MARGIN;
    let layout = __getOptimalTileLayout(bookmarkCount, containerWidth, containerHeight);
    __setStyle(layout, containerWidth, containerHeight);
}

let debounceTimeout;
function debouncedLayout() {
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(makeLayout, 300);
}

function __makeHTMLListItem(bookmark) {
    return '' +
        '<li class="keepAspectRatio">' +
            '<a href="' + bookmark.url + '">' +
                '<img src="' + bookmark.thumbnail + '">' +
                '<div class="absoluteBottom">' +
                    '<span class="absoluteBottom">' + bookmark.title + '</span>' +
                '</div>' +
            '</a>' +
        '</li>' +
    '';
}

function __updateHTMLList(listString) {
    let list = window.document.getElementsByTagName("ol")[0];
    list.innerHTML = listString;
}

function updateBookmarks(bookmarks) {
    console.log("Update " + bookmarks.length + " bookmarks");
    let updatedList = [];
    for (let bookmark of bookmarks) {
        updatedList.push(__makeHTMLListItem(bookmark));
    }
    __updateHTMLList(updatedList.join("\n"));
}

function __applyOnMatches(someFunction, urlMap) {
    $("a").each(function(index) {
        let anchor = $(this);
        let bookmarkURL = anchor.attr("href");
        if (urlMap[bookmarkURL]) {
            console.log("Found match at index " + index);
            someFunction(anchor, bookmarkURL, urlMap);
        }
    });
}

function __setBusy(anchor) {
    anchor.addClass("busy");
}

function setBusy(bookmarkURL) {
    let urlMap = {};
    urlMap[bookmarkURL] = true;
    __applyOnMatches(__setBusy, urlMap);
}

function __updateThumbnail(anchor, bookmarkURL, thumbnails) {
    console.log("Update thumbnail for " + bookmarkURL);
    let thumbnailURL = thumbnails[bookmarkURL];
    anchor.children("img").attr("src", thumbnailURL);
    anchor.removeClass("busy");
}

function updateThumbnails(thumbnails) {
    __applyOnMatches(__updateThumbnail, thumbnails);
}

self.port.on("init", function() {
    makeLayout();
    window.addEventListener("resize", debouncedLayout, true);
});

self.port.on("styleUpdated", function(styleString) {
    updateStyle(styleString);
});

self.port.on("bookmarksUpdated", function(bookmarks) {
    bookmarkCount = bookmarks.length;
    makeLayout();
    updateBookmarks(bookmarks);
});

self.port.on("updatingThumbnail", function(bookmarkURL) {
    setBusy(bookmarkURL);
});

self.port.on("thumbnailsUpdated", function(thumbnails) {
    updateThumbnails(thumbnails);
});