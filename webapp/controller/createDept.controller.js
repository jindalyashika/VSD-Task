sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageBox, MessageToast) {
  "use strict";

  return BaseController.extend("project1.controller.createDept", {

    onInit: function () {
      this._oForm = new JSONModel();
      this.setModel(this._oForm, "form");
      this.getRouter().getRoute("CreateDeptRequest").attachPatternMatched(this._resetForm, this);
    },

    _resetForm: function () {
      this._oForm.setData({
        dept: { name: "", description: "" },
        state: { name: "None" },
        msg: { name: "" }
      });
    },

    onReset: function () {
      this._resetForm();
    },

    // when the user edits the name, remove its red state
    onFieldEdit: function () {
      this._oForm.setProperty("/state/name", "None");
      this._oForm.setProperty("/msg/name", "");
    },

    // returns true if valid, and marks the name field red if not
    _check: function () {
      var sName = this._oForm.getProperty("/dept/name").trim();
      var sKey = "";

      if (!sName) { sKey = "errRequired"; }
      else if (sName.length < 2) { sKey = "errDeptName"; }

      this._oForm.setProperty("/state/name", sKey ? "Error" : "None");
      this._oForm.setProperty("/msg/name", sKey ? this.getText(sKey) : "");
      return !sKey;
    },

    onSave: function () {
      if (!this._check()) {
        MessageBox.error(this.getText("fixErrors"));
        return;
      }
      MessageBox.confirm(this.getText("confirmCreateDept"), {
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) { this._create(); }
        }.bind(this)
      });
    },

    // step 1: does a department with this name already exist?
    _create: function () {
      var sName = this._oForm.getProperty("/dept/name").trim();

      this.getView().setBusy(true);
      this.getOwnerComponent().getModel().read("/Departments", {
        filters: [new Filter({
          path: "name",
          operator: FilterOperator.EQ,
          value1: sName,
          caseSensitive: false          // "finance" and "Finance" count as the same
        })],
        urlParameters: { "$select": "ID" },
        success: function (oData) {
          if (oData.results.length > 0) {
            this.getView().setBusy(false);
            this._oForm.setProperty("/state/name", "Error");
            this._oForm.setProperty("/msg/name", this.getText("errDeptExists"));
            return;                      // stop here, nothing is created
          }
          this._save();                  // step 2: really create it
        }.bind(this),
        error: function () {
          this.getView().setBusy(false);
          MessageBox.error(this.getText("loadError"));
        }.bind(this)
      });
    },

    // step 2: really create the department
    _save: function () {
      var oDept = this._oForm.getProperty("/dept");

      // only the fields the service accepts. No ID: the server creates it
      var oPayload = {
        name: oDept.name.trim(),
        description: oDept.description.trim()
      };

      // the page is already busy from _create, so we only switch it off at the end
      this.getOwnerComponent().getModel().create("/Departments", oPayload, {
        success: function () {
          this.getView().setBusy(false);
          MessageToast.show(this.getText("createDeptSuccess", [oPayload.name]));
          this._resetForm();
        }.bind(this),
        error: function () {
          this.getView().setBusy(false);
          MessageBox.error(this.getText("createDeptError"));
        }.bind(this)
      });
    }
  });
});