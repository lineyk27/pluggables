"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    
    const placeHolder = function ($scope) {
        const vm = this;
        vm.macroService = new 

        vm.getItems = () => ([{
            key: "placeholderAddOrderNotesColumn",
            text: "Show notes",
            icon: "fa fa-comments-o"
        }]);

        vm.onClick = (itemKey, $event) => {
            vm.selectedOrders = $scope.viewStats.orders_filtered.map(i => i.id);

        };

        vm.loadNotes = (orderIds) => {

        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});
