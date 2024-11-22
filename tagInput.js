"use strict";

const modalContent = `
    <dialog id="favDialog">
        <form method="dialog">
            <p>
            <label for="favAnimal">Favorite animal:</label>
            <select id="favAnimal" name="favAnimal" ng-model="favAnimal" ng-change="onAnimalChange()">
                <option></option>
                <option>Brine shrimp</option>
                <option>Red panda</option>
                <option>Spider monkey</option>
            </select>
            </p>
            <div>
            <button id="cancel" type="reset" ng-click="onClose(false)">Cancel</button>
            <button type="submit" ng-click="onClose(true)">Confirm</button>
            </div>
        </form>
        </dialog>

        <div>
        <button id="updateDetails">Update details</button>
    </div>
`;

define(function(require) {
    const placeholderManager = require("core/placeholderManager");

    const placeHolder = function ($scope, $element, $compile, appsettingsService) {
        const vm = this;
        vm.scope = $scope;
        vm.printService = new Services.PrintService(vm);
        vm.element = $element;
        vm.modalElement = null;
        vm.scope.favAnimal = "";

        vm.getItems = () => ([{
            key: "scanOrders",
            text: "Scan orders",
            icon: "fa func fa-comments"
        }]);

        vm.isEnabled = (itemKey) => {
            return true;
        };

        vm.scope.onAnimalChange = () => {
            console.log("New animal value: ", vm.scope.favAnimal);
        }

        vm.scope.onClose = (confirm) => {
            vm.modalElement.close(null);
            console.log("Close with confirm ", confirm)
        }

        vm.onClick = async (itemKey, $event) => {
            console.log("Scan orders click!");
            const modalElement = $compile(modalContent)(vm.scope);
            vm.element.append(modalElement);
            vm.modalElement = angular.element("#favDialog")[0];
            vm.modalElement.showModal();
            console.log(appsettingsService);
            console.log(await appsettingsService.getKey("testKey", false));

            appsettingsService.setKey({ Key: "testKey", IsUserSpecific: false, Value: "testValue" });
        }
    };
    
    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});