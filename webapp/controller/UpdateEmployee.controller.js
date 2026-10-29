sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "../model/EmployeeHelper"
], function (BaseController, JSONModel, MessageBox, MessageToast, EmployeeHelper) {
  "use strict";

  return BaseController.extend("project1.controller.UpdateEmployee", {

    onInit: function () {
      this.setModel(new JSONModel({ rowType: "Active" }), "ui");
      this._oFormModel = new JSONModel({ emp: {}, state: {}, msg: {} });
      this.setModel(this._oFormModel, "form");
    },

    _getDialog: function () {
      if (!this._pDialog) {
        this._pDialog = this.loadFragment({ name: "project1.view.fragments.EditEmployeeDialog" })
          .then(function (oDialog) {
            return this.loadFragment({ name: "project1.view.fragments.EmployeeForm" })
              .then(function (oForm) {
                oDialog.addContent(oForm);
                return oDialog;
              });
          }.bind(this));
      }
      return this._pDialog;
    },

    onRowPress: function (oEvent) {
      var oEmp = oEvent.getSource().getBindingContext().getObject();
      var oStates = EmployeeHelper.emptyStates();
      // work on a copy so Cancel leaves the real data untouched
      this._oFormModel.setData({ emp: Object.assign({}, oEmp), state: oStates.state, msg: oStates.msg });
      this._getDialog().then(function (oDialog) { oDialog.open(); });
    },

    onSaveEdit: function () {
      var oRes = EmployeeHelper.validate(
        this._oFormModel.getProperty("/emp"), this.getEmployees(), this.getBundle());
      this._oFormModel.setProperty("/state", oRes.state);
      this._oFormModel.setProperty("/msg", oRes.msg);

      if (!oRes.valid) {
        MessageBox.error(this.getText("fixErrors"));
        return;
      }
      MessageBox.confirm(this.getText("confirmUpdate"), {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) { this._update(); }
        }.bind(this)
      });
    },

    _update: function () {
      var oEmp = EmployeeHelper.normalize(this._oFormModel.getProperty("/emp"));
      var iIdx = this.getEmployees().findIndex(function (e) { return e.EmployeeID === oEmp.EmployeeID; });

      if (iIdx < 0) {
        MessageBox.error(this.getText("notFound"));
        return;
      }
      this.getDataModel().setProperty("/employees/" + iIdx, oEmp);
      this.onCancelEdit();
      MessageToast.show(this.getText("updateSuccess", [oEmp.EmployeeID]));
    },

    onCancelEdit: function () {
      this._getDialog().then(function (oDialog) { oDialog.close(); });
    }
  });
});