"use strict";

define(function (require) {

    $(document).ready(function ($scope) {
        const config = { childList: true, subtree: true };

        function searchTree(element, matchingTitle) {
            if (element && element.querySelectorAll(".status-container") && element.baseURI.indexOf("ProcessedOrders") > - 1) {
                console.log("Founded .status-container");
                return element.querySelectorAll("div")[0];
            }
            else if (element && element.children != null) {
                let i;
                let result = null;
                for (i = 0; result == null && i < element.children.length; i++) {
                    result = searchTree(element.children[i], matchingTitle);
                }
                return result;
            }
            return null;
        }

        var callback = function (mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                    for (const node of mutation.addedNodes) {
                        let result = searchTree(node, "external-ui-component");
                        if (result) {
                            console.log("Founded needed IFrame");
                            console.log(result);
                            // result.src = result.src + "&email=" + session.email;
                            return;
                        }
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);

        const session = JSON.parse(window.localStorage.getItem('SPA_auth_session'));

        setTimeout(function () {
            const targetNode = document.getElementsByClassName("opened-modules")[0];
            observer.observe(targetNode, config);
        }, 2000);
    });
});
