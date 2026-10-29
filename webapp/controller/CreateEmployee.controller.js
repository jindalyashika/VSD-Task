sap.ui.define([
  "./BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
  "use strict";

  // fields that show a red state when invalid
  var FIELDS = ["firstName", "lastName", "email", "phone", "department_ID", "designation", "joiningDate"];

  return BaseController.extend("project1.controller.CreateEmployee", {

    onInit: function () {
      this._oForm = new JSONModel();
      this.setModel(this._oForm, "form");
      this.getRouter().getRoute("CreateEmployee").attachPatternMatched(this._onMatched, this);
    },

    _onMatched: function () {
      this._resetForm();
      this._loadNextId();
    },

    _resetForm: function () {
      var oState = {}, oMsg = {};
      FIELDS.forEach(function (f) { oState[f] = "None"; oMsg[f] = ""; });

      this._oForm.setData({
        emp: {
          employeeId: "", firstName: "", lastName: "", email: "", phone: "",
          designation: "", location: "", joiningDate: null,
          status: "Active", department_ID: ""
        },
        state: oState,
        msg: oMsg
      });
    },

    // ask the server for all employee IDs, then take the highest number + 1
    _loadNextId: function () {
      this.getOwnerComponent().getModel().read("/Employees", {
        urlParameters: { "$select": "employeeId" },
        success: function (oData) {
          var iMax = 0;
          oData.results.forEach(function (e) {
            var n = parseInt(String(e.employeeId || "").replace(/\D/g, ""), 10) || 0;
            if (n > iMax) { iMax = n; }
          });
          this._oForm.setProperty("/emp/employeeId", "EMP" + String(iMax + 1).padStart(3, "0"));
        }.bind(this),
        error: function () { MessageBox.error(this.getText("loadError")); }.bind(this)
      });
    },

    onReset: function () {
      this._resetForm();
      this._loadNextId();
    },

    // when the user edits a field, remove its red state
    onFieldEdit: function (oEvent, sField) {
      this._oForm.setProperty("/state/" + sField, "None");
      this._oForm.setProperty("/msg/" + sField, "");
    },

    // returns true if everything is valid, and marks bad fields in red
    _check: function () {
      var oEmp = this._oForm.getProperty("/emp");
      var oState = {}, oMsg = {};
      var bOk = true;
      var that = this;

      FIELDS.forEach(function (f) { oState[f] = "None"; oMsg[f] = ""; });

      function bad(sField, sKey) {
        oState[sField] = "Error";
        oMsg[sField] = that.getText(sKey);
        bOk = false;
      }

      if (!oEmp.firstName.trim()) { bad("firstName", "errRequired"); }
      else if (!/^[A-Za-z][A-Za-z .'-]{1,29}$/.test(oEmp.firstName.trim())) { bad("firstName", "errName"); }

      if (!oEmp.lastName.trim()) { bad("lastName", "errRequired"); }
      else if (!/^[A-Za-z][A-Za-z .'-]{1,29}$/.test(oEmp.lastName.trim())) { bad("lastName", "errName"); }

      if (!oEmp.email.trim()) { bad("email", "errRequired"); }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(oEmp.email.trim())) { bad("email", "errEmail"); }

      if (!oEmp.phone.trim()) { bad("phone", "errRequired"); }
      else if (!/^[6-9]\d{9}$/.test(oEmp.phone.trim())) { bad("phone", "errPhone"); }

      if (!oEmp.department_ID) { bad("department_ID", "errRequired"); }
      if (!oEmp.designation.trim()) { bad("designation", "errRequired"); }
      if (!oEmp.joiningDate) { bad("joiningDate", "errRequired"); }

      this._oForm.setProperty("/state", oState);
      this._oForm.setProperty("/msg", oMsg);
      return bOk;
    },

    onSave: function () {
      if (!this._check()) {
        MessageBox.error(this.getText("fixErrors"));
        return;
      }
      MessageBox.confirm(this.getText("confirmCreate"), {
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) { this._create(); }
        }.bind(this)
      });
    },

    _create: function () {
      var oEmp = this._oForm.getProperty("/emp");
      var d = oEmp.joiningDate;

      // only fields the service knows (see $metadata). No ID: the server creates it
      var oPayload = {
        employeeId: oEmp.employeeId,
        firstName: oEmp.firstName.trim(),
        lastName: oEmp.lastName.trim(),
        email: oEmp.email.trim().toLowerCase(),
        phone: oEmp.phone.trim(),
        designation: oEmp.designation.trim(),
        location: oEmp.location.trim(),
        // the picked date is local midnight; send it as UTC midnight so the day does not shift
        joiningDate: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())),
        status: oEmp.status,
        department_ID: oEmp.department_ID
      };

      this.getView().setBusy(true);
      this.getOwnerComponent().getModel().create("/Employees", oPayload, {
        success: function () {
          this.getView().setBusy(false);
          MessageToast.show(this.getText("createSuccess", [oPayload.employeeId]));
          this.getRouter().navTo("DisplayEmployees");
        }.bind(this),
        error: function () {
          this.getView().setBusy(false);
          MessageBox.error(this.getText("createError"));
        }.bind(this)
      });
    }
  });
});