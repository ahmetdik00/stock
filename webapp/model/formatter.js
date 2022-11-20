sap.ui.define([
	"sap/ui/core/library"
], function (coreLibrary) {
	"use strict";

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	return {
		statusText: function (sStatus) {
			var resourceBundle = this.getView().getModel("i18n").getResourceBundle();
			switch (sStatus) {
				case "A":
					return resourceBundle.getText("invoiceStatusA");
				case "B":
					return resourceBundle.getText("invoiceStatusB");
				case "C":
					return resourceBundle.getText("invoiceStatusC");
				default:
					return sStatus;
			}
		}
	};
});