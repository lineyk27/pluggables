const cellInputTemplate = `
    <div
        class="ui-grid-cell-contents"
        title="TOOLTIP">
        <input type="text" ng-model="MODEL_COL_FIELD" ng-keydown="grid.appScope.handleKeyDown($event);"/>
    </div>
`;

function ScanSkuInfoWindowView($scope, $element, $q, $timeout){
    const vm = this;
    vm.scope = $scope;
    vm.gridApi = null;
    vm.onClose = null;
    vm.onSave = null;

    vm.scope.gridOptions = {
        onRegisterApi: function(gridApi) {
            vm.gridApi = gridApi;
        },
        enableVerticalScrollbar: 2,
        columnDefs:  [
            { 
                name: 'SKU', 
                field: 'sku', 
                displayName: 'SKU',
                width: "40%", 
                enableColumnResizing: true, 
            },
            { 
                name: 'SLP', 
                field: 'slp', 
                displayName: 'SLP',
                width: "30%", 
                enableColumnResizing: true, 
                cellTemplate: cellInputTemplate
            },
            { 
                name: 'Cost Centre', 
                field: 'costCentre',
                displayName: 'Cost Centre', 
                width: "30%", 
                enableColumnResizing: true,
                cellTemplate: cellInputTemplate
            }
        ]
    };

    vm.onInit = () => {
        vm.scope.gridOptions.data = this.module?.options?.data?.skuInfos ?? [];
        vm.onClose = this.module?.options?.data?.onClose;
        vm.onSave = this.module?.options?.data?.onSave;
        $timeout(() => {
            angular.element('.skuInfoGrid')[0]?.querySelectorAll('input[type=text]:not([disabled])')[0]?.focus();
        }, 200);
    };

    vm.scope.handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            focusNextElement();
        }
    }

    vm.scope.save = () => {
        vm.onSave && vm.onSave(vm.scope.gridOptions.data);
    };

    vm.scope.cancel = () => {
        vm.onClose && vm.onClose();
    };

    function focusNextElement() {
        const focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
        if (document.activeElement && document.activeElement.form) {
            const focussable = Array.prototype.filter.call(document.activeElement.form.querySelectorAll(focussableElements),
                function (element) {
                    return element.offsetWidth > 0 ||element.offsetHeight > 0 || element === document.activeElement;
                }
            );
            const index = focussable.indexOf(document.activeElement);
            if (index > -1) {
                const nextElement = focussable[index + 1] || focussable[0];
                nextElement.focus();
            }
        }
    }
};
