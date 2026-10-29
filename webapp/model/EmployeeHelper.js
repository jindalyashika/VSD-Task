sap.ui.define([], function () {
  "use strict";

  var FIELDS = ["FirstName", "LastName", "Email", "Phone", "DepartmentID", "JobRole", "JoiningDate", "Salary"];
  var NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,29}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[6-9]\d{9}$/;

  function txt(v) { return String(v === null || v === undefined ? "" : v).trim(); }

  return {
    emptyEmployee: function (sId) {
      return {
        EmployeeID: sId, FirstName: "", LastName: "", Email: "", Phone: "",
        DepartmentID: "", JobRole: "", JoiningDate: "", Salary: "",
        Status: "Active", IsPermanent: true
      };
    },

    emptyStates: function () {
      var o = { state: {}, msg: {} };
      FIELDS.forEach(function (f) { o.state[f] = "None"; o.msg[f] = ""; });
      return o;
    },

    nextId: function (aEmp) {
      var iMax = aEmp.reduce(function (m, e) {
        return Math.max(m, parseInt(String(e.EmployeeID).replace(/\D/g, ""), 10) || 0);
      }, 0);
      return "EMP" + String(iMax + 1).padStart(3, "0");
    },

    normalize: function (o) {
      return {
        EmployeeID: o.EmployeeID,
        FirstName: txt(o.FirstName),
        LastName: txt(o.LastName),
        Email: txt(o.Email).toLowerCase(),
        Phone: txt(o.Phone),
        DepartmentID: o.DepartmentID,
        JobRole: txt(o.JobRole),
        JoiningDate: o.JoiningDate,
        Salary: Number(o.Salary),
        Status: o.Status,
        IsPermanent: !!o.IsPermanent
      };
    },

    validate: function (o, aAll, oRB) {
      var oRes = this.emptyStates();
      var bValid = true;

      function fail(sField, sKey) {
        oRes.state[sField] = "Error";
        oRes.msg[sField] = oRB.getText(sKey);
        bValid = false;
      }

      var sFirst = txt(o.FirstName);
      if (!sFirst) { fail("FirstName", "errRequired"); }
      else if (!NAME_RE.test(sFirst)) { fail("FirstName", "errName"); }

      var sLast = txt(o.LastName);
      if (!sLast) { fail("LastName", "errRequired"); }
      else if (!NAME_RE.test(sLast)) { fail("LastName", "errName"); }

      var sEmail = txt(o.Email);
      if (!sEmail) { fail("Email", "errRequired"); }
      else if (!EMAIL_RE.test(sEmail)) { fail("Email", "errEmail"); }
      else if (aAll.some(function (e) {
        return e.EmployeeID !== o.EmployeeID && txt(e.Email).toLowerCase() === sEmail.toLowerCase();
      })) { fail("Email", "errEmailUnique"); }

      var sPhone = txt(o.Phone);
      if (!sPhone) { fail("Phone", "errRequired"); }
      else if (!PHONE_RE.test(sPhone)) { fail("Phone", "errPhone"); }

      if (!txt(o.DepartmentID)) { fail("DepartmentID", "errRequired"); }

      if (!txt(o.JobRole)) { fail("JobRole", "errRequired"); }

      if (!txt(o.JoiningDate)) { fail("JoiningDate", "errRequired"); }

      var sSalary = txt(o.Salary);
      if (!sSalary) { fail("Salary", "errRequired"); }
      else if (isNaN(Number(sSalary)) || Number(sSalary) <= 0 || Number(sSalary) > 10000000) {
        fail("Salary", "errSalary");
      }

      return { valid: bValid, state: oRes.state, msg: oRes.msg };
    }
  };
});