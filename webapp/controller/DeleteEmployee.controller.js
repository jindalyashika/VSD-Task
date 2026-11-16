sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
  "use strict";

  return BaseController.extend("project1.controller.DeleteEmployee", {

    onInit: function () {
      // "path" is the row's address, "emp" holds the text shown in the dialog
      this._oForm = new JSONModel({ path: "", emp: {} });
      this.setModel(this._oForm, "form");
    },

    // load the dialog once, then reuse it
    _getDialog: function () {
      if (!this._pDialog) {
        this._pDialog = this.loadFragment({ name: "project1.view.fragments.DeleteEmployeeDialog" });
      }
      return this._pDialog;
    },

    onRowPress: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext();
      var o = oCtx.getObject();

      this._oForm.setData({
        path: oCtx.getPath(),                       // e.g. /Employees(guid'1111...')
        emp: {
          employeeId: o.employeeId || "",
          name: this.formatter.fullName(o.firstName, o.lastName),
          email: o.email || "",
          department: o.department ? o.department.name : "",
          designation: o.designation ? o.designation.description : ""
        }
      });
      this._getDialog().then(function (oDialog) { oDialog.open(); });
    },

    onConfirmDelete: function () {
      var sPath = this._oForm.getProperty("/path");
      var oEmp = this._oForm.getProperty("/emp");

      this.getOwnerComponent().getModel().remove(sPath, {
        success: function () {
          this.onCancelDelete();                      // close the dialog
          MessageToast.show(this.getText("deleteSuccess", [oEmp.employeeId || oEmp.name]));
        }.bind(this),
        error: function (oError) {
          // the service may refuse (for example if the employee is still linked to other data)
          var sMsg = "";
          try { sMsg = JSON.parse(oError.responseText).error.message.value; } catch (e) { /* not JSON */ }
          MessageBox.error(sMsg || this.getText("deleteError"));
        }.bind(this)
      });
    },

    onCancelDelete: function () {
      this._getDialog().then(function (oDialog) { oDialog.close(); });
    }
  });
});