
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "project1/model/models"
], (UIComponent, Device, models) => {
    "use strict";

    return UIComponent.extend("project1.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // Initialize the base component and manifest models
            UIComponent.prototype.init.apply(this, arguments);

            // Set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Initialize routing
            const oRouter = this.getRouter();

            oRouter.attachRouteMatched((oEvent) => {
                console.log(
                    "ROUTE MATCHED:",
                    oEvent.getParameter("name")
                );
            });

            oRouter.attachBypassed(() => {
                console.log("ROUTE BYPASSED");
            });

            oRouter.getTargets().attachDisplay((oEvent) => {
                console.log(
                    "TARGET DISPLAY:",
                    oEvent.getParameter("name")
                );
            });

            oRouter.initialize();
        },

        getContentDensityClass() {
            return Device.support.touch
                ? "sapUiSizeCozy"
                : "sapUiSizeCompact";
        }
    });
});
