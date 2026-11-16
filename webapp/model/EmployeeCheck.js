
sap.ui.define([], function () {
    "use strict";

    var FIELDS = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "dob",
        "currentAddress",
        "permanentAddress",
        "department_ID",
        "designation_ID",
        "location",
        "joiningDate",
        "status"
    ];

    // Allow international letters, spaces, apostrophes,
    // periods and hyphens in names.
    var NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,99}$/u;

    // Email validation
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Matches OData metadata phone pattern
    var PHONE = /^[0-9+\- ]{10,15}$/;

    // GUID validation
    var GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    function trim(value) {
        return String(value == null ? "" : value).trim();
    }

    function isValidDate(value) {
        return value instanceof Date &&
            !isNaN(value.getTime());
    }

    function dateOnly(value) {
        return new Date(
            value.getFullYear(),
            value.getMonth(),
            value.getDate()
        );
    }

    return {

        emptyStates: function () {
            var oResult = {
                state: {},
                msg: {}
            };

            FIELDS.forEach(function (sField) {
                oResult.state[sField] = "None";
                oResult.msg[sField] = "";
            });

            return oResult;
        },

        check: function (oEmp, oBundle) {

            var oResult = this.emptyStates();
            var bValid = true;

            function getText(sKey, sFallback) {
                if (oBundle && typeof oBundle.getText === "function") {
                    try {
                        return oBundle.getText(sKey);
                    } catch (e) {
                        return sFallback;
                    }
                }

                return sFallback;
            }

            function invalid(sField, sKey, sFallback) {
                oResult.state[sField] = "Error";
                oResult.msg[sField] = getText(sKey, sFallback);
                bValid = false;
            }

            // --------------------------------
            // FIRST NAME
            // --------------------------------

            var sFirstName = trim(oEmp.firstName);

            if (!sFirstName) {
                invalid(
                    "firstName",
                    "errRequired",
                    "First name is required."
                );
            } else if (sFirstName.length > 100 || !NAME.test(sFirstName)) {
                invalid(
                    "firstName",
                    "errName",
                    "Enter a valid first name (maximum 100 characters)."
                );
            }

            // --------------------------------
            // LAST NAME
            // --------------------------------

            var sLastName = trim(oEmp.lastName);

            if (!sLastName) {
                invalid(
                    "lastName",
                    "errRequired",
                    "Last name is required."
                );
            } else if (sLastName.length > 100 || !NAME.test(sLastName)) {
                invalid(
                    "lastName",
                    "errName",
                    "Enter a valid last name (maximum 100 characters)."
                );
            }

            // --------------------------------
            // EMAIL
            // --------------------------------

            var sEmail = trim(oEmp.email);

            if (!sEmail) {
                invalid(
                    "email",
                    "errRequired",
                    "Email is required."
                );
            } else if (
                sEmail.length > 150 ||
                !EMAIL.test(sEmail)
            ) {
                invalid(
                    "email",
                    "errEmail",
                    "Enter a valid email address (maximum 150 characters)."
                );
            }

            // --------------------------------
            // PHONE
            // --------------------------------

            var sPhone = trim(oEmp.phone);

            if (!sPhone) {
                invalid(
                    "phone",
                    "errRequired",
                    "Phone number is required."
                );
            } else if (!PHONE.test(sPhone)) {
                invalid(
                    "phone",
                    "errPhone",
                    "Phone must contain 10–15 characters using digits, +, spaces or hyphens."
                );
            }

            // --------------------------------
            // DATE OF BIRTH
            // --------------------------------

            if (!isValidDate(oEmp.dob)) {
                invalid(
                    "dob",
                    "errRequired",
                    "Please enter a valid date of birth."
                );
            } else if (
                dateOnly(oEmp.dob) > dateOnly(new Date())
            ) {
                invalid(
                    "dob",
                    "errFutureDate",
                    "Date of birth cannot be in the future."
                );
            }

            // --------------------------------
            // CURRENT ADDRESS
            // --------------------------------

            var sCurrentAddress = trim(oEmp.currentAddress);

            if (!sCurrentAddress) {
                invalid(
                    "currentAddress",
                    "errRequired",
                    "Current address is required."
                );
            } else if (sCurrentAddress.length > 500) {
                invalid(
                    "currentAddress",
                    "errMaxLength",
                    "Current address cannot exceed 500 characters."
                );
            }

            // --------------------------------
            // PERMANENT ADDRESS
            // --------------------------------

            var sPermanentAddress = trim(oEmp.permanentAddress);

            if (!sPermanentAddress) {
                invalid(
                    "permanentAddress",
                    "errRequired",
                    "Permanent address is required."
                );
            } else if (sPermanentAddress.length > 500) {
                invalid(
                    "permanentAddress",
                    "errMaxLength",
                    "Permanent address cannot exceed 500 characters."
                );
            }

            // --------------------------------
            // DEPARTMENT
            // --------------------------------

            var sDepartment = trim(oEmp.department_ID);

            if (!sDepartment) {
                invalid(
                    "department_ID",
                    "errRequired",
                    "Please select a department."
                );
            } else if (!GUID.test(sDepartment)) {
                invalid(
                    "department_ID",
                    "errDepartment",
                    "Please select a valid department."
                );
            }

            // --------------------------------
            // DESIGNATION
            // --------------------------------

            var sDesignation = trim(oEmp.designation_ID);

            if (!sDesignation) {
                invalid(
                    "designation_ID",
                    "errRequired",
                    "Please select a designation."
                );
            } else if (!GUID.test(sDesignation)) {
                invalid(
                    "designation_ID",
                    "errDesignation",
                    "Please select a valid designation."
                );
            }

            // --------------------------------
            // LOCATION (OPTIONAL)
            // --------------------------------

            var sLocation = trim(oEmp.location);

            if (sLocation.length > 100) {
                invalid(
                    "location",
                    "errMaxLength",
                    "Location cannot exceed 100 characters."
                );
            }

            // --------------------------------
            // JOINING DATE
            // --------------------------------

            if (!isValidDate(oEmp.joiningDate)) {
                invalid(
                    "joiningDate",
                    "errRequired",
                    "Please enter a valid joining date."
                );
            } else if (
                isValidDate(oEmp.dob) &&
                dateOnly(oEmp.joiningDate) < dateOnly(oEmp.dob)
            ) {
                invalid(
                    "joiningDate",
                    "errJoiningDate",
                    "Joining date cannot be earlier than date of birth."
                );
            }

            // --------------------------------
            // EMPLOYEE STATUS
            // --------------------------------

            if (
                oEmp.status !== "Active" &&
                oEmp.status !== "Inactive"
            ) {
                invalid(
                    "status",
                    "errStatus",
                    "Please select a valid employee status."
                );
            }

            return {
                valid: bValid,
                state: oResult.state,
                msg: oResult.msg
            };
        }
    };
});
