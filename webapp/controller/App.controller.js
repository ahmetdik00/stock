sap.ui.define([
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel',
	"sap/m/Button",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/m/ButtonType",
	"sap/m/FlexBox",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/Input",
	"sap/m/Label",
	"sap/ui/core/format/DateFormat",
], function (Device,
	Controller,
	JSONModel,
	Button,
	MessageToast,
	ButtonType,
	FlexBox,
	Layout,
	MessageBox,
	Dialog,
	Text,
	Input,
	Label,
	DateFormat,) {
	"use strict";

	return Controller.extend("stock.controller.App", {
		onInit: function () {
			const oView = this.getView();

            let oViewModel = new JSONModel();
            let data = oView.setModel(oViewModel, "oViewModel");

			let user = localStorage.getItem("user_id");
			let token = localStorage.getItem("token");

            if (user && token) {
            	jQuery.ajax({
					method: "GET",
					url: "http://127.0.0.1:3000/users/" + user,
					success: function (data) {
							let oViewModel = new JSONModel(data);
							
							oView.setModel(oViewModel, "oViewModel");
							oView.getModel("oViewModel").setProperty("/data", data);
							oView.getModel("oViewModel").setProperty("/isLogin", true);
							
							if (this.oDialogLogin) {
								this.oDialogLogin.close();
							}
						
					}.bind(this),
					error: function (error) {
						
					}.bind(this)
				});
			} else {
				oView.getModel("oViewModel").setProperty("/isLogin", false);
			}

		},
            
		onPressLogin: function () {
			
			const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

			if (this.getView().getModel("oViewModel").getProperty("/isLogin")) {

				if (!this.oDialogUser) {
					this.oDialogUser = new Dialog({
						title: '{i18n>userData}',
						content: [
							new Label({
								text: '{i18n>user}',
								design: 'Bold',
								width: '100%'
							}),
							new Text({
								text: '{oViewModel>/username}',
								width: '100%'
							}),
							new Label({
								text: '{i18n>email}',
								design: 'Bold',
								width: '100%'
							}),
							new Text({
								text: '{oViewModel>/email}',
								width: '100%'
							}),
						],
						beginButton: new Button({
							text: '{i18n>logout}',
							press: this._callLogout.bind(this)
						}),
						endButton: new Button({
							text: '{i18n>cancel}',
							press: function() {
								this.oDialogUser.close();
							}.bind(this)
						})
					}).addStyleClass('sapUiContentPadding');
					this.getView().addDependent(this.oDialogUser);

				}

				this.oDialogUser.open();

			} else {

				if (!this.oDialogLogin) {

					this.oDialogLogin = new Dialog({
						width: '500%',
						title: '{i18n>login}',
						content: [
							new Label({
								width: '100%',
								text: '{i18n>email}',
							}),
							new Input({
								width: '100%',
								value: '{oLoginModel>/email}'
							}),
							new Label({
								width: '100%',
								text: '{i18n>password}',
							}),
							new Input({
								width: '100%',
								value: '{oLoginModel>/password}',
								type: 'Password'
							}),
							new sap.m.FlexBox({
								justifyContent: "End",
								width: '100%',
								alignItems: "Center",
								class: "sapUiSmallMarginTop",
								items: [
									new sap.m.Link({
										text: '{i18n>createAccount}',
										press: this._callCreateAccount.bind(this)
									})
								]
							})
						],
						beginButton: new Button({
							type: sap.m.ButtonType.Emphasized,
							text: '{i18n>login}',
							press: this._callLogin.bind(this)
						}),
						endButton: new Button({
							text: '{i18n>cancel}',
							press: function() {
								this.oDialogLogin.close();
							}.bind(this)
						})
					}).addStyleClass('sapUiContentPadding');
					this.getView().addDependent(this.oDialogLogin);

				}

				this.oDialogLogin.setModel(new JSONModel({}), "oLoginModel");
				this.oDialogLogin.open();
			}
		},
		_callLogin: function (oEvent) {
			let oLoginModel = this.oDialogLogin.getModel("oLoginModel");
			let email = oLoginModel.getProperty("/email");
			let password = oLoginModel.getProperty("/password");
			let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

			if (!email || !password) {
				sap.m.MessageToast.show(oResourceBundle.getText("mandatoryUserFields"));
			} else {

				const oView = this.getView();

				jQuery.ajax({
					method: "GET",
					url: "http://127.0.0.1:3000/users",
					success: function (data) {
						let email = oLoginModel.getProperty("/email");
						let password = oLoginModel.getProperty("/password");
						let user = data.find(user => user.email === email && user.password === password);
						if (user) {
							const oViewModel = new JSONModel(user);

							let token = btoa(email + ":" + password);
							let user_id = user.id;

							localStorage.setItem("token", token);
							localStorage.setItem("user_id", user_id);
							
							oView.setModel(oViewModel, "oViewModel");
							oView.getModel("oViewModel").setProperty("/data", data);
							oView.getModel("oViewModel").setProperty("/isLogin", true);
							
							this.oDialogLogin.close();
						} else {
							MessageBox.error("Email or password is incorrect!");
						}
					}.bind(this),
					error: function (error) {
						
					}.bind(this)
				});
			}
		},
		_callCreateAccount: function(oEvent) {
			if (!this.oDialogRegister) {

				this.oDialogRegister = new Dialog({
					title: '{i18n>createAccount}',
					content: [
						new sap.ui.layout.form.SimpleForm({
							editable: true,
							layout: 'ResponsiveGridLayout',
							content: [
								new Label({
									text: '{i18n>username}',
								}),
								new Input({
									width: '100%',
									value: '{oRegisterModel>/username}'
								}),
								new Label({
									text: '{i18n>email}',
								}),
								new Input({
									width: '100%',
									value: '{oRegisterModel>/email}'
								}),
								new Label({
									text: '{i18n>password}',
								}),
								new Input({
									width: '100%',
									value: '{oRegisterModel>/password}',
									type: 'Password',
								}),
								new Label({
									text: '{i18n>retypePassword}',
								}),
								new Input({
									width: '100%',
									value: '{oRegisterModel>/retypePassword}',
									type: 'Password',
								}),
							]
						})
					],
					beginButton: new Button({
						type: sap.m.ButtonType.Emphasized,
						text: '{i18n>createAccount}',
						press: this._callRegister.bind(this)
					}),
					endButton: new Button({
						text: '{i18n>cancel}',
						press: function() {
							this.oDialogRegister.close();
						}.bind(this)
					})	
				}).addStyleClass('sapUiContentPadding');
				this.getView().addDependent(this.oDialogRegister);

			}		
				
			this.oDialogRegister.setModel(new JSONModel({}), "oRegisterModel");	
			this.oDialogRegister.open();
		},

		_callRegister: function(oEvent) {
			
			let oRegisterModel = this.oDialogRegister.getModel("oRegisterModel");
			let dataRegister = oRegisterModel.getData();
			const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

			let ok = false;

			if (dataRegister.username && dataRegister.email && dataRegister.password && dataRegister.retypePassword) {
				ok = true;

				if (!dataRegister.email.includes("@")) {
					sap.m.MessageToast.show(oResourceBundle.getText("emailNotValid"));
					ok = false;
				} else if (dataRegister.password.length < 6) {
					sap.m.MessageToast.show(oResourceBundle.getText("passwordLength"));
					ok = false;
				} else if (dataRegister.password !== dataRegister.retypePassword) {
					sap.m.MessageToast.show(oResourceBundle.getText("passwordsNotMatch"));
					ok = false;
				}
			} else {
				sap.m.MessageToast.show(oResourceBundle.getText("mandatoryUserFields"));
			}


			if (ok) {
				jQuery.ajax({
					url: "http://localhost:3000/users",
					type: "POST",
					data: {
						username: dataRegister.username,
						email: dataRegister.email,
						password: dataRegister.password,
						isLogin: true
					},
					success: function (data) {
						this.oDialogRegister.close();
					}.bind(this),
					error: function (error) {
						sap.m.MessageToast.show(oResourceBundle.getText("accountNotCreated"));
					}.bind(this)
				});
			}
			
		},
		_callLogout: function(oEvent) {
			const oView = this.getView();
			oView.getModel("oViewModel").setProperty("/data", []);
			oView.getModel("oViewModel").setProperty("/isLogin", false);

			localStorage.removeItem("token");
			localStorage.removeItem("user_id");

			this.oDialogUser.close();
		}

	});
});