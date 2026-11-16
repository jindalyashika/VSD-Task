sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, Sorter, DateFormat, MessageBox) {
    "use strict";

    // Entity sets of your OData service
    var EMPLOYEES = "/Employees";
    var LEAVES = "/LeaveRequests";

    // Column layout per route
    var LAYOUT = {
        MyInbox: "OneColumn",
        InboxLeaves: "TwoColumnsMidExpanded",
        InboxLeaveDetail: "ThreeColumnsMidExpanded"
    };

    // status -> [ObjectStatus state, icon]
    var STATUS = {
        approved: ["Success", "sap-icon://accept"],
        rejected: ["Error", "sap-icon://decline"],
        pending: ["Warning", "sap-icon://pending"]
    };

    var oDateFormat = DateFormat.getDateInstance({ pattern: "dd MMM yyyy" });

    /* ---------- helpers: add display-only fields to OData entries ---------- */

    function personName(o) {
        o = o || {};
        return o.employeeName || o.fullName || o.name ||
            [o.firstName, o.lastName].filter(Boolean).join(" ") || "Employee";
    }

    function toDate(v) {
        if (v instanceof Date) {
            return v;
        }
        var aMatch = /\d{10,}/.exec(String(v)); // /Date(1700000000000)/
        return aMatch ? new Date(Number(aMatch[0])) : null;
    }

    function enrichEmployee(o) {
        o.employeeName = personName(o);
        o.initials = o.employeeName.split(" ").slice(0, 2).map(function (s) {
            return s.charAt(0).toUpperCase();
        }).join("");
        o.subtitle = o.email || "";
        return o;
    }

    function enrichLeave(o) {
        var oStart = toDate(o.startDate);
        var oEnd = toDate(o.endDate);
        var aStatus = STATUS[(o.status || "").toLowerCase()] || ["None", ""];
        var iDays = oStart && oEnd ? Math.round((oEnd - oStart) / 86400000) + 1 : 0;

        o.employeeName = personName(o.employee);
        o.startDateFormatted = oStart ? oDateFormat.format(oStart) : "-";
        o.endDateFormatted = oEnd ? oDateFormat.format(oEnd) : "-";
        o.durationText = iDays > 0 ? iDays + (iDays === 1 ? " day" : " days") : "-";
        o.statusState = aStatus[0];
        o.statusIcon = aStatus[1];
        o.reasonText = o.reason || "-";
        o.approverText = o.approver || "-";
        o.commentsText = o.comments || "-";
        return o;
    }

    function countByStatus(aLeaves) {
        var oCounts = { all: aLeaves.length, pending: 0, approved: 0, rejected: 0 };
        aLeaves.forEach(function (o) {
            var sKey = (o.status || "").toLowerCase();
            if (sKey in oCounts) {
                oCounts[sKey]++;
            }
        });
        return oCounts;
    }

    /* ---------- controller ---------- */

    return Controller.extend("project1.controller.MyInbox", {

        onInit: function () {
            this._oInbox = new JSONModel({
                employees: [],
                employeeCount: 0,
                leaves: [],
                counts: countByStatus([]),
                selectedEmployee: null,
                selectedLeave: null,
                busy: { employees: false, leaves: false }
            });
            this._oInbox.setSizeLimit(1000);
            this.getView().setModel(this._oInbox, "inbox");

            this._sEmployeeId = null;
            this._sLeaveId = null;
            this._sStatus = "All";
            this._sSearch = "";

            // Same view for all three routes; only the layout and selection change
            var oRouter = this.getOwnerComponent().getRouter();
            Object.keys(LAYOUT).forEach(function (sRoute) {
                oRouter.getRoute(sRoute).attachPatternMatched(function (oEvent) {
                    this._onRouteMatched(sRoute, oEvent.getParameter("arguments") || {});
                }, this);
            }, this);

            this._loadEmployees();
        },

        _onRouteMatched: function (sRoute, mArgs) {
            this.byId("fcl").setLayout(LAYOUT[sRoute]);
            this._sLeaveId = mArgs.leaveId || null;

            // A different employee was picked: reset filters and load their leaves
            if ((mArgs.employeeId || null) !== this._sEmployeeId) {
                this._sEmployeeId = mArgs.employeeId || null;
                this._sStatus = "All";
                this._sSearch = "";
                this.byId("statusFilter").setSelectedKey("All");
                this.byId("leaveSearch").setValue("");
                this._loadLeaves();
            }

            this._syncSelection();
        },

        /* ---------- data ---------- */

        _loadEmployees: function () {
            var oInbox = this._oInbox;

            oInbox.setProperty("/busy/employees", true);

            this.getOwnerComponent().getModel().read(EMPLOYEES, {
                success: function (oData) {
                    var aEmployees = oData.results.map(enrichEmployee).sort(function (a, b) {
                        return a.employeeName.localeCompare(b.employeeName);
                    });

                    oInbox.setProperty("/employees", aEmployees);
                    oInbox.setProperty("/employeeCount", aEmployees.length);
                    oInbox.setProperty("/busy/employees", false);
                    this._syncSelection();
                }.bind(this),

                error: function () {
                    oInbox.setProperty("/busy/employees", false);
                    MessageBox.error("Unable to load employees. Please try again.");
                }
            });
        },

        _loadLeaves: function () {
            var oInbox = this._oInbox;

            oInbox.setProperty("/leaves", []);
            oInbox.setProperty("/counts", countByStatus([]));

            if (!this._sEmployeeId) {
                return;
            }

            oInbox.setProperty("/busy/leaves", true);

            this.getOwnerComponent().getModel().read(LEAVES, {
                filters: [new Filter("employee_ID", FilterOperator.EQ, this._sEmployeeId)],
                sorters: [new Sorter("startDate", true)],
                urlParameters: { "$expand": "employee" },

                success: function (oData) {
                    var aLeaves = oData.results.map(enrichLeave);

                    oInbox.setProperty("/leaves", aLeaves);
                    oInbox.setProperty("/counts", countByStatus(aLeaves));
                    oInbox.setProperty("/busy/leaves", false);
                    this._filterLeaves();
                    this._syncSelection();
                }.bind(this),

                error: function () {
                    oInbox.setProperty("/busy/leaves", false);
                    MessageBox.error("Unable to load leave requests. Please try again.");
                }
            });
        },

        /* ---------- events ---------- */

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("Home");
        },

        onRefreshEmployees: function () {
            this._loadEmployees();
        },

        onRefreshLeaves: function () {
            this._loadLeaves();
        },

        onEmployeeSearch: function (oEvent) {
            var sQuery = oEvent.getSource().getValue().trim();
            var aFilters = sQuery ? [new Filter({
                filters: [
                    new Filter("employeeName", FilterOperator.Contains, sQuery),
                    new Filter("subtitle", FilterOperator.Contains, sQuery)
                ],
                and: false
            })] : [];

            this.byId("employeeList").getBinding("items").filter(aFilters);
        },

        onLeaveSearch: function (oEvent) {
            this._sSearch = oEvent.getSource().getValue().trim();
            this._filterLeaves();
        },

        onStatusFilter: function (oEvent) {
            this._sStatus = oEvent.getSource().getSelectedKey();
            this._filterLeaves();
        },

        onEmployeeSelect: function (oEvent) {
            var oEmployee = oEvent.getParameter("listItem").getBindingContext("inbox").getObject();

            this.getOwnerComponent().getRouter().navTo("InboxLeaves", { employeeId: oEmployee.ID });
        },

        onLeaveSelect: function (oEvent) {
            var oLeave = oEvent.getParameter("listItem").getBindingContext("inbox").getObject();

            this.getOwnerComponent().getRouter().navTo("InboxLeaveDetail", {
                employeeId: this._sEmployeeId,
                leaveId: oLeave.ID
            });
        },

        onCloseLeaves: function () {
            this.getOwnerComponent().getRouter().navTo("MyInbox");
        },

        onCloseDetail: function () {
            this.getOwnerComponent().getRouter().navTo("InboxLeaves", { employeeId: this._sEmployeeId });
        },

        // Lists re-render after filtering/growing, so re-apply the highlight
        onEmployeeListUpdateFinished: function () {
            this._syncSelection();
        },

        onLeaveListUpdateFinished: function () {
            this._syncSelection();
        },

        /* ---------- helpers ---------- */

        _filterLeaves: function () {
            var sStatus = this._sStatus;
            var sSearch = this._sSearch;
            var aFilters = [];

            if (sStatus !== "All") {
                aFilters.push(new Filter({
                    path: "status",
                    test: function (sValue) {
                        return (sValue || "").toLowerCase() === sStatus.toLowerCase();
                    }
                }));
            }

            if (sSearch) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("leaveType", FilterOperator.Contains, sSearch),
                        new Filter("reason", FilterOperator.Contains, sSearch)
                    ],
                    and: false
                }));
            }

            this.byId("leaveList").getBinding("items").filter(aFilters);
        },

        // Set the selected employee/leave from the URL and highlight them in the lists
        _syncSelection: function () {
            var sEmployeeId = this._sEmployeeId;
            var sLeaveId = this._sLeaveId;
            var oInbox = this._oInbox;

            oInbox.setProperty("/selectedEmployee", oInbox.getProperty("/employees")
                .find(function (o) { return o.ID === sEmployeeId; }) || null);
            oInbox.setProperty("/selectedLeave", oInbox.getProperty("/leaves")
                .find(function (o) { return o.ID === sLeaveId; }) || null);

            [[this.byId("employeeList"), sEmployeeId], [this.byId("leaveList"), sLeaveId]]
                .forEach(function (a) {
                    var oList = a[0];
                    var oItem = a[1] && oList.getItems().find(function (oListItem) {
                        var oContext = oListItem.getBindingContext("inbox");
                        return oContext && oContext.getObject().ID === a[1];
                    });

                    if (oItem) {
                        oList.setSelectedItem(oItem, true);
                    } else {
                        oList.removeSelections(true);
                    }
                });
        }
    });
});