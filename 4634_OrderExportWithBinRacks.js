"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    const macroService = new Services.MacroService();
    const dashboardService = new Services.DashboardsService();
    const ordersService = new Services.OrdersService();

    const key = "placeholderCustomOrderExportTEST";
    const name = "Export orders to csv (TEST)";
    const icon = "fa func fa-download";
    const loadingNameHTML = "<i class=\"fa fa-spinner fa-spin\"></i> Export orders to csv (TEST)";
    const applicationName = "4634_OrderExportWithBinRacks";
    const macroName = "4634_OrderExportWithBinRacks";
    const ORDERS_PAGE_SIZE = 100;

    // const key = "placeholderOrderExportWithBinRacks";
    // const name = "Export orders to csv";
    // const icon = "fa func fa-download";
    // const loadingNameHTML = "<i class=\"fa fa-spinner fa-spin\"></i> Export orders to csv";
    // const applicationName = "4634_OrderExportWithBinRacks";
    // const macroName = "4634_OrderExportWithBinRacks";

    function placeholder ($scope) {
        const vm = this;
        vm.scope = $scope;

        vm.onClick = () => {
            const ids = vm.scope.$parent.viewStats?.selected_orders.map(o => o.id) ?? [];
            // const viewOrders = vm.scope.$parent.viewStats.orders?.filter(o => ids.findIndex(i => i == o.OrderId) > -1) ?? [];

            if (!ids.length)
                return;

            vm.setLoading(true);

            macroService.GetMacroConfigurations((response) => {
                const macroConfig = response.result.find((x) => x.ApplicationName === applicationName && x.MacroName === macroName);
                
                if (!macroConfig) {
                    showError('Not found macro config');
                    vm.setLoading(false);
                    return;
                }

                const parameter = macroConfig.Parameters.find((x) => x.ParameterName === 'location');
                const locations = parameter?.ParameterValue?.split(',') ?? [];

                if (!locations.length) {
                    showError('Locations are empty');
                    vm.setLoading(false);
                    return;
                }

                vm.getOrders(ids, 1, Math.ceil(ids.length / ORDERS_PAGE_SIZE), [], (orders) => {
                    vm.createReport(orders, locations);
                }); 
            });
        }

        vm.createReport = (orders, locations) => {
            const query = `
                WITH itemBinRacks AS (
                    SELECT  fkStockitemId
                            ,batch_inventory.BinRack
                            ,SUM (batch_inventory.Quantity) AS Quantity
                            ,MAX(batch_inventory.PrioritySequence) as PrioritySequence
                    FROM [stockitem].batch
                    INNER JOIN [stockitem].batch_inventory ON pkBatchId = fkBatchId
                    INNER JOIN StockLocation ON fkStockLocationId = pkStockLocationId
                    INNER JOIN StockItem ON pkStockItemId = fkStockItemId
                    WHERE batch.Deleted = 0 AND batch_inventory.Deleted = 0 AND Location IN (${locations.map(l => `'${l}'`).join(',')}) 
                    GROUP BY fkStockItemId, batch_inventory.BinRack
                    HAVING SUM (batch_inventory.Quantity) > 0
                ), priorityBinRacks AS (
                    SELECT 
                        *
                        ,RANK() OVER (PARTITION BY fkStockitemId ORDER BY PrioritySequence ASC, Quantity DESC) AS rank
                    FROM itemBinRacks
                )
                SELECT *
                FROM priorityBinRacks
                WHERE Rank = 1
            `;
            
            dashboardService.ExecuteCustomScriptQuery(query, function (response) {
                if (response.error) {
                    showError("Error running custom query");
                    vm.setLoading(false);
                    return;
                }

                const rowData = ordersToRowData(orders, response.result.Results);
                
                const csv = createCSVFromObjects(rowData);

                const date = new Date();
                const fileName = `OpenOrders_Export_${date.getDay()}_${date.getMonth()}_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}.csv`;
                const blobURL = URL.createObjectURL(new Blob([csv], { type: "text/plain" }));
                downloadFile(blobURL, fileName);

                vm.setLoading(false);
            });
        }

        vm.getOrders = (ids, pageNumber, totalPages, orders, callback) => {
            const idsPage = paginate(ids, ORDERS_PAGE_SIZE, pageNumber);
            ordersService.getOrders(idsPage, vm.scope.$parent.viewStats.LocationId, true, false, function (response) {
                if (response.error) {
                    showError(response.error?.ErrorMessage ?? "Error loading orders");
                    vm.setLoading(false);
                    return;
                }

                orders = [...orders, ...response.result];

                if (pageNumber < totalPages) {
                    vm.getOrders(ids, pageNumber + 1, totalPages, orders, callback);
                } else {
                    callback && callback(orders);
                }
            });
        }

        function paginate(array, page_size, page_number) {
            return array.slice((page_number - 1) * page_size, page_number * page_size);
        }

        function downloadFile(url, name) {
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(link);
        }

        function ordersToRowData(orders, itemsBinracks) {
            const rowData = [];
            const accountHash = JSON.parse(window.localStorage.getItem('SPA_auth_session')).md5Hash;
            for (const order of orders) { 
                for (const item of order.Items) {
                    const bin = itemsBinracks.find(i => i.fkStockitemId === item.StockItemId)?.BinRack;
                    const orderDate = new Date(order.GeneralInfo.ReceivedDate);
                    const imageUrl = item.ImageId ? `https://s3-eu-west-1.amazonaws.com/images.linnlive.com/${accountHash}/${item.ImageId}.jpg` : '';

                    const data = {
                        'Order Id': order.NumOrderId,
                        'External Reference': order.GeneralInfo?.ExternalReferenceNum ?? '',
                        'Status': statusToString(order.Status),
                        'Tag': !!order.GeneralInfo?.Marker ? `Tag ${order.GeneralInfo?.Marker}` : '',
                        'Source': order.GeneralInfo?.Source ?? '',
                        'SubSource': order.GeneralInfo?.SubSource ?? '',
                        'Invoice Is Printed': boolToString(order.GeneralInfo?.InvoicePrinted),
                        'Picklist Is Printed': boolToString(order.GeneralInfo?.PickListPrinted),
                        'Shipping Label Printed': boolToString(order.GeneralInfo?.LabelPrinted),
                        'Order Is Parked': boolToString(order.GeneralInfo?.IsParked),
                        'Is Locked': boolToString(order.GeneralInfo?.HoldOrCancel),
                        'Received Date': `${orderDate.getDay()}/${orderDate.getMonth()+1}/${orderDate.getFullYear()} ${orderDate.getHours()}:${orderDate.getMinutes()}`,
                        'Identifiers': order.GeneralInfo?.Identifiers?.map(i => i.Name)?.join(', ') ?? 'None',
                        'Tracking Number': order.ShippingInfo?.TrackingNumber ?? '',
                        'Vendor': order.ShippingInfo.Vendor ?? '',
                        'Service': order.ShippingInfo?.PostalServiceName ?? '',
                        'Packaging Type': order.ShippingInfo?.PackageType ?? '',
                        'Total Weight': order.ShippingInfo?.TotalWeight ?? '',
                        'Name': order.CustomerInfo?.Address?.FullName ?? '', 
                        'Company': order.CustomerInfo?.Address?.Company ?? '',
                        'Town': order.CustomerInfo?.Address?.Town ?? '',
                        'Postcode': order.CustomerInfo?.Address?.PostCode ?? '',
                        'Country': order.CustomerInfo?.Address?.Country ?? '',
                        'Email Address': order.CustomerInfo?.Address?.EmailAddress ?? '',
                        'Folder': order.FolderName?.join(', ') ?? '',
                        'Fulfillment State': order?.Fulfillment?.FulfillmentState ?? '',
                        'Image': imageUrl,
                        'Quantity': item.Quantity ?? '',
                        'Line Totals': item.CostIncTax ?? '',
                        'SKU': item.SKU ?? '',
                        'Title': item.Title ?? '',
                        'Sub Total': order.TotalsInfo?.Subtotal ?? '',
                        'Tax': order.TotalsInfo?.Tax ?? '',
                        'Total Charge': order.TotalsInfo?.TotalCharge ?? '',
                        'Bin Rack': bin ?? '' 
                    };

                    rowData.push(data);
                }
            }

            return rowData;
        }

        function statusToString(status) {
            switch(status){
                case 0:
                    return 'Unpaid';
                case 1:
                    return 'Paid';
                case 2:
                    return 'Return';
                case 3:
                    return 'Pending';
                case 4:
                    return 'Resend';
                default:
                    return 'Unpaid';
            }
        }

        function boolToString(value) {
            return !!value ? 'TRUE' : "FALSE"
        }

        function createCSVFromObjects(data) {
            let headerAdded = false;
            let csv = '';
            for (const obj of data) {
                if (!headerAdded) {
                    csv += Object.keys(obj).map(d => `"${d}"`).join() + "\r\n"; 
                    headerAdded = true;
                }
                csv += Object.values(obj).map(d => `"${d}"`).join() + '\r\n';
            }
            return csv;
        }

        vm.getItems = () => {
            return [{
                key: key,
                text: name,
                icon: icon,
                cssClass: ''
            }];
        }

        vm.isEnabled = (itemKey) => {
            return true;
        }

        vm.setLoading = (isLoading) => {
            if (isLoading) {
                vm.isEnabled = (itemKey) => false;
                vm.agButton.html(loadingNameHTML);
            } else {
                vm.isEnabled = (itemKey) => true;
                vm.agButton.html(vm.buttonInnerHTML);
            }
        }

        angular.element(document).ready(function () {
            const buttonElem = document.querySelectorAll(`button[key='${key}']`)[0];
            vm.buttonInnerHTML = buttonElem.innerHTML;
            vm.agButton = angular.element(buttonElem);

            vm.ordersSelectedWatch = $scope.$watch(() => $scope.viewStats.selected_orders, function(newVal, oldVal){
                if (newVal && newVal.length) {
                    vm.isEnabled = (itemKey) => true;
                } else {
                    vm.isEnabled = (itemKey) => false;
                }
            }, true);
        });
    };

    placeholderManager.register("OpenOrders_OrderControlButtons", placeholder);

    function showError(message){
        Core.Dialogs.addNotify({
            message: message,
            type: "ERROR",
            timeout: 5000,
        });
    };

    function showSuccess(message){
        Core.Dialogs.addNotify({
            message: message,
            type: "SUCCESS",
            timeout: 5000,
        });
    };
});
