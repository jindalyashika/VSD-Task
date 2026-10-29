sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
  "use strict";

  return BaseController.extend("project1.controller.DeleteEmployee", {

    onInit: function () {
      // holds a copy of the selected employee for the dialog
      this._oFormModel = new JSONModel({ emp: {} });
      this.setModel(this._oFormModel, "form");
    },

    _getDialog: function () {
      if (!this._pDialog) {
        this._pDialog = this.loadFragment({
          name: "project1.view.fragments.DeleteEmployeeDialog"
        });
      }
      return this._pDialog;
    },

    /* Row clicked: copy the employee and open the confirmation dialog */
    onRowPress: function (oEvent) {
      var oEmp = oEvent.getSource().getBindingContext().getObject();
      this._oFormModel.setProperty("/emp", Object.assign({}, oEmp));
      this._getDialog().then(function (oDialog) { oDialog.open(); });
    },

    /* Delete confirmed */
    onConfirmDelete: function () {
      var oModel = this.getDataModel();
      var sId = this._oFormModel.getProperty("/emp/EmployeeID");
      var aEmp = this.getEmployees();

      if (!aEmp.some(function (e) { return e.EmployeeID === sId; })) {
        MessageBox.error(this.getText("notFound"));
        return;
      }

      oModel.setProperty("/employees", aEmp.filter(function (e) {
        return e.EmployeeID !== sId;
      }));

      // keep data consistent: remove this employee's leave requests too
      oModel.setProperty("/leaveRequests", (oModel.getProperty("/leaveRequests") || [])
        .filter(function (l) { return l.EmployeeID !== sId; }));

      this.onCancelDelete();
      MessageToast.show(this.getText("deleteSuccess", [sId]));
    },

    onCancelDelete: function () {
      this._getDialog().then(function (oDialog) { oDialog.close(); });
    }
  });
});