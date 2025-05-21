"use strict";

define(function(require) {
  const placeholderManager = require("core/placeholderManager");
  const macroService = new Services.MacroService();
  const orderService = new Services.OrderService();
  const rulesService = new Services.RulesEngineService();

  const placeholder = function ($scope) {
    const vm = this;
    vm.scope = $scope;
    vm.rules = [];

    vm.isEnabled = (itemKey) => {
      const ruleId = Number(itemKey.substring(9));
      const rule = vm.rules.find(r => r.pkRuleId === ruleId);
      return !!rule;
    };

    vm.getItems = () => {
      return [
        {
          key: "123132123123",
          text: "click me",
          icon: "fa func fa-cogs"
        }
      ];
      return vm.rules.map(i => {
        return {
          key: `run-rule-${i.pkRuleId}`,
          text: `Run rule: ${i.RuleName}`,
          icon: "fa func fa-cogs",
        };
      })
    };

    vm.onClick = (itemKey, $event) => {
      const ruleId = Number(itemKey.substring(9));
      const chunkSize = 100;

      for (let i = 0; i < $scope.viewStats.selected_orders.length; i += chunkSize) {
        const chunk = $scope.viewStats.selected_orders.slice(i, i + chunkSize);

        orderService.runRulesEngine(chunk, ruleId, (response) => {
          console.log(response);
        });
      }
    };

    // angular.element(document).ready(() => {
    //   vm.scope.$watch(() => vm.scope.viewStats.view_configuration.ViewId, function (newVal, oldVal) {
    //     if (!!newVal && newVal !== oldVal){
    //       vm.reloadRules(vm.scope.viewStats.view_configuration.ViewName);
    //     }
    //   });
    // });

    angular.element(document).ready(function () {
      console.log("asd");
      vm.ordersSelectedWatch = $scope.$watch(() => $scope.viewStats.selected_orders, function(newVal, oldVal){
          console.log("asd");
      }, true);
    });

    vm.reloadRules = (viewName) => {
      macroService.GetMacroConfigurations((response) => {
        const macroConfigs = response.result.filter((x) => x.ApplicationName === "Pluggable_test" && x.MacroName === "Pluggable_test");
        
        const viewConfigs = macroConfigs.filter(c => {
          const viewParameter = c.Parameters.find(p => p.ParameterName === "view");
          return viewParameter?.ParameterValue === viewName;
        });

        if (!viewConfigs.length) {
          vm.rules = [];
          return;
        }

        const rules = vm.scope.userConfiguration.rules.rules;

        vm.rules = viewConfigs.map(c => {
          const ruleParameter = c.Parameters.find(p => p.ParameterName === "rule");
          const rule = rules.find(r => r.RuleName === ruleParameter?.ParameterValue);
          return rule;
        }).filter(r => !!r);
      });
    };
  };
  
  placeholderManager.register("OpenOrders_OrderControlButtons", placeholder);
});
