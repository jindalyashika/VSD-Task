
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
], function (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox
) {
    "use strict";

    return BaseController.extend("project1.controller.Home", {

        onInit: function () {

            this.setModel(
                new JSONModel({
                    total: 0,
                    active: 0,
                    pending: 0
                }),
                "dashboard"
            );

            this.getRouter()
                .getRoute("Home")
                .attachPatternMatched(this._loadCounts, this);
        },

        _loadCounts: function () {

            var oOData = this.getOwnerComponent().getModel();
            var oDash = this.getModel("dashboard");

            oOData.read("/Employees", {

                urlParameters: {
                    "$select": "status"
                },

                success: function (oData) {

                    var aEmp = oData.results;

                    oDash.setProperty("/total", aEmp.length);

                    oDash.setProperty(
                        "/active",
                        aEmp.filter(function (e) {
                            return e.status === "Active";
                        }).length
                    );
                },

                error: function (oError) {
                    console.error("Employee loading error:", oError);
                    MessageBox.error("Unable to load employee counts.");
                }
            });

            oOData.read("/LeaveRequests", {

                filters: [
                    new Filter(
                        "status",
                        FilterOperator.EQ,
                        "Pending"
                    )
                ],

                urlParameters: {
                    "$select": "ID"
                },

                success: function (oData) {
                    oDash.setProperty(
                        "/pending",
                        oData.results.length
                    );
                },

                error: function (oError) {
                    console.error("Leave request loading error:", oError);
                }
            });
        },

        // Navigate between internal application pages
        onNavigate: function (sRoute) {
            this.getRouter().navTo(sRoute);
        },

        // Open VSD Techno website in a new browser tab
        onOpenWebsite: function () {

            window.open(
                "https://vsdtechno.com/",
                "_blank",
                "noopener,noreferrer"
            );
        }

    });
});
