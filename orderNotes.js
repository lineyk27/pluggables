"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    // Placeholder
    const placeHolder = function ($scope) {
        const vm = this;
        vm.macroService = new Services.MacroService(vm);
        vm.viewOrders = [];
        vm.columnShown = false;
        vm.placeholderKey = "placeholderAddOrderNotesColumn";
        vm.loadingHtml = "<i class=\"fa fa-spinner fa-spin\"></i> Set despatch date"

        vm.setLoading = (isLoading) => {
            if (isLoading) {
                vm.isEnabled = (itemKey) => false;
                vm.agButton.html(vm.loadingHtml);
            }
            else{
                vm.isEnabled = (itemKey) => true;
                vm.agButton.html(vm.buttonInnerHTML);
            }
        };

        angular.element(document).ready(function () {
            vm.button = document.querySelectorAll(`button[key='${vm.placeholderKey}']`)[0];
            vm.agButton = angular.element(vm.button);
            vm.buttonInnerHTML = vm.button.innerHTML;
            console.log(vm.buttonInnerHTML);
        });

        vm.getItems = () => ([{
            key: vm.placeholderKey,
            text: "Show notes",
            icon: "fa func fa-comments"
        }]);

        vm.isEnabled = (itemKey) => {
            return $scope.viewStats.ViewId == 52;
        };

        vm.onClick = (itemKey, $event) => {
            vm.viewOrders = $scope.viewStats.orders_filtered.map(i => i.id);
            // vm.addNotesColumn([]);

            if (!vm.columnShown) {
                let totalPages = Math.ceil(items.length / 5);
                vm.loadNotes({}, vm.viewOrders, 1, totalPages, vm.addNotesColumn);    
            } else {
                vm.removeNotesColumn();
            }
        };

        vm.addNotesColumn = (ordersNotes) => {
            //gridScope.$ctrl.gridOpts.columnDefs
            let gridScope = angular.element("view-grid").scope();

            // add notes obj to parent grid scope
            gridScope.$ctrl.__ordersNotes = ordersNotes;

            //"<order-grid-items actions-handler='grid.appScope.actionsHandler' item='row.entity' column='col.colDef' measurements='grid.appScope.measures' view='grid.appScope.view'></order-grid-items>"
            
            let columnDefinition = {
                sequence: gridScope.$ctrl.gridOpts.columnDefs.length + 1,
                code: "NOTES",
                name: "Notes",
                displayName: "Notes",
                referencedName: "Notes",
                cellTemplate: "<order-notes-cell item='row.entity' notes='grid.appScope.__ordersNotes[row.entity.OrderId]'></order-notes-cell>",
                width: 500,
                enableColumnMoving: true,
                enableColumnResizing: true,
                type: "string"
            };

            gridScope.$ctrl.gridOpts.columnDefs.push(columnDefinition);

        };

        vm.removeNotesColumn = () => {

        };

        vm.loadNotes = (ordersNotes, allOrderIds, pageNumber, totalPages, finishCallback) => {
            let orderIds = paginate(allOrderIds, 5, pageNumber);

            vm.macroService.Run({applicationName: "OpenOrdersNotes_Test", macroName: "OrdersNotesBulkGet", orderIds: orderIds}, function(result) {
                if (!result.error) {
                    if (result.result.Error) {
                        Core.Dialogs.addNotify(result.result.Error, 'ERROR');
                        return;
                    };

                    ordersNotes = Object.assign({}, ordersNotes, result.result.OrdersNotes);

                    if (pageNumber == totalPages) {
                        finishCallback && finishCallback(ordersNotes);
                    } else {
                        vm.loadNotes(ordersNotes, allOrderIds, pageNumber+1, totalPages, finishCallback);
                    }
                } else {
                    Core.Dialogs.addNotify(result.error, 'ERROR');
                    vm.setLoading(false);
                }
            });
        };

        function paginate(array, page_size, page_number) {// page number 1 based
            return array.slice((page_number - 1) * page_size, page_number * page_size);
        };
    };
    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);

    const orderNotesCellTemplate = "<div>order notes component</div>";
    
    function orderNotesCellCtrl (){
        const vm = this;
        vm.$onInit = function () {
            vm.custVar = 123;
            console.log(vm.item);
            console.log(vm.notes);
        }
    }

    //Open orders notes cell component
    angular.module("openOrdersViewService")
        .component("orderNotesCell", {
            template: orderNotesCellTemplate,
            bindings: {
                item: "=",
                notes: "="
            },
            controller: orderNotesCellCtrl
        });
});
