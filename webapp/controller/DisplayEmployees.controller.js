
sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("project1.controller.DisplayEmployees", {

        // =====================================
        // SEARCH EMPLOYEES
        // =====================================

        onSearch: function (oEvent) {
            var sQuery = (
                oEvent.getSource().getValue() || ""
            ).trim();

            var aFilters = [];

            if (sQuery) {

                var aFields = [
                    "employeeId",
                    "firstName",
                    "lastName",
                    "email",
                    "location"
                ];

                aFilters.push(new Filter({
                    filters: aFields.map(function (sField) {
                        return new Filter(
                            sField,
                            FilterOperator.Contains,
                            sQuery
                        );
                    }),
                    and: false
                }));
            }

            var oTable = this.byId("empTable8");
            var oBinding = oTable.getBinding("items");

            oBinding.filter(aFilters);
        },

        // =====================================
        // EMPLOYEE IMAGE URL FORMATTER
        // =====================================

        formatImageUrl: function (sImageUrl) {

            if (!sImageUrl) {
                return "";
            }

            try {
                var oModel = this.getOwnerComponent().getModel();

                var sServiceUrl = oModel.getServiceUrl();

                var sBaseOrigin = new URL(
                    sServiceUrl,
                    window.location.href
                ).origin;

                // Handles both relative and absolute image URLs
                return new URL(
                    sImageUrl,
                    sBaseOrigin
                ).toString();

            } catch (e) {
                return "";
            }
        },
        formatImageUrl: function (sImageUrl) {
    console.log("Backend imgUrl:", sImageUrl);

    if (!sImageUrl) {
        return "";
    }

    console.log(
        "Final image URL:",
        new URL(sImageUrl, window.location.href).href
    );

    return new URL(
        sImageUrl,
        window.location.href
    ).href;
},
formatImageUrl: function (sMediaUrl) {
    if (!sMediaUrl) {
        return "";
    }

    return sMediaUrl;
}

    });
});