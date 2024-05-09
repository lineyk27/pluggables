'use strict';

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const datepicker = require("https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.umd.min.js");
    
    const placeHolder = function ($scope, $element, $http) {
        const vm = this;
        vm.ordersService = new Services.OrdersService(vm);
        vm.selectedOrders = [];
        vm.picker = null;

        vm.getItems = () => ([{
            key: "placeholderSetDespatchDate",
            text: "Set despatch date(test)",
            icon: "fa func fa-truck"
        }]);

        vm.isEnabled = (itemKey) => true;

        angular.element(document).ready(function () {
            vm.button = document.querySelectorAll("button[key='placeholderSetDespatchDate']")[0];
            vm.agButton = angular.element(vm.button);
            vm.buttonInnerHTML = vm.button.innerHTML;

            vm.picker = new datepicker.create({
                element: vm.button,
                css: [ 'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css',],
                autoApply: false,
                locale: {
                    apply: "Save"
                },
                setup(picker){
                    picker.on('select', (e) => {
                        const { date } = e.detail;
                        vm.onApproveSelectDate(date);
                        vm.agButton.html(vm.buttonInnerHTML);
                    });
                },
                zIndex: 100
            });

            vm.ordersSelectedWatch = $scope.$watch(() => $scope.viewStats.selected_orders, function(newVal, oldVal){
                if (newVal && newVal.length) {
                    vm.isEnabled = (itemKey) => true;
                } else {
                    vm.isEnabled = (itemKey) => false;
                }
            }, true);
        });

        vm.onClick = function(itemKey, $event){
            vm.setPopoverOpen(true);
        };

        vm.onApproveSelectDate = function(date){
            vm.selectedOrders = $scope.viewStats.selected_orders.map(i => i.id);
            vm.ordersService.getOrders(vm.selectedOrders, null, true, true, function(response){
                let orders = response.result;
                for(let order of orders){
                    vm.ordersService.setOrderGeneralInfo(order.OrderId, {
                        ReceivedDate: order.GeneralInfo.ReceivedDate,
                        Source: order.GeneralInfo.Source,
                        SubSource: order.GeneralInfo.SubSource,
                        Marker: order.GeneralInfo.Marker,
                        Status: order.GeneralInfo.Status,
                        DespatchByDate: date.format("YYYY-MM-DDTHH:mm:ss.sssZ"),
                        ReferenceNum: order.GeneralInfo.ReferenceNum,
                        ExternalReferenceNum: order.GeneralInfo.ExternalReferenceNum,
                        SecondaryReference: order.GeneralInfo.SecondaryReference,
                        SiteCode: order.GeneralInfo.SiteCode,
                        HasScheduledDelivery: order.GeneralInfo.HasScheduledDelivery,
                        ScheduledDelivery: order.GeneralInfo.HasScheduledDelivery ? {
                            From: order.GeneralInfo.ScheduledDelivery.From,
                            To: order.GeneralInfo.ScheduledDelivery.To
                        } : null,
                    }, false, (response) => {
                        if (response.error) {
                            Core.Dialogs.addNotify(`Error ${order.NumOrderId}:${response.error.errorMessage}`, 'ERROR');
                        }
                        vm.updatePropertyAndNote(order, date, () => vm.onUpdateGeneralInfo(order.OrderId));
                    });
                };
            });
        };

        vm.updatePropertyAndNote = function(order, date, callback){
            vm.ordersService.getExtendedProperties(order.OrderId, (response) => {
                let props = response.result;
                let datePropInd = props.findIndex(prop => prop.Name == 'date');
                if (datePropInd > -1) {
                    props[datePropInd].Value = date.format('YYYY-MM-DD');
                    vm.ordersService.setExtendedProperties(order.OrderId, props, responce => {
                        if (responce.error) {
                            Core.Dialogs.addNotify(`Error ${order.NumOrderId}:${responce.error.errorMessage}`, 'ERROR');
                        }
                        callback();
                    });
                } else {
                    vm.ordersService.getOrderNotes(order.OrderId, response => {
                        let notes = response.result;
                        let deliveryNoteInd = notes.findIndex(note => note.Note.indexOf('Delivery - ') > -1);
                        if (deliveryNoteInd > -1) {
                            notes[deliveryNoteInd].Note = 'Delivery - ' + date.format('DD-MM-YYYY');
                            vm.ordersService.setOrderNotes(order.OrderId, notes, responce => {
                                if (responce.error) {
                                    Core.Dialogs.addNotify(`Error ${order.NumOrderId}:${responce.error.errorMessage}`, 'ERROR');
                                }
                                callback();
                            });
                        } else {
                            callback();
                        }
                    });
                }
            });
        };

        vm.setPopoverOpen = function(isOpen){
            if (isOpen) {
                vm.picker.show()
            } else {
                vm.picker.hide();
            }
        };

        vm.onUpdateGeneralInfo = function (orderId){
            vm.selectedOrders.splice(vm.selectedOrders.indexOf(orderId), 1);
            if(!vm.selectedOrders.length){
                vm.setPopoverOpen(false);
            }
        };
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});