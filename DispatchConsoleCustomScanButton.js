"use strict";

define(function(require) {
    $(document).ready(function ($scope) {
        const ordersService = new Services.OrdersService();
        
        const config = { childList: true, subtree: true };

        function searchTree(element, matchingTitle) {
            if (element && element.querySelectorAll && element.querySelectorAll("div[ng-controller='OpenOrders_ProcessOrdersView'] .buttons")) {
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

                            const newButton = angular.element('<scan-sku-info-button></scan-sku-info-button>')
                            const ngElem = angular.element(result);
                            ngElem.prepend(newButton);
                            // const ngScope = ngElem.scope();

                            const parentScope = angular.element(document.querySelector("div[ng-controller='OpenOrders_ProcessOrdersView']")).scope();

                            const compileF = ngElem.injector().get("$compile");
                            const res = compileF(newButton)(parentScope);

                            return;
                        }
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);

        setTimeout(function () {
            const targetNode = document.getElementsByClassName("legacy-windows-container")[0];
            observer.observe(targetNode, config);
        }, 2000);

        function ScanSkuInfoButtonController($scope) {
            const vm = this;
            vm.scope = $scope;
            vm.skuInfos = [];
            vm.orderNotes = [];
            vm.noteRegexp = /SKU:\s*(?<sku>[^;]+);*\s*SLP:\s*(?<slp>[^;]*);*\s*Cost Centre:\s*(?<costCentre>[^;]*)/;

            vm.onClick = () => {
                vm.orderNotes = vm.scope.$parent.currentOrderNotes;

                vm.parseInfo();
                vm.openInfoWindow();
            };

            vm.parseInfo = () => {
                vm.skuInfos = [];
                const skuInfos = [];
                for (const note of vm.orderNotes) {
                    if (vm.noteRegexp.test(note.Note)) {
                        const match = note.Note.match(vm.noteRegexp);
                        skuInfos.push({
                            ...match.groups
                        });
                    }
                }

                for (const item of vm.scope.$parent.currentOrder.Items) {
                    for (let i = 0; i < item.Quantity; i++) {
                        const infoInd = skuInfos.findIndex(i => i.sku === item.ItemNumber);
                        if (infoInd > -1) {
                            vm.skuInfos.push(skuInfos[infoInd]);
                            skuInfos.splice(infoInd, 1);
                        } else {
                            vm.skuInfos.push({
                                sku: item.ItemNumber,
                                slp: '',
                                costCentre: ''
                            });
                        }
                    }
                }
            };

            vm.openInfoWindow = () => {
                const ctrl = new Core.Control({
                    data: { 
                        skuInfos: vm.skuInfos,
                        onSave: (skuInfos) => {
                            vm.saveInfo(skuInfos);
                            ctrl.close();
                        },
                        onClose: () => {
                            ctrl.close();
                        }
                    },
                    moduleName: "ScanSkuInfoWindow",
                    controlName: "ScanSkuInfoWindow",
                    height: "510px",
                    width: "450px",
                    element: null,
                    position: "VIEWPORT_CENTRE",
                    newControl: true,
                    onBackDropClick: function (event) {
                        console.log("Backdrop click!", event);
                    }
                }, {});

                ctrl.open();
            };

            vm.saveInfo = (skuInfos) => {
                vm.skuInfos = skuInfos;

                const notes = [];
                for (const note of vm.orderNotes) {
                    if (!vm.noteRegexp.test(note.Note)) {
                        notes.push(note);
                    }
                }

                for (const skuInfo of vm.skuInfos) {
                    if (skuInfo.slp || skuInfo.costCentre) {
                        notes.push({
                            Note: `SKU: ${skuInfo.sku}; SLP: ${skuInfo.slp}; Cost Centre: ${skuInfo.costCentre}`,
                            CreatedBy: window.localStorage.getItem('SPA_auth_session').userName,
                            NoteDate: new Date().toISOString().replace('T', ' '),
                            OrderNoteId: crypto.randomUUID(),
                            OrderId: vm.scope.$parent.currentOrder.OrderId,
                            Internal: true,
                            NoteTypeId: 0
                        });
                    }
                }

                ordersService.setOrderNotes(vm.scope.$parent.currentOrder.OrderId, notes, function (response) {
                    if (response.error?.errorMessage) {
                        showError(`Error saving notes: ${response.error?.errorMessage}`);
                        return;
                    }

                    vm.scope.$parent.currentOrderNotes = notes;
                    showSuccess("Updates notes succesfully");
                });
            };
        };

        const buttonTemplate = 
        `
            <button ng-click="vm.onClick($event)" class="btn func">
                <i class="fa fa-th-large func"></i>
                Info Notes
            </button>
        `;

        angular.module("process-orders-proxy-layer")
            .component("scanSkuInfoButton", {
                template: buttonTemplate,
                controllerAs: "vm",
                controller: ScanSkuInfoButtonController
            });

        angular.module('ScanSkuInfoWindow', [
            'ui.grid.edit'
        ]);
        
        function showError(message){
            Core.Dialogs.addNotify({
                message: message,
                type: "ERROR",
                timeout: 5000,
            });
        };

        function showSuccess(message){
            Core.Dialogs.addNotify({
                message: message,
                type: "SUCCESS",
                timeout: 5000,
            });
        };

    });
});
