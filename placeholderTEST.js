"use strict";

define(function(require) {
  const placeholderManager = require("core/placeholderManager");
  const orderService = new Services.OrderService();

  const placeholder = function ($scope) {
    const vm = this;
    vm.scope = $scope;
    vm.buttons = [{
      name: "Initial btn",
      key: "Initial_key",
      text: "Initial btn"
    }];

    vm.isEnabled = (itemKey) => {
      return true;
    };

    vm.getItems = () => {
      return vm.buttons;
    };

    vm.onClick = (itemKey, $event) => {
      console.log("click " + itemKey);
    };

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    angular.element(document).ready(function () {
      console.log("asd");
      vm.viewChanged = $scope.$watch(() => $scope.viewStats.viewConfiguration.ViewId, function(newVal, oldVal){
        if(oldVal === newVal){
          return;
        }
          const count = getRandomInt(1, 5);
          vm.buttons = [];
          for(let i = 0; i < count; i++){
            vm.buttons.push({
              name: "btn_" + i,
              key: "someBtn" + i,
              text: "button " + i
            });
          }
      }, true);
    });
  };
  
  placeholderManager.register("OpenOrders_OrderControlButtons", placeholder);
});
