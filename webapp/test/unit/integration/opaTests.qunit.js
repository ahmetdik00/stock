/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"stock/test/unit/integration/NavigationJourney"
	], function () {
		QUnit.start();
	});
});
