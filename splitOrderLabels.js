// @ts-nocheck
"use strict";

define(function (require) {
  const placeholderManager = require("core/placeholderManager");
  const macroService = new Services.MacroService();
  const placeholder = function ($scope, $element) {
    const vm = this;
    vm.scope = $scope;
    vm.scope.isLoading = false;

    vm.isEnabled = (itemKey) => {
      return true;
    };

    vm.getItems = () => {
      const generateLabelItem = {
        key: "placeholderGenerateLabels",
        text: "Generate labels",
        icon: "fa func fa-truck",
      };

      setTimeout(() => {
        angular.element(
          "button[key='placeholderGenerateLabels']"
        )[0].disabled = false;
      }, 2500);

      return [generateLabelItem];
    };

    vm.setLoading = (loading) => {
      vm.scope.isLoading = loading;
      if (loading) {
        const element = angular.element(
          "button[key='placeholderGenerateLabels']"
        );
        element.html('<i class="fa fa-spinner fa-spin"></i> Loading...');
      } else {
        const element = angular.element(
          "button[key='placeholderGenerateLabels']"
        );
        element.html('<i class="fa func fa-truck"></i> Generate labels');
      }
    };

    vm.onClick = (itemKey, $event) => {
      const order = vm.scope.$parent.currentOrder;
      if (vm.scope.isLoading) return;

      vm.setLoading(true);
      macroService.GetMacroConfigurations((response) => {
        const macroConfig = response.result.find(
          (x) =>
            x.ApplicationName === "3492_SplitOrderLabels" &&
            x.MacroName === "3492_SplitOrderLabels"
        );
        if (!macroConfig) {
          Core.Dialogs.addNotify({
            message: `Not found macro config`,
            type: "ERROR",
            timeout: 5000,
          });
          vm.setLoading(false);
          return;
        }

        const server = macroConfig.Parameters.find(
          (x) => x.ParameterName === "server"
        )?.ParameterValue;
        const username = macroConfig.Parameters.find(
          (x) => x.ParameterName === "username"
        )?.ParameterValue;
        const password = macroConfig.Parameters.find(
          (x) => x.ParameterName === "password"
        )?.ParameterValue;
        const port = macroConfig.Parameters.find(
          (x) => x.ParameterName === "port"
        )?.ParameterValue;
        const folder = macroConfig.Parameters.find(
          (x) => x.ParameterName === "folder"
        )?.ParameterValue;

        const macroParams = {
          applicationName: "3492_SplitOrderLabels",
          macroName: "3492_SplitOrderLabels",
          server,
          username,
          password,
          port,
          folder,
          numOrderId: order.NumOrderId,
        };

        macroService.Run(macroParams, function (result) {
          vm.setLoading(false);
          if (result.error?.errorMessage) {
            Core.Dialogs.addNotify({
              message: `Error generating labels: ${result.error.errorMessage}`,
              type: "ERROR",
              timeout: 5000,
            });
          } else {
            Core.Dialogs.addNotify({
              message: "Generated labels succesfully",
              type: "SUCCESS",
              timeout: 5000,
            });
          }
        });
      });
    };
  };

  placeholderManager.register("OpenOrders_ProcessOrders_RightBottomButtons", placeholder);
});
