"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const editOrderNoteView = require("views/Order_EditOrderNote");
    const orderNotes = require("modules/orderbook/scripts/orderNotes.js");
    const dialogs = require('core/dialogs');
    const BaseCellRenderer = require("modules/orderbook/orders/components/stacked-view-grid/base/base-cell-renderer");
    const AGGridColumn = require("modules/orderbook/orders/components/stacked-view-grid/ag-grid-column");

    const orderGridNotesTemplate = `
        <style>
            .user-note{
                background-color: #ffc21c;
            }
            .admin-note{
                background-color: #fffb1c;
            }
            .notes-wrapper{
                display: block;
                overflow: hidden;
            }
            .flex-container{
                display: flex;
            }
            .flex-column{
                flex-direction: row;
            }
            .flex-row{
                flex-direction: column;
            }
            .justify-center{
                justify-content: center;
            }
            .note-footer{
                width: 100%; 
                height: 20%;
                justify-content: space-between;
            }
            .page-button{
                cursor: pointer;
                margin-right: 5px;
                margin-left: 5px;
            }
            .order-note-wrapper{
                width: 10rem;
            }
            .order-note{
                height: 90%;
                min-height: 90%; 
                max-height: 90%;
                margin: 5px;
                border-radius: 5px;
                justify-content: space-around;
            }
            .order-note-text{
                max-width: 85%;
                min-width: 85%;
                width: 85%;
            }
            .order-note-text-wrap{
                margin: 2px;
                width: 100%;
                height: 100%;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
            }
            .no-notes-wrapper{
                min-height: 100%;
                max-height: 100%;
                align-items: center;
            }
        </style>
        <div style="height: 100%;">
            <div ng-if="orderNotes.length > 0" class="notes-wrapper flex-container flex-column" style="min-height: 80%; max-height: 80%;">
                <div ng-repeat="note in orderNotes.slice((currentPage-1)*3) | limitTo: 3 track by $index" class="order-note-wrapper">
                    <div class="order-note flex-container flex-column" ng-click="editNote(note, true)" ng-class="{ 'user-note': isUserNote(note), 'admin-note': !isUserNote(note) }">
                        <div class="order-note-text">
                            <p class="order-note-text-wrap" ng-attr-title="{{note.Note}}" >{{note.Note}}</p>
                        </div>
                        <div ng-click="deleteNote($event, note);" style="cursor: pointer;">
                            <i class="fa fa-times" aria-hidden="true"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div ng-if="orderNotes.length == 0" class="flex-container flex-row justify-center no-notes-wrapper">                
                <div>No notes found</div>
                <button ng-click="editNote(null, true);" class="primary" style="font-weight: 400; padding: 2px; line-height: 10px;height: 18px;" >
                    Add note
                </button>
            </div>
            <div ng-if="orderNotes.length > 0" class="flex-container note-footer flex-column" style="min-height: 20%; max-height: 20%;">
                <button ng-click="editNote(null, true);" class="primary" style="font-weight: 400; padding: 2px; line-height: 10px;height: 18px;" >
                    Add note
                </button>
                <div class="flex-container flex-column">
                    <div style="width: 20px;">
                        <div ng-show="currentPage > 1" ng-dblclick="$event.stopPropagation()" ng-click="addPage($event, -1);" class="page-button"><i class="fa fa-chevron-left" aria-hidden="true"></i></div>
                    </div>
                    <div style="width: 20px;">
                        <div ng-show="currentPage < totalPages()" ng-dblclick="$event.stopPropagation()" ng-click="addPage($event, 1)" class="page-button"><i class="fa fa-chevron-right" aria-hidden="true"></i></div>
                    </div>
                </div>
            </div>
        </div>
        `;

    const cellRenderer = class OrderNotesCellRenderer extends BaseCellRenderer {
        init(params){
            this.childScope = params.context.$scope.$new();

            this.eGui = document.createElement('div');
            angular.element(this.eGui).css('height', '100%');
            this.childScope.$apply(() => {
                const scopeVm = this.childScope;
                this.childScope.order = params.data;
                this.childScope.orderNotes = params.context.__ordersNotes[this.childScope.order.OrderId];
                this.childScope.onUpdate = params.context.__onUpdateOrderNotes;
                this.childScope.currentPage = 1;

                this.eGui.innerHTML = orderGridNotesTemplate;

                this.childScope.addPage = function ($event, page) {
                    $event.stopPropagation();
                    scopeVm.currentPage += page;
                }
                
                this.childScope.totalPages = function () {
                    return Math.ceil(scopeVm.orderNotes.length / 3);
                }
                
                this.childScope.isUserNote = function (note) {
                    let emailRegEx = /\S+@\S+\.\S+/;
                    return emailRegEx.test(note.CreatedBy);
                }
                
                this.childScope.editNote = function (note, edit) {
                    console.log("in edit note");
                    console.log(note);
                    console.log(edit);
                    
                    let ctrl = new Core.Control({
                        data: { note: note, edit: edit },
                        controlName: "Order_EditOrderNote",
                        height: "350px",
                        width: "450px",
                        element: event.target,
                        position: "BOTTOM",
                        newControl: true
                    }, scopeVm.options);
                    
                    ctrl.onGetEvent = function (event) {
                        if (event.result) {
                            if (event.action == "SAVE") {
                                if (isEmptyOrSpaces(event.result.Note)) {
                                    Core.Dialogs.addNotify("Note can't be empty!", 'ERROR');
                                    return;
                                }
                                const index = scopeVm.orderNotes.indexOf(note);
                
                                if (index == -1) {
                                    scopeVm.orderNotes.push(event.result);
                                    scopeVm.saveNotes("created");
                                } else {
                                    scopeVm.orderNotes[index] = event.result;
                                    scopeVm.saveNotes("edited");
                                }
                            }
                        }
                    };
                    ctrl.open();
                }
        
                function isEmptyOrSpaces(str){
                    return str === null || str.match(/^ *$/) !== null;
                }
        
                this.childScope.deleteNote = function ($event, note) {
                    $event.stopPropagation();
                    dialogs.question({
                        title: "Delete Note?",
                        message: "Deleting this note will remove it from the system completely",
                        callback:
                            async (event) => {
                                if (event.action == "YES") {
                                    const index = scopeVm.orderNotes.indexOf(note);
                                    const temp = scopeVm.orderNotes.length;
                                    scopeVm.orderNotes.splice(index, 1);
                                    scopeVm.saveNotes("deleted");
                                    if ((index + 1) === temp && scopeVm.orderNotes.length % 3 == 0 && scopeVm.currentPage > 1) {
                                        scopeVm.currentPage--;
                                    }
                                }
                            }
                    }, self.options);
                }
        
                scopeVm.saveNotes = function(actionName){
                    new Services.OrdersService().setOrderNotes(scopeVm.order.OrderId, scopeVm.orderNotes, function (result) {
                        if (result.error) {
                            Core.Dialogs.addNotify(result.error, 'ERROR');
                        } else {
                            Core.Dialogs.addNotify(`Note ${actionName} succesfully`, 'SUCCESS');
                            scopeVm.onUpdate(scopeVm.order.OrderId, scopeVm.orderNotes);
                        }
                    })
                };

                params.context.$compile(this.eGui)(this.childScope);
            });
        }
    };

    const placeHolder = function ($scope) {
        const vm = this;
        vm.macroService = new Services.MacroService(vm);
        vm.viewOrders = [];
        vm.columnShown = false;
        vm.placeholderKey = "placeholderAddOrderNotesColumnTEST";
        vm.loadingHtml = "<i class=\"fa fa-spinner fa-spin\"></i> Show notes"
        vm.hideNotes = "<i class=\"fa func fa-comments\"></i> Hide notes(TEST)"

        vm.getItems = () => ([{
            key: vm.placeholderKey,
            text: "Show notes(TEST)",
            icon: "fa func fa-comments"
        }]);

        vm.setLoading = (isLoading) => {
            if (isLoading) {
                vm.isEnabled = (itemKey) => false;
                vm.agButton.html(vm.loadingHtml);
            } else {
                vm.isEnabled = (itemKey) => true;
                vm.agButton.html(vm.hideNotes);
            }
        };

        angular.element(document).ready(function () {
            vm.button = document.querySelectorAll(`button[key='${vm.placeholderKey}']`)[0];
            vm.agButton = angular.element(vm.button);
            vm.buttonInnerHTML = vm.button.innerHTML;
        });

        vm.isEnabled = (itemKey) => {
            return true;
        };

        vm.ordersLoadedWatch = $scope.$watch(() => $scope.viewStats.orders.map(i => i.OrderId), function(newVal, oldVal){
            let oldIds = oldVal.map(i => i.OrderId);
            let newIds = newVal.map(i => i.OrderId);
            
            if (newIds.toString() !== oldIds.toString()) {
                vm.columnShown = false;
                vm.agButton.html(vm.buttonInnerHTML);
            }
        }, true);

        vm.onClick = (itemKey, $event) => {
            vm.viewOrders = $scope.viewStats.orders.map(i => i.OrderId);
            if (!vm.viewOrders.length) {
                Core.Dialogs.addNotify("No orders found", 'WARNING');
                return;
            }

            const appName = vm.getAppNameByCustomer(['em@feroxon.com']);

            if (!vm.columnShown) {
                vm.setLoading(true);
                const totalPages = Math.ceil(vm.viewOrders.length / 100);
                vm.loadNotes({}, vm.viewOrders, 1, totalPages, appName, vm.addNotesColumn);
            } else {
                vm.removeNotesColumn();
            }
        };
        
        vm.getAppNameByCustomer = (privateCustomers) => {
            const session = JSON.parse(window.localStorage.getItem('SPA_auth_session'));
            if (session && privateCustomers.indexOf(session.email) > -1) {
                return 'Notes Manager Custom';
            } else {
                return 'Notes Manager - New Orders Screen';
            }
        };

        vm.addNotesColumn = (ordersNotes) => {
            // let gridScope = angular.element("stacked-view-grid").scope();
            let gridScope = $scope;
            
            if (!gridScope) {
                Core.Dialogs.addNotify("View grid not supported", 'WARNING');
                return;
            }

            gridScope.__ordersNotes = ordersNotes;
            gridScope.__onUpdateOrderNotes = function (orderId, notes) {
                this.__ordersNotes[orderId] = notes;
            }.bind(gridScope);
            
            // let columnDefinition = {
            //     sequence: gridScope.$ctrl.gridOpts.columnDefs.length + 1,
            //     code: "NOTES",
            //     name: "Notes",
            //     displayName: "Notes",
            //     referencedName: "Notes",
            //     cellTemplate: "<order-grid-notes item='row.entity' on-update='grid.appScope.__onUpdateOrderNotes' notes='grid.appScope.__ordersNotes[row.entity.OrderId]'></order-grid-notes>",
            //     width: 500,
            //     enableColumnMoving: true,
            //     enableColumnResizing: true,
            //     type: "string"
            // };

            let columnDefs = gridScope.api.gridOptions.api.getColumnDefs();
            const nextSequence = Math.max(...columnDefs.map(o => o.sequence))

            const colDef = new AGGridColumn({ 
                sequence: nextSequence, 
                code: 'NOTES', 
                pinned: null, 
                name: 'Notes', 
                suppressMenu: true, 
                cellRenderer: cellRenderer, 
                templateId: '' 
            });
            

            columnDefs = columnDefs.concat([colDef]);

            gridScope.api.gridOptions.api.setColumnDefs(columnDefs);
            vm.columnShown = true;
            vm.setLoading(false);
        };

        vm.removeNotesColumn = () => {
            let gridScope = angular.element("stacked-view-grid").scope();
            let colDefs = gridScope.api.gridOptions.api.getColumnDefs();
            let colInd = colDefs.findIndex(item => item.code === "NOTES");
            if (colInd > -1) {
                colDefs.splice(colInd, 1);
            }
            gridScope.api.gridOptions.api.setColumnDefs(colDefs);
            vm.columnShown = false;
            vm.agButton.html(vm.buttonInnerHTML);
        };

        vm.loadNotes = (ordersNotes, allOrderIds, pageNumber, totalPages, appName, finishCallback) => {
            const orderIds = paginate(allOrderIds, 100, pageNumber);
            vm.macroService.Run({applicationName: appName, macroName: "NotesManagerMacro", orderIds: orderIds}, function(result) {
                if (!result.error) {
                    if (result.result.Error) {
                        Core.Dialogs.addNotify(result.result.Error, 'ERROR');
                        return;
                    };

                    ordersNotes = Object.assign({}, ordersNotes, result.result.OrdersNotes);

                    if (pageNumber == totalPages) {
                        finishCallback && finishCallback(ordersNotes);
                    } else {
                        vm.loadNotes(ordersNotes, allOrderIds, pageNumber + 1, totalPages, appName, finishCallback);
                    }
                } else {
                    Core.Dialogs.addNotify(result.error, 'ERROR');
                    vm.setLoading(false);
                }
            });
        };

        function paginate(array, page_size, page_number) {
            return array.slice((page_number - 1) * page_size, page_number * page_size);
        };
    };
    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);

    const orderGridNotes1Template = `
        <style>
            .user-note{
                background-color: #ffc21c;
            }
            .admin-note{
                background-color: #fffb1c;
            }
            .notes-wrapper{
                display: block;
                overflow: hidden;
            }
            .flex-container{
                display: flex;
            }
            .flex-column{
                flex-direction: row;
            }
            .flex-row{
                flex-direction: column;
            }
            .justify-center{
                justify-content: center;
            }
            .note-footer{
                width: 100%; 
                height: 20%;
                justify-content: space-between;
            }
            .page-button{
                cursor: pointer;
                margin-right: 5px;
                margin-left: 5px;
            }
            .order-note-wrapper{
                width: 10rem;
            }
            .order-note{
                height: 90%;
                min-height: 90%; 
                max-height: 90%;
                margin: 5px;
                border-radius: 5px;
                justify-content: space-around;
            }
            .order-note-text{
                max-width: 85%;
                min-width: 85%;
                width: 85%;
            }
            .order-note-text-wrap{
                margin: 2px;
                width: 100%;
                height: 100%;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
            }
            .no-notes-wrapper{
                min-height: 100%;
                max-height: 100%;
                align-items: center;
            }
        </style>
        <div style="height: 100%;">
            <div ng-if="vm.orderNotes.length > 0" class="notes-wrapper flex-container flex-column" style="min-height: 80%; max-height: 80%;">
                <div ng-repeat="note in vm.orderNotes.slice((vm.currentPage-1)*3) | limitTo: 3 track by $index" class="order-note-wrapper">
                    <div class="order-note flex-container flex-column" ng-click="vm.editNote(note, true)" ng-class="{ 'user-note': vm.isUserNote(note), 'admin-note': !vm.isUserNote(note) }">
                        <div class="order-note-text">
                            <p class="order-note-text-wrap" ng-attr-title="{{note.Note}}" >{{note.Note}}</p>
                        </div>
                        <div ng-click="vm.deleteNote($event, note);" style="cursor: pointer;">
                            <i class="fa fa-times" aria-hidden="true"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div ng-if="vm.orderNotes.length == 0" class="flex-container flex-row justify-center no-notes-wrapper">                
                <div>No notes found</div>
                <button ng-click="vm.editNote(null, true);" class="primary" style="font-weight: 400; padding: 2px; line-height: 10px;height: 18px;" >
                    Add note
                </button>
            </div>
            <div class="flex-container note-footer flex-column" style="min-height: 20%; max-height: 20%;">
                <button ng-click="vm.editNote(null, true);" class="primary" style="font-weight: 400; padding: 2px; line-height: 10px;height: 18px;" >
                    Add note
                </button>
                <div class="flex-container flex-column">
                    <div style="width: 20px;">
                        <div ng-show="vm.currentPage > 1" ng-dblclick="$event.stopPropagation()" ng-click="vm.addPage($event, -1);" class="page-button"><i class="fa fa-chevron-left" aria-hidden="true"></i></div>
                    </div>
                    <div style="width: 20px;">
                        <div ng-show="vm.currentPage < vm.totalPages()" ng-dblclick="$event.stopPropagation()" ng-click="vm.addPage($event, 1)" class="page-button"><i class="fa fa-chevron-right" aria-hidden="true"></i></div>
                    </div>
                </div>
            </div>
        </div>
        `;


    function OrderGridNotesCtrl ($scope){
        const vm = this;
        vm.scope = $scope;
        vm.currentPage = 1;
        vm.orderNote = [];

        vm.itemWatcher = vm.scope.$watch(() => vm.item.OrderId, function(newVal, oldVal){
            vm.$onInit();
        }, true);

        vm.$onInit = function () {
            vm.orderNotes = angular.copy(vm.notes);
            vm.order = angular.copy(vm.item);
        }

        vm.addPage = function ($event, page) {
            $event.stopPropagation();
            vm.currentPage += page;
        }

        vm.totalPages = function () {
            return Math.ceil(vm.orderNotes.length / 3);
        }

        vm.isUserNote = function (note) {
            let emailRegEx = /\S+@\S+\.\S+/;
            return emailRegEx.test(note.CreatedBy);
        }

        vm.editNote = function (note, edit) {
            let ctrl = new Core.Control({
                data: { note: note, edit: edit },
                controlName: "Order_EditOrderNote",
                height: "350px",
                width: "450px",
                element: event.target,
                position: "BOTTOM",
                newControl: true
            }, vm.options);
            
            ctrl.onGetEvent = function (event) {
                if (event.result) {
                    if (event.action == "SAVE") {
                        if (isEmptyOrSpaces(event.result.Note)) {
                            Core.Dialogs.addNotify("Note can't be empty!", 'ERROR');
                            return;
                        }
                        const index = vm.orderNotes.indexOf(note);
        
                        if (index == -1) {
                            vm.orderNotes.push(event.result);
                            vm.saveNotes("created");
                        } else {
                            vm.orderNotes[index] = event.result;
                            vm.saveNotes("edited");
                        }
                    }
                }
            };
        
            ctrl.open();
        }

        function isEmptyOrSpaces(str){
            return str === null || str.match(/^ *$/) !== null;
        }

        vm.deleteNote = function ($event, note) {
            $event.stopPropagation();
            dialogs.question({
                title: "Delete Note?",
                message: "Deleting this note will remove it from the system completely",
                callback:
                    async (event) => {
                        if (event.action == "YES") {
                            const index = vm.orderNotes.indexOf(note);
                            let temp = vm.orderNotes.length;
                            vm.orderNotes.splice(index, 1);
                            vm.saveNotes("deleted");
                            if ((index + 1) === temp && vm.orderNotes.length % 3 == 0 && vm.currentPage > 1) {
                                vm.currentPage--;
                            }
                        }
                    }
            }, self.options);
        }

        vm.saveNotes = function(actionName){
            new Services.OrdersService().setOrderNotes(vm.order.OrderId, vm.orderNotes, function (result) {
                if (result.error) {
                    Core.Dialogs.addNotify(result.error, 'ERROR');
                } else {
                    Core.Dialogs.addNotify(`Note ${actionName} succesfully`, 'SUCCESS');
                    vm.onUpdate(vm.order.OrderId, vm.orderNotes);
                }
            })
        };
    }

    angular.module("openOrdersViewService")
        .component("orderGridNotes", {
            template: orderGridNotesTemplate,
            controllerAs: "vm",
            bindings: {
                item: "=",
                notes: "=",
                onUpdate: "="
            },
            controller: OrderGridNotesCtrl
        });
});
