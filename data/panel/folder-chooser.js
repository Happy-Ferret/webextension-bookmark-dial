/* global addon */

function initSelect() {
    let select = document.querySelector("select");

    function getSelectValue() {
        return select.options[select.selectedIndex].value;
    }

    function idForValue(value) {
        return value.replace(/[/ ]/g, "").toLowerCase();
    }

    function buildOption(value, label, defaultValue) {
        let selected = value === defaultValue ? " selected='selected'" : "";

        // substract 2 for leading and trailing slash;
        let level = (value.match(/\//g) || []).length - 2;
        return `
            <option
                ${selected}
                class="level${level}"
                id="${idForValue(value)}"
                value="${value}"
            >
                ${label}
            </option>
        `;
    }

    function fillSelect() {
        let listOfOptions = [];
        for (let tuple of addon.options.bookmarkFolders) {
            let [value, label] = tuple;
            listOfOptions.push(buildOption(value, label, addon.options.chosenFolder));
        }

        select.innerHTML = listOfOptions.join("\n");
    }

    if (addon.options.saveOnSelect) {
        select.addEventListener("change", function() {
            addon.port.emit("save", getSelectValue());
        });
    }

    fillSelect();
}

document.addEventListener("DOMContentLoaded", initSelect, false);
