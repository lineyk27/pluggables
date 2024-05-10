"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    
    const placeHolder = function ($scope) {
        const vm = this;
        vm.macroService = new 
        vm.viewOrders = [];
        vm.columnShown = false;
        
        vm.getItems = () => ([{
            key: "placeholderAddOrderNotesColumn",
            text: "Show notes",
            icon: "fa fa-comments-o"
        }]);

        vm.onClick = (itemKey, $event) => {
            vm.viewOrders = $scope.viewStats.orders_filtered.map(i => i.id);
            vm.addNotesColumn([]);

            // if (!vm.columnShown) {
            //     let totalPages = Math.ceil(items.length / 5);
            //     vm.loadNotes({}, vm.viewOrders, 1, totalPages, vm.addNotesColumn);    
            // } else {
            //     vm.removeNotesColumn();
            // }
        };

        vm.addNotesColumn = (ordersNotes) => {
            //gridScope.$ctrl.gridOpts.columnDefs
            let gridScope = angular.element("view-grid").scope();

            //"<order-grid-items actions-handler='grid.appScope.actionsHandler' item='row.entity' column='col.colDef' measurements='grid.appScope.measures' view='grid.appScope.view'></order-grid-items>"
            
            let columnDefinition = {
                sequence: gridScope.$ctrl.gridOpts.columnDefs.length + 1,
                code: "NOTES",
                name: "Notes",
                displayName: "Notes",
                referencedName: "Notes",
                cellTemplate: "<order-grid-notes item='row.entity'></order-grid-notes>",
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

            vm.macroService.Run({applicationName: "OrdersNotesApp", macroName: "OrdersNotesMacro", orderIds: orderIds}, function(result) {
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
});
