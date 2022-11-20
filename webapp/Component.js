sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
 ], function (UIComponent, ResourceModel, JSONModel, Device) {
    "use strict";
    return UIComponent.extend("stock.Component", {
        metadata : {
            "interfaces" : ["sap.ui.core.IAsyncContentCreation"],
            "rootView": {
                "viewName": "stock.view.login.Login",
                "type": "XML",
                // "async": true, // implicitly set via the sap.ui.core.IAsyncContentCreation interface
                "id": "app"
            }
        },
       init : function () {
            // call the init function of the parent
            UIComponent.prototype.init.apply(this, arguments);

          // set i18n model
         let i18nModel = new ResourceModel({
            bundleName: "stock.i18n.i18n"
         });
         this.setModel(i18nModel, "i18n");

         // set device model
			var oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.setModel(oDeviceModel, "device");

         // create the views based on the url/hash
			this.getRouter().initialize();
       },

       getContentDensityClass : function () {
			if (!this._sContentDensityClass) {
				if (!Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
    });
 });
 