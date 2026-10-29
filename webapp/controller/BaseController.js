sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "../model/formatter",
  "../model/EmployeeHelper"
], function (Controller, History, Filter, FilterOperator, formatter, EmployeeHelper) {
  "use strict";

  return Controller.extend("project1.controller.BaseController", {

    formatter: formatter,

    getRouter: function () {
      return this.getOwnerComponent().getRouter();
    },
    getModel: function (sName) {
      return this.getView().getModel(sName);
    },
    setModel: function (oModel, sName) {
      return this.getView().setModel(oModel, sName);
    },
    getDataModel: function () {
      return this.getOwnerComponent().getModel();
    },
    getEmployees: function () {
      return this.getDataModel().getProperty("/employees") || [];
    },
    getBundle: function () {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    },
    getText: function (sKey, aArgs) {
      return this.getBundle().getText(sKey, aArgs);
    },

    onNavBack: function () {
      var sPrev = History.getInstance().getPreviousHash();
      if (sPrev !== undefined) {
        window.history.go(-1);
      } else {
        this.getRouter().navTo("Home", {}, true);
      }
    },

    /* Table search (used by Update, Delete, Display) */
    onSearch: function (oEvent) {
      var sQuery = (oEvent.getSource().getValue() || "").trim();
      var aFilters = [];
      if (sQuery) {
        aFilters.push(new Filter({
          filters: ["EmployeeID", "FirstName", "LastName", "Email", "JobRole"].map(function (s) {
            return new Filter(s, FilterOperator.Contains, sQuery);
          }),
          and: false
        }));
      }
      this.byId("empTable").getBinding("items").filter(aFilters);
    },

    /* Live validation of one field (used by the employee form) */
    onFieldChange: function (oEvent, sField) {
      var oForm = this._oFormModel;
      var oRes = EmployeeHelper.validate(oForm.getProperty("/emp"), this.getEmployees(), this.getBundle());
      oForm.setProperty("/state/" + sField, oRes.state[sField]);
      oForm.setProperty("/msg/" + sField, oRes.msg[sField]);
    }
  });
});