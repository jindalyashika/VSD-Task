
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageBox, MessageToast) {
    "use strict";

    // Fields that can display validation errors
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
        "joiningDate"
    ];

    // Convert local date to UTC midnight
    function toUtc(d) {
        return d ? new Date(Date.UTC(
            d.getFullYear(),
            d.getMonth(),
            d.getDate()
        )) : null;
    }

    return BaseController.extend("project1.controller.CreateEmployee", {

        // ==========================================
        // INITIALIZATION
        // ==========================================

        onInit: function () {
            this._oForm = new JSONModel();
            this.setModel(this._oForm, "form");

            this._oSelectedImage = null;

            this.getRouter()
                .getRoute("CreateEmployee")
                .attachPatternMatched(this._onMatched, this);
        },

        _onMatched: function () {
            this._resetForm();
            this._loadNextId();
        },

        // ==========================================
        // RESET FORM
        // ==========================================

        _resetForm: function () {
            var oState = {};
            var oMsg = {};

            FIELDS.forEach(function (f) {
                oState[f] = "None";
                oMsg[f] = "";
            });

            this._oForm.setData({
                emp: {
                    employeeId: "",
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    dob: null,
                    currentAddress: "",
                    permanentAddress: "",
                    designation_ID: "",
                    location: "",
                    joiningDate: null,
                    status: "Active",
                    department_ID: "",
                    imagePreview: ""
                },
                state: oState,
                msg: oMsg
            });

            this._oSelectedImage = null;

            var oUploader = this.byId("employeeImageUploader");

            if (oUploader) {
                oUploader.clear();
            }
        },

        onReset: function () {
            this._resetForm();
            this._loadNextId();
        },

        // ==========================================
        // GENERATE EMPLOYEE ID
        // ==========================================

        _loadNextId: function () {
            this.getOwnerComponent().getModel().read("/Employees", {

                urlParameters: {
                    "$select": "employeeId"
                },

                success: function (oData) {
                    var iMax = 0;

                    (oData.results || []).forEach(function (e) {
                        var n = parseInt(
                            String(e.employeeId || "").replace(/\D/g, ""),
                            10
                        ) || 0;

                        if (n > iMax) {
                            iMax = n;
                        }
                    });

                    this._oForm.setProperty(
                        "/emp/employeeId",
                        "EMP" + String(iMax + 1).padStart(3, "0")
                    );

                }.bind(this),

                error: function () {
                    MessageBox.error(this.getText("loadError"));
                }.bind(this)

            });
        },

        // ==========================================
        // IMAGE SELECTION AND PREVIEW
        // ==========================================

        onImageChange: function (oEvent) {
            var aFiles = oEvent.getParameter("files");
            var oFile = aFiles && aFiles[0];

            if (!oFile) {
                return;
            }

            var aAllowedTypes = [
                "image/jpeg",
                "image/png"
            ];

            // Validate image format
            if (aAllowedTypes.indexOf(oFile.type) === -1) {
                this._oSelectedImage = null;

                this._oForm.setProperty(
                    "/emp/imagePreview",
                    ""
                );

                oEvent.getSource().clear();

                MessageBox.error(
                    "Please select a JPG, JPEG or PNG image."
                );

                return;
            }

            // Validate image size (5 MB)
            if (oFile.size > 5 * 1024 * 1024) {
                this._oSelectedImage = null;

                this._oForm.setProperty(
                    "/emp/imagePreview",
                    ""
                );

                oEvent.getSource().clear();

                MessageBox.error(
                    "Image size must not exceed 5 MB."
                );

                return;
            }

            this._oSelectedImage = oFile;

            // Generate image preview
            var oReader = new FileReader();

            oReader.onload = function (oResult) {
                this._oForm.setProperty(
                    "/emp/imagePreview",
                    oResult.target.result
                );
            }.bind(this);

            oReader.onerror = function () {
                MessageBox.error("Unable to read the selected image.");
            };

            oReader.readAsDataURL(oFile);
        },

        // ==========================================
        // FIELD VALIDATION STATE
        // ==========================================

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

        // ==========================================
        // FORM VALIDATION
        // ==========================================

        _check: function () {
            var oEmp = this._oForm.getProperty("/emp");

            var oState = {};
            var oMsg = {};

            var bOk = true;
            var that = this;

            FIELDS.forEach(function (f) {
                oState[f] = "None";
                oMsg[f] = "";
            });

            function bad(sField, sKey) {
                oState[sField] = "Error";
                oMsg[sField] = that.getText(sKey);
                bOk = false;
            }

            // First Name
            if (!oEmp.firstName.trim()) {
                bad("firstName", "errRequired");
            } else if (
                !/^[A-Za-z][A-Za-z .'-]{0,29}$/.test(
                    oEmp.firstName.trim()
                )
            ) {
                bad("firstName", "errName");
            }

            // Last Name
            if (!oEmp.lastName.trim()) {
                bad("lastName", "errRequired");
            } else if (
                !/^[A-Za-z][A-Za-z .'-]{0,29}$/.test(
                    oEmp.lastName.trim()
                )
            ) {
                bad("lastName", "errName");
            }

            // Email
            if (!oEmp.email.trim()) {
                bad("email", "errRequired");
            } else if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    oEmp.email.trim()
                )
            ) {
                bad("email", "errEmail");
            }

            // Phone
            if (!oEmp.phone.trim()) {
                bad("phone", "errRequired");
            } else if (
                !/^[0-9+\- ]{10,15}$/.test(
                    oEmp.phone.trim()
                )
            ) {
                bad("phone", "errPhone");
            }

            // Date of Birth
            if (!oEmp.dob) {
                bad("dob", "errRequired");
            } else if (oEmp.dob > new Date()) {
                bad("dob", "errFutureDate");
            }

            // Addresses
            if (!oEmp.currentAddress.trim()) {
                bad("currentAddress", "errRequired");
            }

            if (!oEmp.permanentAddress.trim()) {
                bad("permanentAddress", "errRequired");
            }

            // Department
            if (!oEmp.department_ID) {
                bad("department_ID", "errRequired");
            }

            // Designation
            if (!oEmp.designation_ID) {
                bad("designation_ID", "errRequired");
            }

            // Joining Date
            if (!oEmp.joiningDate) {
                bad("joiningDate", "errRequired");
            }

            this._oForm.setProperty("/state", oState);
            this._oForm.setProperty("/msg", oMsg);

            return bOk;
        },

        // ==========================================
        // SAVE CONFIRMATION
        // ==========================================

        onSave: function () {
            if (!this._check()) {
                MessageBox.error(this.getText("fixErrors"));
                return;
            }

            MessageBox.confirm(
                this.getText("confirmCreate"),
                {
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            this._create();
                        }
                    }.bind(this)
                }
            );
        },

        // ==========================================
        // CREATE EMPLOYEE USING ODATA
        // ==========================================

        _create: function () {
            var oEmp = this._oForm.getProperty("/emp");

            var oPayload = {
                employeeId: oEmp.employeeId,
                firstName: oEmp.firstName.trim(),
                lastName: oEmp.lastName.trim(),
                email: oEmp.email.trim().toLowerCase(),
                phone: oEmp.phone.trim(),

                dob: toUtc(oEmp.dob),

                currentAddress: oEmp.currentAddress.trim(),
                permanentAddress: oEmp.permanentAddress.trim(),

                designation_ID: oEmp.designation_ID,
                department_ID: oEmp.department_ID,

                location: oEmp.location.trim(),
                joiningDate: toUtc(oEmp.joiningDate),

                status: oEmp.status
            };

            var oModel = this.getOwnerComponent().getModel();

            this.getView().setBusy(true);

            oModel.create("/Employees", oPayload, {

                success: function (oData) {

                    // Upload image if selected
                    if (this._oSelectedImage) {

                        this._uploadEmployeeImage(
                            oData.imgUrl
                        );

                    } else {

                        this.getView().setBusy(false);

                        this._finishCreate();
                    }

                }.bind(this),

                error: function (oError) {

                    this.getView().setBusy(false);

                    var sMsg = "";

                    try {
                        var oResponse = JSON.parse(
                            oError.responseText
                        );

                        sMsg =
                            oResponse.error.message.value ||
                            oResponse.error.message;

                    } catch (e) {
                        // Use default error message
                    }

                    MessageBox.error(
                        sMsg || this.getText("createError")
                    );

                }.bind(this)

            });
        },

        // ==========================================
        // UPLOAD EMPLOYEE IMAGE
        // ==========================================

        _uploadEmployeeImage: function (sImageUrl) {
            var oModel = this.getOwnerComponent().getModel();

            if (!sImageUrl) {
                this.getView().setBusy(false);

                MessageBox.warning(
                    "Employee created, but the backend did not return an image URL."
                );

                this._finishCreate();
                return;
            }

            // Refresh CSRF token before binary upload
            oModel.refreshSecurityToken(

                function () {
                    this._sendImageUpload(sImageUrl);
                }.bind(this),

                function () {
                    this.getView().setBusy(false);

                    MessageBox.warning(
                        "Employee created, but CSRF token retrieval failed. Image was not uploaded."
                    );

                    this._finishCreate();
                }.bind(this),

                true
            );
        },

        // ==========================================
        // SEND IMAGE TO BACKEND
        // ==========================================

        _sendImageUpload: function (sImageUrl) {
            var oFile = this._oSelectedImage;
            var oModel = this.getOwnerComponent().getModel();

            if (!oFile) {
                this.getView().setBusy(false);
                this._finishCreate();
                return;
            }

            var sUrl;

            try {
                sUrl = new URL(
                    sImageUrl,
                    window.location.origin
                ).toString();

            } catch (e) {
                this.getView().setBusy(false);

                MessageBox.error(
                    "Invalid employee image URL."
                );

                this._finishCreate();
                return;
            }

            var sToken = oModel.getSecurityToken();

            if (!sToken) {
                this.getView().setBusy(false);

                MessageBox.warning(
                    "Employee created, but the CSRF token is unavailable."
                );

                this._finishCreate();
                return;
            }

            // Upload raw image binary
            var oXHR = new XMLHttpRequest();

            oXHR.open("PUT", sUrl, true);

            oXHR.setRequestHeader(
                "x-csrf-token",
                sToken
            );

            oXHR.setRequestHeader(
                "Content-Type",
                oFile.type || "application/octet-stream"
            );

            oXHR.onload = function () {

                this.getView().setBusy(false);

                if (oXHR.status >= 200 && oXHR.status < 300) {

                    this._finishCreate();

                } else {

                    MessageBox.warning(
                        "Employee created successfully, but image upload failed. HTTP Status: " +
                        oXHR.status
                    );

                    this._finishCreate();
                }

            }.bind(this);

            oXHR.onerror = function () {

                this.getView().setBusy(false);

                MessageBox.warning(
                    "Employee created, but image upload failed due to a network error."
                );

                this._finishCreate();

            }.bind(this);

            oXHR.send(oFile);
        },

        // ==========================================
        // FINAL SUCCESS
        // ==========================================

        _finishCreate: function () {
            MessageToast.show(
                this.getText("createSuccess", [
                    this._oForm.getProperty("/emp/employeeId")
                ])
            );

            this.getRouter().navTo("DisplayEmployees");
        }

    });
});