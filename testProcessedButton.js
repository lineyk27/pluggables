"use strict";

define(function (require) {

    $(document).ready(function ($scope) {
        const config = { childList: true, subtree: true };

        function searchTree(element, matchingTitle) {
            if (element && element.querySelectorAll("div[ng-controller='ProcessedOrdersModule'] .status-container") && element.baseURI.indexOf("ProcessedOrders") > - 1) {
                console.log("Founded div[ng-controller='ProcessedOrdersModule'] .status-container");
                return element.querySelectorAll("div[ng-controller='ProcessedOrdersModule'] .status-container")[0];
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
                        let result = searchTree(node, "div[ng-controller='ProcessedOrdersModule'] .status-container");
                        if (result) {
                            console.log("Founded needed div[ng-controller='ProcessedOrdersModule'] .status-container");
                            console.log(result);
                            //printLabelsButton
                            const newButton = angular.element('<print-labels-button></print-labels-button>')
                            const ngElem = angular.element(result);
                            ngElem.append(newButton);
                            const ngScope = ngElem.scope();
                            const compileF = ngElem.injector().get("$compile");
                            const res = compileF(newButton)(ngScope);

                            // require(["$compile"], function($compile){
                            //     const res = $compile(newButton)(ngScope);
                            //     console.log("DONE!!!!!!!!!!!!!!!!!!!!!!!!!!");
                            // });

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

        function PrintLabelsButton ($scope){
            const vm = this;
            vm.scope = $scope;

            vm.doSmth = function () {
                console.log(vm.scope);
                console.log("Do something");
            };
        };

        angular.module("process-orders-proxy-layer")
            .component("printLabelsButton", {
                template: "<div class='btn' ng-click='vm.doSmth()'>Print DHL docs</button>",
                controllerAs: "vm",
                controller: PrintLabelsButton
            });
    });
});
