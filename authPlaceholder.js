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
                const targetNode = document.querySelector(".opened-modules > .modules");

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
                        var result = searchTree(node, "external-ui-component");
                        if (result) {
                            result.src = result.src +
                                "&userName=" + session.userName +
                                "&sessionUserId=" + session.sessionUserId +
                                "&superAdmin=" + session.superAdmin +
                                "&userToken=" + session.token +
                                "&server=" + session.server;

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

        if (element.querySelectorAll(matchingTitle) && element.baseURI.indexOf("AppName") > - 1) {
            console.log("Founded external-ui-component");
            return element.querySelectorAll("iframe")[0];
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




