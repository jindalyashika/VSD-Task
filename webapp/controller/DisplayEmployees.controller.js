sap.ui.define([
  "./BaseController",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (BaseController, Filter, FilterOperator) {
  "use strict";

  return BaseController.extend("project1.controller.DisplayEmployees", {

    onSearch: function (oEvent) {
      var sQuery = (oEvent.getSource().getValue() || "").trim();
      var aFilters = [];

      if (sQuery) {
        var aFields = ["employeeId", "firstName", "lastName", "email", "designation", "location"];
        aFilters.push(new Filter({
          filters: aFields.map(function (sField) {
            return new Filter(sField, FilterOperator.Contains, sQuery);
          }),
          and: false   // OR: a match in any field keeps the row
        }));
      }
      this.byId("employeeTable").getBinding("items").filter(aFilters);
    }
  });
});