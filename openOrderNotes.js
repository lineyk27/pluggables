// @ts-nocheck
"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const editOrderNoteView = require("views/Order_EditOrderNote");
    const orderNotes = require("modules/orderbook/scripts/orderNotes.js");
    const dialogs = require('core/dialogs');
    const BaseCellRenderer = require("modules/orderbook/orders/components/stacked-view-grid/base/base-cell-renderer");
    const AGGridColumn = require("modules/orderbook/orders/components/stacked-view-grid/ag-grid-column");

    window.stylesAdded = false;

    const styles = `
        .user-note{
            background-color: #ffc21c;
        }
        .admin-note{
            background-color:rgb(255, 251, 0);
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
            min-width: 5rem;
            max-width: 10rem;
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
            height: 80%;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
            white-space: initial;
        }
        .no-notes-wrapper{
            min-height: 100%;
            max-height: 100%;
            align-items: center;
        }
        `;

    const stylesOld = `
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
    `;

    const orderGridNotesTemplate = `
        <div style="height: 100%;">
            <div ng-if="notes.length > 0" class="notes-wrapper flex-container flex-column" style="min-height: 80%; max-height: 80%;">
                <div ng-repeat="note in notes.slice((currentPage-1)*3) | limitTo: 3 track by $index" class="order-note-wrapper">
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
            <div ng-if="notes.length == 0" class="flex-container flex-row justify-center no-notes-wrapper">                
                <div>No notes found</div>
                <button ng-click="editNote(null, true);" class="primary" style="font-weight: 400; padding: 2px; line-height: 10px;height: 18px;" >
                    Add note
                </button>
            </div>
            <div ng-if="notes.length > 0" class="flex-container note-footer flex-column" style="min-height: 20%; max-height: 20%;">
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

    const orderGridNotesTemplateOld = `
        <div style="height: 100%;">
            <div ng-if="vm.notes.length > 0" class="notes-wrapper flex-container flex-column" style="min-height: 80%; max-height: 80%;">
                <div ng-repeat="note in vm.notes.slice((vm.currentPage-1)*3) | limitTo: 3 track by $index" class="order-note-wrapper">
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
            <div ng-if="vm.notes.length == 0" class="flex-container flex-row justify-center no-notes-wrapper">                
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

    const cellRenderer = class OrderNotesCellRenderer extends BaseCellRenderer {
        init(params){
            this.childScope = params.context.$scope.$new();

            this.eGui = document.createElement('div');
            angular.element(this.eGui).css('height', '100%');
            this.childScope.$apply(() => {
                const scopeVm = this.childScope;
                this.childScope.orderId = params.data.OrderId;
                this.childScope.notes = params.context.notesData.notes[params.data.OrderId] || [];
                this.childScope.notesData = params.context.notesData;
                this.childScope.currentPage = 1;

                this.eGui.innerHTML = orderGridNotesTemplate;

                this.childScope.addPage = function ($event, page) {
                    $event.stopPropagation();
                    scopeVm.currentPage += page;
                }
                
                this.childScope.totalPages = function () {
                    return Math.ceil(scopeVm.notes.length / 3);
                }
                
                this.childScope.isUserNote = function (note) {
                    let emailRegEx = /\S+@\S+\.\S+/;
                    return emailRegEx.test(note.CreatedBy);
                }
                
                this.childScope.editNote = function (note, edit) {
                    scopeVm.notesData.onChangeNote();
                    const ctrl = new Core.Control({
                        data: { note: note, edit: edit },
                        controlName: "Order_EditOrderNote",
                        height: "350px",
                        width: "450px",
                        element: event.target,
                        position: "BOTTOM",
                        newControl: true,
                        onBackDropClick: function (event) {
                            scopeVm.notesData.onEndChangeNote();
                        }
                    }, scopeVm.options);
                    
                    ctrl.onGetEvent = function (event) {
                        scopeVm.notesData.onEndChangeNote();
                        if (event.result) {
                            if (event.action == "SAVE") {
                                if (isEmptyOrSpaces(event.result.Note)) {
                                    Core.Dialogs.addNotify("Note can't be empty!", 'ERROR');
                                    return;
                                }
                                const index = scopeVm.notes.indexOf(note);
                                
                                if (index == -1) {
                                    scopeVm.notes.push(event.result);
                                    scopeVm.saveNotes("created");
                                } else {
                                    scopeVm.notes[index] = event.result;
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
                                    const index = scopeVm.notes.indexOf(note);
                                    const temp = scopeVm.notes.length;
                                    scopeVm.notes.splice(index, 1);
                                    scopeVm.saveNotes("deleted");
                                    if ((index + 1) === temp && scopeVm.notes.length % 3 == 0 && scopeVm.currentPage > 1) {
                                        scopeVm.currentPage--;
                                    }
                                }
                            }
                    }, self.options);
                }
        
                scopeVm.saveNotes = function(actionName){
                    new Services.OrdersService().setOrderNotes(scopeVm.orderId, scopeVm.notes, function (result) {
                        if (result.error) {
                            Core.Dialogs.addNotify(result.error, 'ERROR');
                        } else {
                            Core.Dialogs.addNotify(`Note ${actionName} succesfully`, 'SUCCESS');
                            scopeVm.notesData.onUpdate(scopeVm.orderId, scopeVm.notes);
                        }
                    })
                };

                params.context.$compile(this.eGui)(this.childScope);
            });
        }
    };

    const placeHolder = function ($scope) {
        const vm = this;
        vm.scope = $scope;
        vm.macroService = new Services.MacroService(vm);
        vm.showColumn = false;
        vm.ordersNotes = {};
        vm.placeholderKey = "placeholderAddOrderNotesColumn";
        vm.buttonHTML = "<i class=\"fa func fa-comments\"></i> Show notes";
        vm.loadingNotesHTML = "<i class=\"fa fa-spinner fa-spin\"></i> Show notes"
        vm.hideNotesHTML = "<i class=\"fa func fa-comments\"></i> Hide notes"
        vm._isEnabled = true;
        vm.gridScope = null;
        vm.isNewGrid = null;

        vm.getItems = function () {
            return [{
                key: vm.placeholderKey,
                text: "Show notes",
                icon: "fa func fa-comments"
            }];
        };

        vm.isVisible = function () { 
            return true; 
        };
        
        vm.isEnabled = function (itemKey) {
            return vm._isEnabled;
        };

        vm.setLoading = (isLoading) => {
            if (isLoading) {
                vm._isEnabled = false;
                vm.agButton.html(vm.loadingNotesHTML);
            } else {
                vm._isEnabled = true;
                vm.agButton.html(vm.hideNotesHTML);
            }
        };

        vm.onClick = function (itemKey, $event) {
            const orderIds = vm.scope.viewStats.orders?.map(i => i.OrderId) ?? [];

            if (!orderIds.length) {
                Core.Dialogs.addNotify("No orders found", 'WARNING');
                return;
            };

            const privateCustomers = ['em@feroxon.com'];

            const session = JSON.parse(window.localStorage.getItem('SPA_auth_session'));

            let appName = 'Notes Manager - New Orders Screen';

            if (session && privateCustomers.indexOf(session.email) > -1) {
                appName = 'Notes Manager Custom';
            }

            if (!vm.showColumn) {
                vm.setLoading(true);
                vm.loadNotes({}, orderIds, 1, Math.ceil(orderIds.length / 100), appName, vm.addNotesColumn);
            } else {
                vm.removeNotesColumn();
            };
        };

        angular.element(document).ready(function () {
            vm.button = document.querySelectorAll(`button[key='${vm.placeholderKey}']`)[0];
            vm.agButton = angular.element(vm.button);
            vm.buttonHTML = vm.button.innerHTML;
        });

        vm.scope.$watch(() => vm.scope.viewStats.orders?.map(i => i.OrderId) ?? [], function(newVal, oldVal){
            const oldIds = oldVal.map(i => i.OrderId);
            const newIds = newVal.map(i => i.OrderId);
            
            if (newIds.toString() !== oldIds.toString()) {
                vm.showColumn = false;
                vm.agButton.html(vm.buttonHTML);
            }
        }, true);

        vm.addNotesColumn = () => {
            const newGrid = angular.element("stacked-view-grid")[0];
            const isNewGrid = !!newGrid;

            if (isNewGrid) {
                vm.gridScope = angular.element("stacked-view-grid").scope();
            } else if (angular.element("view-grid")) {
                vm.gridScope = angular.element("view-grid").scope();
            } else {
                Core.Dialogs.addNotify("Cant find view grid scope", 'WARNING');
                vm.setLoading(false);
                return;
            }

            const notesData = {
                notes: vm.ordersNotes,
                onUpdate: function(orderId, notes){
                    vm.ordersNotes[orderId] = notes;
                },
                onChangeNote: function () {
                    vm.scope.unbind_events();
                },
                onEndChangeNote: function () {
                    vm.scope.bind_events();
                }
            };
            
            vm.gridScope.$ctrl.notesData = notesData;

            if (!window.stylesAdded) {
                const stylesToAdd = isNewGrid ? styles : stylesOld;
                const styleElem = document.createElement('style');
                styleElem.innerHTML = stylesToAdd;
                document.head.appendChild(styleElem);
                window.stylesAdded = true;
            }

            if (isNewGrid) {
                let columnDefs = vm.gridScope.$ctrl.api.gridApi.getColumnDefs();
                const maxSequence = Math.max(...columnDefs.map(o => o.sequence));
                
                const columnDefinition = new AGGridColumn({ 
                    sequence: maxSequence + 1, 
                    code: 'NOTES', 
                    pinned: null, 
                    name: 'Notes', 
                    suppressMenu: true, 
                    cellRenderer: cellRenderer, 
                    templateId: '' 
                });
                
                columnDefs = columnDefs.concat([columnDefinition]);
                
                vm.gridScope.$ctrl.api.gridApi.setColumnDefs(columnDefs);
            } else {                
                const columnDefinition = {
                    sequence: vm.gridScope.$ctrl.gridOpts.columnDefs.length + 1,
                    code: "NOTES",
                    name: "Notes",
                    displayName: "Notes",
                    referencedName: "Notes",
                    cellTemplate: "<order-grid-notes item='row.entity' notes-data='grid.appScope.notesData'></order-grid-notes>",
                    width: 500,
                    enableColumnMoving: true,
                    enableColumnResizing: true,
                    type: "string"
                };

                vm.gridScope.$ctrl.gridOpts.columnDefs.push(columnDefinition)
            }

            vm.isNewGrid = isNewGrid;
            vm.showColumn = true;
            vm.setLoading(false);
        };

        vm.removeNotesColumn = () => {
            if (vm.isNewGrid) {
                let columnDefs = vm.gridScope.$ctrl.api.gridApi.getColumnDefs();
                const colInd = columnDefs.findIndex(item => item.code === "NOTES");
                if (colInd > -1) {
                    columnDefs.splice(colInd, 1);
                }
                vm.gridScope.$ctrl.api.gridApi.setColumnDefs(columnDefs);
            } else {
                const colInd = vm.gridScope.$ctrl.gridOpts.columnDefs.findIndex(item => item.code === "NOTES");
                if (colInd > -1) {
                    vm.gridScope.$ctrl.gridOpts.columnDefs.splice(colInd, 1);
                } else {
                    console.error("Column notes not found");
                }
            }

            vm.showColumn = false;
            vm.agButton.html(vm.buttonHTML);
        };

        vm.loadNotes = (ordersNotes, allOrderIds, pageNumber, totalPages, appName, callback) => {
            const orderIds = paginate(allOrderIds, 100, pageNumber);
            vm.macroService.Run({applicationName: appName, macroName: "NotesManagerMacro", orderIds: orderIds}, function(result) {
                if (result.error || result.result.Error) {
                    const error = result.error || result.result.Error;
                    Core.Dialogs.addNotify(error, 'ERROR');
                    vm.setLoading(false);
                    return;
                }
                
                ordersNotes = Object.assign({}, ordersNotes, result.result.OrdersNotes);

                if (pageNumber == totalPages) {
                    vm.ordersNotes = ordersNotes;
                    return callback && callback();
                }
                
                vm.loadNotes(ordersNotes, allOrderIds, pageNumber + 1, totalPages, appName, callback);
            });
        };

        function paginate(array, page_size, page_number) {
            return array.slice((page_number - 1) * page_size, page_number * page_size);
        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);

    function OrderGridNotesCtrl ($scope){
        const vm = this;
        vm.scope = $scope;
        vm.currentPage = 1;
        vm.orderNote = [];

        vm.itemWatcher = vm.scope.$watch(() => vm.item.OrderId, function(newVal, oldVal){
            vm.$onInit();
        }, true);

        vm.$onInit = function () {
            vm.notes = vm.notesData.notes[vm.item.OrderId] || [];
            vm.order = angular.copy(vm.item);
        }

        vm.addPage = function ($event, page) {
            $event.stopPropagation();
            vm.currentPage += page;
        }

        vm.totalPages = function () {
            return Math.ceil(vm.notes.length / 3);
        }

        vm.isUserNote = function (note) {
            let emailRegEx = /\S+@\S+\.\S+/;
            return emailRegEx.test(note.CreatedBy);
        }

        vm.editNote = function (note, edit) {
            vm.notesData.onChangeNote();
            let ctrl = new Core.Control({
                data: { note: note, edit: edit },
                controlName: "Order_EditOrderNote",
                height: "350px",
                width: "450px",
                element: event.target,
                position: "BOTTOM",
                newControl: true,
                onBackDropClick: function (event) {
                    vm.notesData.onEndChangeNote();
                }
            }, vm.options);
            
            ctrl.onGetEvent = function (event) {
                vm.notesData.onEndChangeNote();
                if (event.result) {
                    if (event.action == "SAVE") {
                        if (isEmptyOrSpaces(event.result.Note)) {
                            Core.Dialogs.addNotify("Note can't be empty!", 'ERROR');
                            return;
                        }
                        const index = vm.notes.indexOf(note);
        
                        if (index == -1) {
                            vm.notes.push(event.result);
                            vm.saveNotes("created");
                        } else {
                            vm.notes[index] = event.result;
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
                            const index = vm.notes.indexOf(note);
                            let temp = vm.notes.length;
                            vm.notes.splice(index, 1);
                            vm.saveNotes("deleted");
                            if ((index + 1) === temp && vm.notes.length % 3 == 0 && vm.currentPage > 1) {
                                vm.currentPage--;
                            }
                        }
                    }
            }, self.options);
        }

        vm.saveNotes = function(actionName){
            new Services.OrdersService().setOrderNotes(vm.order.OrderId, vm.notes, function (result) {
                if (result.error) {
                    Core.Dialogs.addNotify(result.error, 'ERROR');
                } else {
                    Core.Dialogs.addNotify(`Note ${actionName} succesfully`, 'SUCCESS');
                    vm.notesData.onUpdate(vm.order.OrderId, vm.notes);
                }
            })
        };
    }

    angular.module("openOrdersViewService")
        .component("orderGridNotes", {
            template: orderGridNotesTemplateOld,
            controllerAs: "vm",
            bindings: {
                item: "=",
                notesData: "="
            },
            controller: OrderGridNotesCtrl
        });
});
