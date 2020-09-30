sap.ui.define([], function() {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
        loginHistoryEnabled: function(sVal1, sVal2) {
			if (sVal1 === "N" && sVal2) {
				return true;
			} else {
				return false;
			} 
		},
		handleLoginEnabled: function(sVal1, sVal2) {
			if (sVal1 === "N" && sVal2) {
				return true;
			} else if (sVal1 === "Y") {
				return false;
			} else {
				return false;
			}
		}

	};

});