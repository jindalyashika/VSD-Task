
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "../model/EmployeeCheck"
], function (
    BaseController,
    JSONModel,
    MessageBox,
    MessageToast,
    EmployeeCheck
) {
    "use strict";

    // OData UTC date -> local DatePicker date
    function toLocal(d) {
        if (!d) {
            return null;
        }

        var oDate = d instanceof Date ? d : new Date(d);

        if (isNaN(oDate.getTime())) {
            return null;
        }

        return new Date(
            oDate.getUTCFullYear(),
            oDate.getUTCMonth(),
            oDate.getUTCDate()
        );
    }

    // Local DatePicker date -> OData UTC date
    function toUtc(d) {
        if (!d) {
            return null;
        }

        return new Date(Date.UTC(
            d.getFullYear(),
            d.getMonth(),
            d.getDate()
        ));
    }

    function safeString(value) {
        return value == null ? "" : String(value).trim();
    }

    return BaseController.extend(
        "project1.controller.UpdateEmployee",
        {

            onInit: function () {
                this._oForm = new JSONModel({
                    path: "",
                    emp: {},
                    state: {},
                    msg: {}
                });

                this.setModel(this._oForm, "form");
            },

            // Load dialog once
            _getDialog: function () {
                if (!this._pDialog) {
                    this._pDialog = this.loadFragment({
                        name: "project1.view.fragments.EditEmployeeDialog"
                    });
                }

                return this._pDialog;
            },

            // Open selected employee
            onRowPress: function (oEvent) {

                var oContext = oEvent.getSource().getBindingContext();

                if (!oContext) {
                    MessageBox.error(
                        "Unable to retrieve employee details."
                    );
                    return;
                }

                var oEmployee = oContext.getObject();
                var oBlank = EmployeeCheck.emptyStates();

                this._oForm.setData({

                    path: oContext.getPath(),

                    emp: {
                        employeeId: oEmployee.employeeId || "",

                        firstName: oEmployee.firstName || "",
                        lastName: oEmployee.lastName || "",

                        email: oEmployee.email || "",
                        phone: oEmployee.phone || "",

                        dob: toLocal(oEmployee.dob),

                        currentAddress:
                            oEmployee.currentAddress || "",

                        permanentAddress:
                            oEmployee.permanentAddress || "",

                        department_ID:
                            oEmployee.department_ID || "",

                        designation_ID:
                            oEmployee.designation_ID || "",

                        location: oEmployee.location || "",

                        joiningDate:
                            toLocal(oEmployee.joiningDate),

                        status: oEmployee.status || "Active"
                    },

                    state: oBlank.state,
                    msg: oBlank.msg
                });

                this._getDialog().then(function (oDialog) {
                    oDialog.open();
                }).catch(function (oError) {
                    console.error(oError);
                    MessageBox.error("Unable to open edit dialog.");
                });
            },

            // Common validation state reset
            onFieldEdit: function (oEvent, sField) {
                this._oForm.setProperty(
                    "/state/" + sField,
                    "None"
                );

                this._oForm.setProperty(
                    "/msg/" + sField,
                    ""
                );
            },

            // Individual field handlers
            onFirstNameChange: function (oEvent) {
                this.onFieldEdit(oEvent, "firstName");
            },

            onLastNameChange: function (oEvent) {
                this.onFieldEdit(oEvent, "lastName");
            },

            onEmailChange: function (oEvent) {
                this.onFieldEdit(oEvent, "email");
            },

            onPhoneChange: function (oEvent) {
                this.onFieldEdit(oEvent, "phone");
            },

            onCurrentAddressChange: function (oEvent) {
                this.onFieldEdit(oEvent, "currentAddress");
            },

            onPermanentAddressChange: function (oEvent) {
                this.onFieldEdit(oEvent, "permanentAddress");
            },

            onLocationChange: function (oEvent) {
                this.onFieldEdit(oEvent, "location");
            },

            onDepartmentChange: function (oEvent) {
                this.onFieldEdit(oEvent, "department_ID");
            },

            onDesignationChange: function (oEvent) {
                this.onFieldEdit(oEvent, "designation_ID");
            },

            onStatusChange: function (oEvent) {
                this.onFieldEdit(oEvent, "status");
            },

            // Date validation handler
            _handleDateChange: function (oEvent, sField) {

                var bValid = oEvent.getParameter("valid");

                if (bValid === false) {
                    this._oForm.setProperty(
                        "/emp/" + sField,
                        null
                    );

                    this._oForm.setProperty(
                        "/state/" + sField,
                        "Error"
                    );

                    this._oForm.setProperty(
                        "/msg/" + sField,
                        "Please enter a valid date."
                    );

                    return;
                }

                this.onFieldEdit(oEvent, sField);
            },

            onDobChange: function (oEvent) {
                this._handleDateChange(oEvent, "dob");
            },

            onJoiningDateChange: function (oEvent) {
                this._handleDateChange(oEvent, "joiningDate");
            },

            // Validate all employee fields
            onSaveEdit: function () {

                var oEmployee = this._oForm.getProperty("/emp");

                var oResult = EmployeeCheck.check(
                    oEmployee,
                    this.getBundle()
                );

                this._oForm.setProperty(
                    "/state",
                    oResult.state
                );

                this._oForm.setProperty(
                    "/msg",
                    oResult.msg
                );

                var aInvalidFields = Object.keys(
                    oResult.state
                ).filter(function (sField) {
                    return oResult.state[sField] === "Error";
                });

                console.log("========== EMPLOYEE VALIDATION ==========");
                console.log("Employee:", oEmployee);
                console.log("Valid:", oResult.valid);
                console.log("Invalid Fields:", aInvalidFields);
                console.log("Messages:", oResult.msg);
                console.log("=========================================");

                if (!oResult.valid) {

                    MessageBox.error(
                        "Please correct the following fields:\n\n" +
                        aInvalidFields.join(", ")
                    );

                    return;
                }

                MessageBox.confirm(
                    this.getText("confirmUpdate"),
                    {
                        onClose: function (sAction) {

                            if (
                                sAction === MessageBox.Action.OK
                            ) {
                                this._update();
                            }

                        }.bind(this)
                    }
                );
            },

            // Save employee through OData V2
            _update: function () {

                var oEmployee = this._oForm.getProperty("/emp");
                var sPath = this._oForm.getProperty("/path");

                var oModel = this.getOwnerComponent().getModel();

                // Revalidate before backend update
                var oResult = EmployeeCheck.check(
                    oEmployee,
                    this.getBundle()
                );

                this._oForm.setProperty("/state", oResult.state);
                this._oForm.setProperty("/msg", oResult.msg);

                if (!oResult.valid) {
                    MessageBox.error(
                        "Please correct all highlighted fields."
                    );
                    return;
                }

                if (!/^\/Employees\(guid'[^']+'\)$/.test(sPath || "")) {
                    MessageBox.error("Invalid employee update path.");
                    console.error("Invalid path:", sPath);
                    return;
                }

                var oPayload = {

                    firstName: safeString(oEmployee.firstName),
                    lastName: safeString(oEmployee.lastName),

                    email: safeString(oEmployee.email).toLowerCase(),
                    phone: safeString(oEmployee.phone),

                    dob: toUtc(oEmployee.dob),

                    currentAddress:
                        safeString(oEmployee.currentAddress),

                    permanentAddress:
                        safeString(oEmployee.permanentAddress),

                    department_ID: oEmployee.department_ID,
                    designation_ID: oEmployee.designation_ID,

                    location: safeString(oEmployee.location),

                    joiningDate: toUtc(oEmployee.joiningDate),

                    status: oEmployee.status
                };

                console.log("========== ODATA UPDATE ==========");
                console.log("Path:", sPath);
                console.log("Payload:", oPayload);
                console.log("==================================");

                oModel.update(sPath, oPayload, {

                    success: function () {

                        this.onCancelEdit();

                        MessageToast.show(
                            this.getText("updateSuccess", [
                                oEmployee.employeeId
                            ])
                        );

                        oModel.refresh(true);

                    }.bind(this),

                    error: function (oError) {

                        console.error("UPDATE FAILED");
                        console.error("Status:", oError.statusCode);
                        console.error("Response:", oError.responseText);

                        var sMessage = "";

                        try {
                            var oResponse = JSON.parse(
                                oError.responseText
                            );

                            sMessage =
                                oResponse.error.message.value ||
                                oResponse.error.message;

                        } catch (e) {
                            sMessage = oError.message || "";
                        }

                        MessageBox.error(
                            sMessage ||
                            "Employee update failed. HTTP Status: " +
                            oError.statusCode
                        );
                    }
                });
            },

            // Close dialog
            onCancelEdit: function () {
                this._getDialog().then(function (oDialog) {
                    oDialog.close();
                });
            }

        }
    );
});
