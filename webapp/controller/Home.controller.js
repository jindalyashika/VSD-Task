sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageBox) {
  "use strict";

  return BaseController.extend("project1.controller.Home", {

    onInit: function () {
      // small local model that only holds the numbers shown on the tiles
      this.setModel(new JSONModel({ total: 0, active: 0, pending: 0 }), "dashboard");
      // load the numbers every time the dashboard is shown
      this.getRouter().getRoute("Home").attachPatternMatched(this._loadCounts, this);
    },

    _loadCounts: function () {
      var oOData = this.getOwnerComponent().getModel();   // the OData model
      var oDash = this.getModel("dashboard");              // the small local model
      var sError = this.getText("loadError");

      // 1) all employees: we only ask for the "status" column
      oOData.read("/Employees", {
        urlParameters: { "$select": "status" },
        success: function (oData) {
          var aEmp = oData.results;
          oDash.setProperty("/total", aEmp.length);
          oDash.setProperty("/active", aEmp.filter(function (e) {
            return e.status === "Active";
          }).length);
        },
        error: function () { MessageBox.error(sError); }
      });

      // 2) only the pending leave requests: the server does the filtering
      oOData.read("/LeaveRequests", {
        filters: [new Filter("status", FilterOperator.EQ, "Pending")],
        urlParameters: { "$select": "ID" },
        success: function (oData) {
          oDash.setProperty("/pending", oData.results.length);
        },
        error: function () { MessageBox.error(sError); }
      });
    },

    onNavigate: function (sRoute) {
      this.getRouter().navTo(sRoute);
    }
  });
});