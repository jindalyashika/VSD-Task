sap.ui.define([], function () {
  "use strict";

  return {
    fullName: function (sFirst, sLast) {
      return [sFirst, sLast].filter(Boolean).join(" ");
    },
    deptName: function (sId, aDepts) {
      var o = (aDepts || []).find(function (d) { return d.DepartmentID === sId; });
      return o ? o.DepartmentName : sId;
    },
    statusState: function (sStatus) {
      switch (sStatus) {
        case "Active": return "Success";
        case "On Leave": return "Warning";
        case "Inactive": return "Error";
        default: return "None";
      }
    },
    employmentType: function (bPermanent) {
      return bPermanent ? "Permanent" : "Contract";
    },
    salary: function (n) {
      return (n === null || n === undefined || n === "") ? "" : Number(n).toLocaleString("en-IN");
    }
  };
});