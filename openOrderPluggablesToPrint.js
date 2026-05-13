"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");
    // const pdfLib = require("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.js");
    //
    const pdfLib = require("https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js");
    const ordersService = new Services.OrdersService();
    const rulesEngineService = new Services.RulesEngineService();

    const applicationName = "Pluggable_test";
    const printDocumentsMacroName = "OpenOrderDocumentButtons";
    const runeRulesEngineMacroName = "RunRulesEngineCustomButton";

    const ORDERS_PAGE = 100;

    const placeHolder = function ($scope) {
        const vm = this;
        vm.scope = $scope;
        vm.buttons = [];

        vm.getItems = () => {
            const configs = this.loadButtonConfigurations();
            const buttons = [];

            for (const config of configs){
                let button = buttons.find(b => b.name === config.button);
                if (!button) {
                    button = {
                        name: config.button,
                        key: crypto.randomUUID(),
                        disabled: false,
                        actions: []
                    };
                    buttons.push(button);
                }
                button.style ??= config.style;
                button.location ??= config.location;
                button.view ??= config.view;
                
                button.actions.push({
                    ...config,
                    action: createButtonActionByMacroConfig(config)
                });
            }

            vm.buttons = buttons;

            return buttons.map(b => ({
                key: b.key,
                text: b.name,
                icon: "fa-cogs",
                cssClass: b.style
            }));
        };

        vm.loadButtonConfigurations = () => {
            const configs = makeRequest("Macro/GetMacroConfigurations", "POST");

            const macroConfigs = configs.filter((x) => x.ApplicationName === applicationName && x.MacroName === printDocumentsMacroName && x.Enabled);

            const buttonConfigs = macroConfigs.map(c => {
                const macroParams = {};

                for (const param of c.Parameters) {
                    macroParams[param.ParameterName] = param.ParameterValue ?? "";
                }

                return {
                    ...macroParams,
                    macroName: c.MacroName,
                    macroId: c.MacroId,
                };
            });

            return buttonConfigs;
        };
        
        vm.onClick = async (itemKey, $event) => {
            console.log("Button " + itemKey + " clicked");
            const button = vm.buttons.find(b => b.key === itemKey);
            if (!button) {
                showError("Button not found");
                return;
            }
            button.disabled = true;            
            vm.isEnabled = vm._isEnabled;

            const ordersIds = vm.scope.$parent.viewStats.selected_orders.map(i => i.id);

            let acc = {};
            for (const orderId of ordersIds) {
                for (const action of button.actions.filter(c => c.multiOrder === "false")) {
                    acc = await action.action(acc, [orderId]);
                }
            }

            for (const action of button.actions.filter(c => c.multiOrder === "true")) {
                acc = await action.action(acc, ordersIds);
            }

            if (acc.resultDocument) {
                const resultBase64 = await acc.resultDocument.saveAsBase64();
                printPDFInNewWindow(resultBase64);
            }
            button.disabled = false;
            vm.isEnabled = vm._isEnabled;
        };

        angular.element(document).ready(function () {
            vm.ordersSelectedWatch = $scope.$watch(() => $scope.viewStats.selected_orders, function(newVal, oldVal){
                vm.isEnabled = vm._isEnabled;
            }, true);
        });

        vm.isEnabled = vm._isEnabled;

        vm._isEnabled = (itemKey) => {
            const button = vm.buttons.find(b => b.key === itemKey);
            const validLocation = !button.location || button.location.toLowerCase() === vm.scope.$parent.user_configuration.locations.current_location.LocationName.toLowerCase();
            const validView = !button.view || button.view.toLowerCase() === vm.scope.$parent.viewStats.ViewName.toLowerCase();
            return $scope.viewStats.selected_orders?.length && !button.disabled && validLocation && validView;
        }
    }

    async function createButtonActionByMacroConfig (config) {
        switch (config.macroName.toLowerCase()) {
            case printDocumentsMacroName.toLowerCase():
                return await createPrintDocumentsAction(config);
            case runeRulesEngineMacroName.toLowerCase():
                return await createRunRulesEngineAction(config);
            default:
                console.log("unknown macro to create action: ", config.macroName);
                return await Promise.resolve(() => {});
        }
    }

    async function createPrintDocumentsAction(config) {
        const { documentType, document, multiOrder} = config;
        
        switch (documentType.toLowerCase()){
            case 'Shipping Labels'.toLowerCase():
                return async (acc, ids) => await printPdf(acc, "Shipping Labels", "", multiOrder, ids);
            case 'Invoice Template'.toLowerCase():
                return async (acc, ids) => await printPdf(acc, "Invoice Template", document, multiOrder, ids);
            case "Packing List".toLowerCase():
                return async (acc, ids) => await printPdf(acc, "Packing List",  document, multiOrder, ids);
            case "Pick List".toLowerCase():
                return async (acc, ids) => await printPdf(acc, "Pick List",  document, multiOrder, ids);
            case "Package Slip".toLowerCase():
                return async (acc, ids) => await printPdf(acc, "Package Slip",  document, multiOrder, ids);
            case "Stock Item Labels".toLowerCase():
                return async (acc, ids) => await printPdf(acc, "Stock Item Labels",  document, multiOrder, ids);
            default:
                return await Promise.resolve(() => {});
        }
    }

    async function createRunRulesEngineAction (config) {
        const { ruleName } = config;
        return async (acc, ids) => await runRule(acc, ruleName, ids);
    }

    // function createButtonAction (config) {
    //     if (config.documentType.toLowerCase() === 'Shipping Labels'.toLowerCase()){ 
    //         return async (acc, ids) => await printPdf(acc, "Shipping Labels", "", config.multiOrder, config.style, ids, config.macroId);
    //     } else if (config.documentType.toLowerCase() === "Invoice Template".toLowerCase()) {
    //         return async (acc, ids) => await printPdf(acc, "Invoice Template", config.document, config.multiOrder, config.style, ids, config.macroId);
    //     } else if (config.documentType.toLowerCase() === "Packing List".toLowerCase()) {
    //         return async (acc, ids) => await printPdf(acc, "Packing List", config.document, config.multiOrder, config.style, ids, config.macroId);
    //     } else if (config.documentType.toLowerCase() === "Pick List".toLowerCase()) {
    //         return async (acc, ids) => await printPdf(acc, "Pick List", config.document, config.multiOrder, config.style, ids, config.macroId);
    //     } else if (config.documentType.toLowerCase() === "Package Slip".toLowerCase()) {
    //         return async (acc, ids) => await printPdf(acc, "Package Slip", config.document, config.multiOrder, config.style, ids, config.macroId);
    //     } else if (config.documentType.toLowerCase() === "Stock Item Labels".toLowerCase()) {
    //         return async (acc, ids) => await printPdf(acc, "Stock Item Labels", config.document, config.multiOrder, config.style, ids, config.macroId);
    //     } else if (config.documentType.toLowerCase() === "Run rules engine".toLowerCase()) {
    //         return async (acc, ids) => await runRule(acc, config.document, ids);
    //     } else {
    //         console.log("Unknown action for config: ", config);
    //         return async (acc) => await Promise.resolve(acc);
    //     }
    // }

    async function runRule (acc, rule, ids) {
        rulesEngineService.GetRules(response => {
            if (response.error) {
                showError("Error loading rules");
                return;
            }
            
            const rule1 = response.result.find(r => r.RuleName.toLowerCase() === rule.toLowerCase());
            if (rule1) {
                ordersService.runRulesEngine(ids, rule.pkRuleId, (responce) => {
                    if (responce.error) {
                        showError(`Error running rules engine on ${ids.length} orders`);
                        return;
                    } 
                    showSuccess("Run rules succesfully");
                });
            }
        });
        
        return await Promise.resolve(acc);
    }

    async function printPdf (acc, documentType, document, multiOrder, ids) {
        const idsStr = ids.join(',');
        const request = `applicationName=${applicationName}&macroName=${printDocumentsMacroName}&macroId=&button=&document=${document}&documentType=${documentType}&ids=${idsStr}&multiOrder=${multiOrder}&style=&view=&location=`;
        const response = await makeRequestAsync("Macro/Run", "POST", request);
        if (response.IsError) {
            showError(response.ErrorMessage);
            return acc;
        }
        
        if (!acc.resultDocument) {
            acc.resultDocument = await pdfLib.PDFDocument.create();
        };

        const pdfDocument = await pdfLib.PDFDocument.load(response.DocumentBase64);
        const pdfDocumentPages = await acc.resultDocument.copyPages(pdfDocument, getDocumentIndices(pdfDocument));
        
        for (const page of pdfDocumentPages) {
            acc.resultDocument.addPage(page);
        }

        return acc;
    }

    function makeRequest(extension, method, body = null) {
        const session = JSON.parse(window.localStorage.getItem('SPA_auth_session'));
        const url = `${session.server}/api/${extension}`;
        const xhr = new XMLHttpRequest();

        xhr.open(method, url, false); // 'false' makes the request synchronous
        xhr.setRequestHeader('Authorization', session.token);
        xhr.send(body);

        if (xhr.status === 200) {
            return JSON.parse(xhr.responseText);
        } else {
            return null;
        }
    }

    async function makeRequestAsync(extension, method, request = null) {
        const session = JSON.parse(window.localStorage.getItem('SPA_auth_session'));
        const url = `${session.server}/api/${extension}?requestTracingId=${crypto.randomUUID()}`;
        const result = await fetch(url, {
            method,
            headers: {
                'Authorization': session.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: request,
        })

        return await result.json();
    }

    function showError(message){
        Core.Dialogs.addNotify({
            message: message,
            type: "ERROR",
            timeout: 5000,
        });
    }

    function showSuccess(message){
        Core.Dialogs.addNotify({
            message: message,
            type: "SUCCESS",
            timeout: 5000,
        });
    }

    function getDocumentIndices(pdfDoc){
        let arr = [];
        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
            arr.push(i);
        }
        return arr;
    }

    function printPDFInNewWindow(pdfBase64) {
        const blob = b64toBlob(pdfBase64, "application/pdf");
        const blobURL = URL.createObjectURL(blob);
        let popup = window.open(blobURL, "", "width=1,height=1,scrollbars=no,resizable=no,toolbar=no,menubar=0,status=no,directories=0,visible=none");

        if (popup == null) {
            Core.Dialogs.addNotify({message: "Cannot open window for print", type: "ERROR", timeout: 5000});
        }
        popup.print();

        setTimeout(() => {
            popup.close();
        }, 30000);
    }

    function b64toBlob(content, contentType) {
        contentType = contentType || '';
        const sliceSize = 512;
        const byteCharacters = window.atob(content);
    
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, {
            type: contentType
        });
        return blob;
    }

    (function appendStyles () {
        const styleSheet = document.createElement("style");
        styleSheet.innerHTML = `
            .stripedBlue {
                font-weight: 600;
                color: white !important;
                border: solid #29305aff 1px !important;
                background: repeating-linear-gradient(-45deg, #606dbc, #606dbc 10px, #465298 10px, #465298 20px) !important;
            }
            .stripedBlack {
                font-weight: 600;
                color: #fff !important;
                border: solid #212221ff 1px !important;
                background: repeating-linear-gradient(-45deg, #222, #222 10px, #333 10px, #333 20px) !important;
            }
        `;
        document.head.appendChild(styleSheet);
    })();

    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);
});