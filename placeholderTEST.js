'use strict';

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    
    const placeHolder = function ($scope, $element, $http) {
        const vm = this;
        vm.ordersService = new Services.OrdersService(vm);
        vm.buttons = [{
            key: "initialButtonPlaceholder",
            text: "Initial button",
            icon: "fa func fa-truck"
        }];
        
        vm.getItems = () => {
          return vm.buttons;
        }

        vm.isEnabled = (itemKey) => true;

        vm.onClick = function(itemKey, $event){
          
        };

        // function getRandomInt(min, max) {
        //   min = Math.ceil(min);
        //   max = Math.floor(max);
        //   return Math.floor(Math.random() * (max - min + 1)) + min;
        // };

        // angular.element(document).ready(function () {
        //   vm.viewChanged = $scope.$watch(() => $scope.viewStats.viewConfiguration.ViewId, function(newVal, oldVal){
        //     if(oldVal === newVal){
        //       return;
        //     }
        //       const count = getRandomInt(1, 5);
        //       vm.buttons = [];
        //       for(let i = 0; i < count; i++){
        //         vm.buttons.push({
        //           name: "btn_" + i,
        //           key: "someBtn" + i,
        //           text: "button " + i
        //         });
        //       }
        //   }, true);
        // });
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});