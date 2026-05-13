"use strict";

(function placeholder(){
    const config = { childList: true, subtree: true };

    var docReady = new Promise((resolve) => {
        if (document.readyState === "complete") {
            resolve(null);
        }
        document.onreadystatechange = function (ev) {
            if (document.readyState === "complete") {
                resolve(ev);
            }
        }
    });

    docReady.then(() => {
        return new Promise((resolve) => {
            const tabsReadyObserver = new MutationObserver((mutationsList, observer) => {
                const targetNode = document.querySelector("legacy-windows-container");

                if (targetNode) {
                    observer.disconnect();
                    resolve(targetNode);
                }
            });

            tabsReadyObserver.observe(document.body, config);
        })
    }).then((targetNode) => {
        const session = JSON.parse(window.localStorage.getItem('SPA_auth_session'));

        const observer = new MutationObserver(function (mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                    for (const node of mutation.addedNodes) {
                        var result = searchTree(node, ".EditInventoryItemView");
                        if (result) {
                            console.log("Found inventory item dialog: ", result);
                            return;
                        }
                    }
                }
            }
        });

        observer.observe(targetNode, config);
    })

    function searchTree(element, matchingTitle) {
        if (!element || typeof element.querySelectorAll !== "function") {
            return null;
        }

        if (element.querySelectorAll(matchingTitle)) {
            console.log("Founded " + matchingTitle);
            return element.querySelectorAll(matchingTitle)[0];
        } else if (element.children != null) {
            var i;
            var result = null;
            for (i = 0; result == null && i < element.children.length; i++) {
                result = searchTree(element.children[i], matchingTitle);
            }
            return result;
        }
        return null;
    }
}());




