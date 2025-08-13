"use strict";

define(function (require) {

    $(document).ready(function ($scope) {
        const config = { childList: true, subtree: true };

        function searchTree(element, matchingTitle) {
            if (element && element.querySelectorAll && element.querySelectorAll("div[ng-controller='OpenOrders_ProcessOrdersView'] .buttons")) {
                console.log("Founded div[ng-controller='OpenOrders_ProcessOrdersView'] .buttons");
                return element.querySelectorAll("div[ng-controller='OpenOrders_ProcessOrdersView'] .buttons")[0];
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
                        let result = searchTree(node, "div[ng-controller='OpenOrders_ProcessOrdersView'] .buttons");
                        if (result) {
                            console.log("Founded needed div[ng-controller='OpenOrders_ProcessOrdersView'] .buttons");
                            console.log(result);

                            const newButton = angular.element('<print-labels-button></print-labels-button>')
                            const ngElem = angular.element(result);
                            ngElem.prepend(newButton);
                            const ngScope = ngElem.scope();
                            const compileF = ngElem.injector().get("$compile");
                            const res = compileF(newButton)(ngScope);

                            return;
                        }
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);

        const session = JSON.parse(window.localStorage.getItem('SPA_auth_session'));

        setTimeout(function () {
            const targetNode = document.getElementsByClassName("legacy-windows-container")[0];
            observer.observe(targetNode, config);
        }, 2000);

        function PrintLabelsButton ($scope){
            const vm = this;
            vm.scope = $scope;
            vm.isLoading = false;
            const macroService = new Services.MacroService();

            vm.onClick = ($event) => {
                const parentScope = angular.element(document.querySelector("div[ng-controller='OpenOrders_ProcessOrdersView']")).scope();

                vm.isLoading = true;
                macroService.GetMacroConfigurations(response => {
                    const macroConfig = response.result.find(x => x.ApplicationName === "3492_SplitOrderLabels" && x.MacroName === "3492_SplitOrderLabels");
                    if (!macroConfig) {
                        Core.Dialogs.addNotify({ message: `Macro config not found`, type: "ERROR", timeout: 5000 });
                        vm.isLoading = false;
                        return;
                    }

                    const server = macroConfig.Parameters.find(x => x.ParameterName === "server")?.ParameterValue;
                    const username = macroConfig.Parameters.find(x => x.ParameterName === "username")?.ParameterValue;
                    const password = macroConfig.Parameters.find(x => x.ParameterName === "password")?.ParameterValue;
                    const port = macroConfig.Parameters.find(x => x.ParameterName === "port")?.ParameterValue;
                    const folder = macroConfig.Parameters.find(x => x.ParameterName === "folder")?.ParameterValue;

                    const macroParams = {
                        applicationName: "3492_SplitOrderLabels",
                        macroName: "3492_SplitOrderLabels",
                        server,
                        username,
                        password,
                        port,
                        folder,
                        numOrderId: parentScope.currentOrder.NumOrderId
                    };

                    macroService.Run(macroParams, function (result) {
                        vm.isLoading = false;
                        if (result.error?.errorMessage) {
                            Core.Dialogs.addNotify({ message: `Error generating labels: ${result.error.errorMessage}`, type: "ERROR", timeout: 5000 });
                        } else {
                            Core.Dialogs.addNotify({ message: "Generated labels succesfully", type: "SUCCESS", timeout: 5000 });
                        }
                    });
                });
            };
        };

        const template = `
            <button ng-click="vm.onClick($event)" class="btn" ng-class="{loading: vm.isLoading, func: !vm.isLoading}" ng-disabled="vm.isLoading" >
                <i class="fa fa-truck func"></i>
                {{vm.isLoading ? 'Loading...' : 'Generate labels NEW'}}
            </button>
          `;

        angular.module("process-orders-proxy-layer")
            .component("printLabelsButton", {
                template: template,
                controllerAs: "vm",
                controller: PrintLabelsButton
            });
    });
});
