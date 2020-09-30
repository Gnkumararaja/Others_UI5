sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"com/merckgroup/qm/z_cslog/model/formatter",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function(Controller, History, formatter, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("com.merckgroup.qm.z_cslog.controller.Log_page", {
		formatter: formatter,
		onInit: function() {
			this.readLog();
			this.getStations();
		},
		onPressScan: function(oEvent) {
			var that = this,
				oGroupUnitModel = this.getOwnerComponent().getModel("logModel");

			jQuery.sap.require("sap.ndc.BarcodeScanner");
			sap.ndc.BarcodeScanner.scan(
				function(oResult) {
					if (!oResult.cancelled) {
						oGroupUnitModel.setProperty("/logData/Clst", oResult.text);
						that.checkStation(oResult.text);
					}
				}.bind(this),
				function(oError) {
					this.triggerErrorMessage(oError);
				}.bind(this),
				function(oResult) {}
			);
		},
		readLog: function() {
			var that = this;
			var sPath = "/ReadLogSet('')";
			var oModel = this.getOwnerComponent().getModel();
			var logModel = this.getOwnerComponent().getModel("logModel");
			that.getView().setBusy(true);
			oModel.read(sPath, {
				success: function(odata) {
					that.getView().setBusy(false);
					logModel.setProperty("/logData", odata);
					if (odata.UserLgd !== "Y") {
						logModel.setProperty("/logData/UserLgd", "N");
						logModel.setProperty("/logData/Clst", "");
					}
                     
					logModel.setProperty("/logData/PName", odata.ClstName);
					logModel.setProperty("/logData/ClstName", "");
				},
				error: function(oError) {
					that.getView().setBusy(false);
				}
			});
		},
		onChangeClst: function(oEvent) {
			var value = oEvent.getSource().getValue();
			if(value){
                  this.checkStation(value);
			} else {
				var logModel = this.getOwnerComponent().getModel("logModel");
				logModel.setProperty("/logData/ClstName", "");
					
			}
		},
		checkStation: function(value) {
			if (value) {
				var that = this;
				var sPath = "/StationsSet('" + value + "')";
				var oModel = this.getOwnerComponent().getModel();
				var logModel = this.getOwnerComponent().getModel("logModel");
				that.getView().setBusy(true);
				oModel.read(sPath, {
					success: function(odata) {
						that.getView().setBusy(false);
						logModel.setProperty("/logData/ClstName", odata.ClstName);
					},
					error: function(oError) {
						logModel.setProperty("/logData/ClstName", "");
						that.getView().setBusy(false);
						var errorText = JSON.parse(oError.responseText);
						MessageBox.show(errorText.error.message.value, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Error"
						});
					}
				});
			}
		},
		postData: function(pVal) {

			var oModel = this.getOwnerComponent().getModel("logModel");
			var sData = oModel.getProperty("/logData");
			if (sData.Clst === "") {
				sap.m.MessageBox.show("Cleaning station data is missing", {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Error",
					actions: [sap.m.MessageBox.Action.OK]
				});
				return;
			}

			var data = {
				Bname: sData.Bname,
				ClstName: sData.Clst,
				UserLgd: pVal
			};
			var sMsg = "";
			if (pVal === "Y") {
				sMsg = "Successfully logged-on to cleaning station " + sData.ClstName;
			} else {
				sMsg = "Successfully logged-off from cleaning station " + sData.PName;
			}
			var that = this;
			var oModel1 = this.getOwnerComponent().getModel();
			this.getView().setBusy(true);
			oModel1.create("/CSLogsSet", data, {
				success: function(oData) {
					that.getView().setBusy(false);
					that.readLog();
					MessageToast.show(sMsg);
				},
				error: function(oError) {
					that.getView().setBusy(false);
					var errorText = JSON.parse(oError.responseText);
					MessageToast.show(errorText.error.message.value);
			
				}
			});

		},
		onPressIn: function() {
			this.postData("Y");
		},
		onPressOut: function() {
			var that = this;
			MessageBox.show("Log-off from cleaning station?", {
				icon: sap.m.MessageBox.Icon.INFORMATION,
				title: "Info",
				actions: [sap.m.MessageBox.Action.OK,
					sap.m.MessageBox.Action.CANCEL
				],
				onClose: function(oAction) {
					if (oAction === "OK") {
						that.postData("N");
					}
				}
			});

		},

		onPressCancel: function() {
			window.history.go(-1);

		},
		getStations:function(){
			var that = this;
			var sPath = "/StationsSet";
			var oModel = this.getOwnerComponent().getModel();
			var logModel = this.getOwnerComponent().getModel("logModel");
			that.getView().setBusy(true);
			oModel.read(sPath, {
				success: function(odata) {
					that.getView().setBusy(false);
    				logModel.setProperty("/StationsSet", odata.results);

				},
				error: function(oError) {
					that.getView().setBusy(false);
				}
			});

		},
		handleValueHelp: function(oController) {
			this.inputId = oController.getSource();
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"com.merckgroup.qm.z_cslog.fragments.stations",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}
			// open value help dialog
			this._valueHelpDialog.open();
		},
		_handleValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");

			var aFilter = [new sap.ui.model.Filter([
				new sap.ui.model.Filter("Clst", sap.ui.model.FilterOperator.Contains, sValue),
				new sap.ui.model.Filter("ClstName", sap.ui.model.FilterOperator.Contains, sValue)
			], false)];

			evt.getSource().getBinding("items").filter(aFilter);

		},

		_handleValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			var productInput = this.inputId;
			if (oSelectedItem) {
				var selectedData = oSelectedItem.getBindingContext("logModel").getObject();
				productInput.setValue(selectedData.Clst);
			    this.checkStation(selectedData.Clst);
				
			} else {
				productInput.setValue("");
				productInput.setDescription("");
			}
			evt.getSource().getBinding("items").filter([]);
		}
		

	});
});