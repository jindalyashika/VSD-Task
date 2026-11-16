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
        // plain text fields only: the designation is a link now, so it is not searched
        var aFields = ["employeeId", "firstName", "lastName", "email", "location"];
        aFilters.push(new Filter({
          filters: aFields.map(function (sField) {
            return new Filter(sField, FilterOperator.Contains, sQuery);
          }),
          and: false   // OR: a match in any field keeps the row
        }));
      }
      this.byId("empTable8").getBinding("items").filter(aFilters);
    }
  });
});