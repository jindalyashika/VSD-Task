
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"
], function (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox
) {
    "use strict";

    return BaseController.extend(
        "project1.controller.CreateLeaveRequest",
        {

            onInit: function () {

                var oEmployeeModel = new JSONModel({
                    list: [],
                    selectedEmployeeUUID: ""
                });

                this.getView().setModel(
                    oEmployeeModel,
                    "employees"
                );

                this._bSettingEmployee = false;

                this._loadEmployees();
            },

            // Load employees from OData service
            _loadEmployees: function () {

                var oODataModel =
                    this.getOwnerComponent().getModel();

                var oEmployeeModel =
                    this.getView().getModel("employees");

                if (!oODataModel) {
                    MessageBox.error("OData model not found.");
                    return;
                }

                oODataModel.read("/Employees", {

                    success: function (oData) {

                        var aEmployees = (oData.results || [])
                            .filter(function (oEmployee) {
                                return oEmployee.status === "Active";
                            })
                            .map(function (oEmployee) {

                                oEmployee.fullName =
                                    (
                                        oEmployee.firstName || ""
                                    ) + " " + (
                                        oEmployee.lastName || ""
                                    );

                                oEmployee.searchName =
                                    oEmployee.fullName.toLowerCase();

                                return oEmployee;
                            });

                        oEmployeeModel.setProperty(
                            "/list",
                            aEmployees
                        );
                    },

                    error: function (oError) {

                        console.error(
                            "Employee loading error:",
                            oError
                        );

                        MessageBox.error(
                            "Unable to load employees."
                        );
                    }
                });
            },

            // Employee name autocomplete
            onSuggestEmployeeName: function (oEvent) {

                var sValue = (
                    oEvent.getParameter("suggestValue") || ""
                ).toLowerCase();

                var oBinding = oEvent.getSource()
                    .getBinding("suggestionItems");

                var aFilters = [];

                if (sValue) {
                    aFilters.push(
                        new Filter(
                            "searchName",
                            FilterOperator.Contains,
                            sValue
                        )
                    );
                }

                oBinding.filter(aFilters);
            },

            // Employee ID autocomplete
            onSuggestEmployeeId: function (oEvent) {

                var sValue = (
                    oEvent.getParameter("suggestValue") || ""
                ).toLowerCase();

                var oBinding = oEvent.getSource()
                    .getBinding("suggestionItems");

                var aFilters = [];

                if (sValue) {
                    aFilters.push(
                        new Filter(
                            "employeeId",
                            FilterOperator.Contains,
                            sValue
                        )
                    );
                }

                oBinding.filter(aFilters);
            },

            // When employee name is selected
            onEmployeeNameSelected: function (oEvent) {

                var oItem =
                    oEvent.getParameter("selectedItem");

                if (!oItem) {
                    return;
                }

                this._setSelectedEmployee(oItem.getKey());
            },

            // When employee ID is selected
            onEmployeeIdSelected: function (oEvent) {

                var oItem =
                    oEvent.getParameter("selectedItem");

                if (!oItem) {
                    return;
                }

                this._setSelectedEmployee(oItem.getKey());
            },

            // Fill both fields using employee UUID
            _setSelectedEmployee: function (sUUID) {

                var oEmployeeModel =
                    this.getView().getModel("employees");

                var aEmployees =
                    oEmployeeModel.getProperty("/list") || [];

                var oEmployee = aEmployees.find(
                    function (oItem) {
                        return oItem.ID === sUUID;
                    }
                );

                if (!oEmployee) {
                    return;
                }

                this._bSettingEmployee = true;

                this.byId("employeeNameInput").setValue(
                    oEmployee.fullName
                );

                this.byId("employeeIdInput").setValue(
                    oEmployee.employeeId
                );

                oEmployeeModel.setProperty(
                    "/selectedEmployeeUUID",
                    oEmployee.ID
                );

                this._bSettingEmployee = false;
            },

            // Clear selected employee when name is manually edited
            onEmployeeNameLiveChange: function () {

                if (this._bSettingEmployee) {
                    return;
                }

                var oEmployeeModel =
                    this.getView().getModel("employees");

                oEmployeeModel.setProperty(
                    "/selectedEmployeeUUID",
                    ""
                );

                this.byId("employeeIdInput").setValue("");
            },

            // Clear selected employee when ID is manually edited
            onEmployeeIdLiveChange: function () {

                if (this._bSettingEmployee) {
                    return;
                }

                var oEmployeeModel =
                    this.getView().getModel("employees");

                oEmployeeModel.setProperty(
                    "/selectedEmployeeUUID",
                    ""
                );

                this.byId("employeeNameInput").setValue("");
            },

            // Submit leave request
            onSubmitLeaveRequest: function () {

                var oView = this.getView();

                var oEmployeeModel =
                    oView.getModel("employees");

                var sEmployeeUUID =
                    oEmployeeModel.getProperty(
                        "/selectedEmployeeUUID"
                    );

                var sLeaveType =
                    this.byId("leaveTypeSelect").getSelectedKey();

                var sStartDate =
                    this.byId("startDatePicker").getValue();

                var sEndDate =
                    this.byId("endDatePicker").getValue();

                var sReason =
                    this.byId("reasonInput").getValue().trim();

                // Validate employee
                if (!sEmployeeUUID) {

                    MessageBox.warning(
                        "Please select a valid employee from the suggestions."
                    );

                    return;
                }

                // Validate required fields
                if (
                    !sLeaveType ||
                    !sStartDate ||
                    !sEndDate ||
                    !sReason
                ) {

                    MessageBox.warning(
                        "Please fill in all required fields."
                    );

                    return;
                }

                // Convert dates
                var oStartDate =
                    this._convertToDate(sStartDate);

                var oEndDate =
                    this._convertToDate(sEndDate);

                if (!oStartDate || !oEndDate) {

                    MessageBox.error(
                        "Please enter valid dates."
                    );

                    return;
                }

                // Validate date range
                if (oEndDate < oStartDate) {

                    MessageBox.warning(
                        "End date cannot be before start date."
                    );

                    return;
                }

                // OData payload
                var oPayload = {

                    employee_ID: sEmployeeUUID,

                    leaveType: sLeaveType,

                    startDate: oStartDate,

                    endDate: oEndDate,

                    reason: sReason,

                    status: "Pending"
                };

                var oODataModel =
                    this.getOwnerComponent().getModel();

                oODataModel.create(
                    "/LeaveRequests",
                    oPayload,
                    {

                        success: function () {

                            MessageBox.success(
                                "Leave request submitted successfully!"
                            );

                            this.onClear();

                        }.bind(this),

                        error: function (oError) {

                            console.error(
                                "Leave request error:",
                                oError
                            );

                            MessageBox.error(
                                "Unable to submit leave request. Please check the employee and form details."
                            );
                        }
                    }
                );
            },

            // Convert yyyy-MM-dd into JavaScript Date
            _convertToDate: function (sDate) {

                var aParts = sDate.split("-");

                if (aParts.length !== 3) {
                    return null;
                }

                var oDate = new Date(
                    Number(aParts[0]),
                    Number(aParts[1]) - 1,
                    Number(aParts[2])
                );

                if (
                    isNaN(oDate.getTime()) ||
                    oDate.getFullYear() !== Number(aParts[0]) ||
                    oDate.getMonth() !== Number(aParts[1]) - 1 ||
                    oDate.getDate() !== Number(aParts[2])
                ) {
                    return null;
                }

                return oDate;
            },

            // Clear form
            onClear: function () {

                this._bSettingEmployee = true;

                this.byId("employeeNameInput").setValue("");

                this.byId("employeeIdInput").setValue("");

                this.byId("leaveTypeSelect").setSelectedKey("");

                this.byId("startDatePicker").setValue("");

                this.byId("endDatePicker").setValue("");

                this.byId("reasonInput").setValue("");

                this._bSettingEmployee = false;

                this.getView()
                    .getModel("employees")
                    .setProperty(
                        "/selectedEmployeeUUID",
                        ""
                    );
            },

            // Navigate back
            onNavBack: function () {

                this.getRouter().navTo("Home");
            }

        }
    );
});