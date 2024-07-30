"use strict";

define(function(require) {
    const placeholderManager = require("core/placeholderManager");

    const placeHolder = function ($scope) {
        const vm = this;
        vm.printService = new Services.PrintService(vm);
        vm.pdfData = "";

        vm.getItems = () => ([{
            key: "plaveholderSilentPrint",
            text: "Silent print shipping label",
            icon: "fa func fa-comments"
        }]);

        vm.onClick = (itemKey, $event) => {            
            const blob = b64toBlob(vm.pdfData, "application/pdf");
            const blobURL = URL.createObjectURL(blob);
            var popup;
            
            var winfeatures = "width=1,height=1,scrollbars=no,resizable=no,toolbar=no,menubar=0,status=no,directories=0,visible=none"
            popup = window.open(blobURL, "", winfeatures);
            
            if (popup == null) console.log("Popup with PDF was not opened because NULL.");
            popup.print();
            setTimeout(() => {
                popup.close();
            }, 5000);
        };

        function b64toBlob(content, contentType) {
            contentType = contentType || '';
            const sliceSize = 512;
            // method which converts base64 to binary
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
            }); // statement which creates the blob
            return blob;
          }

    };
    placeholderManager.register("OpenOrders_OrderControlButtons", placeHolder);

});