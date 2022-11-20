sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/m/Input",
	"sap/m/Label",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/FlexBox",
	"sap/m/ComboBox",
	"stock/controller/BaseController",
	"sap/m/Link"
	
], function (Controller, JSONModel, formatter, Filter, FilterOperator, MessageToast, MessageBox, Dialog, Text, Input, Label, Button, ButtonType, FlexBox, ComboBox, BaseController) {
	"use strict";

	return BaseController.extend("stock.controller.ProductList", {
        formatter: formatter,
		onInit : function () {
		
			let oViewModel = new JSONModel({
				currency: "EUR"
			});
			this.getView().setModel(oViewModel, "view");
		},

		// Chart Data
		onRenderApex: function () {

			let data = [];
			let categories = [];
			let oModel = this.getView();
			var oBinding = this.byId("productList").getBinding("items");

			let products = oBinding.getModel().getData();
			Object.keys(products).forEach(key => {
				data.push(products[key].UnitsInStock);
				categories.push(products[key].ProductName);
			  });

			var options = {
				chart: {
				  type: 'bar'
				},
				// plotOptions: {
				//   bar: {
				// 	horizontal: true
				//   }
				// },
				series: [{
				  name: 'Units In Stock',
				  data: data
				}],
				xaxis: {
				  categories: categories
				},
				dropShadow: {
					enabled: true,
					top: 0,
					left: 0,
					blur: 3,
					opacity: 0.5
				  }
			  }
			  
			  var chart = new ApexCharts(document.querySelector("#chart"), options);
			  
			  chart.render();
		},

		// Filter Data
		onFilterProducts : function (oEvent) {

			// build filter array
			let aFilter = [];
			let sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new Filter("ProductName", FilterOperator.Contains, sQuery));
			}

			// filter binding
			let oList = this.byId("productList");
			let oBinding = oList.getBinding("items");
			oBinding.filter(aFilter);
		},
		
		// Navigate to Product Detail
		onPress: function (oEvent) {
			let oItem = oEvent.getSource();
			let oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("detail", {
				detailPath: window.encodeURIComponent(oItem.getBindingContext("products").getPath().substr(1))
			});
			
		},

		// Checking product serial numbers
		onAdd : function (oEvent) {
			if (this.oDialogAddControl) {
				this.oDialogAddControl.destroy();
				this.oDialogAddControl = null;
			}

			if (!this.oDialogAddControl) {
				this.oDialogAddControl = new Dialog({
					title: "Product Control",
					content: [
						new Label({
							width: '100%',
							text: '{i18n>columnProductID}',
						}),
						new Input({
							width: '100%',
							type: 'Number',
							value: '{oControlModel>/ProductID}',
						})
					],	
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Product Control",
						press: this._callProductController.bind(this)
					}),
					endButton: new Button({
						text: '{i18n>cancel}',
						press: function() {
							this.oDialogAddControl.close();
						}.bind(this)
					})	
				}).addStyleClass('sapUiContentPadding');
				this.getView().addDependent(this.oDialogAddControl);
				this.oDialogAddControl.setModel(new JSONModel({}), "oControlModel");
			}	
			this.oDialogAddControl.open();
		},

		// Product removal from stock
		onOut: function() {

			if (this.oDialogOutOfStock) {
				this.oDialogOutOfStock.destroy();
				this.oDialogOutOfStock = null;
			}
			var oBinding = this.byId("productList").getBinding("items");
			var oSelected = this.byId("productList").getSelectedItem();
			var oContext = oSelected.getBindingContext("products");
			var oModel = oContext.getModel();
			var ProductID = oContext.getObject().ProductID;
			var ProductName = oContext.getObject().ProductName;
			var SupplierID = oContext.getObject().SupplierID;
			var CategoryID = oContext.getObject().CategoryID;
			var QuantityPerUnit = oContext.getObject().QuantityPerUnit;
			var ProductCost = oContext.getObject().ProductCost;
			var UnitsInStock = oContext.getObject().UnitsInStock;
			
	        if (!this.oDialogOutOfStock) {

				this.oDialogOutOfStock = new Dialog({
					title: 'Out Of Stock',
					content: [
						new sap.ui.layout.form.SimpleForm({
							editable: true,
							layout: 'ResponsiveGridLayout',
							content: [
								new Label({
									text: '{i18n>columnProductID}',
								}),
								new Input({
									width: '100%',
									enabled: false,
									value: '{oOutOfStockModel>/ProductID}',
								}),
								new Label({
									text: '{i18n>productName}',
								}),
								new Input({
									width: '100%',
									enabled: false,
									value: '{oOutOfStockModel>/ProductName}',
								}),
								new Label({
									text: '{i18n>productSale}',
								}),
								new Input({
									width: '100%',
									placeholder: 'Product cost ' + ProductCost,
									value: '{oOutOfStockModel>/ProductSale}',
									type: 'Number'
								}),
								new Label({
									text: '{i18n>unitsInStock}',
								}),
								new Input({
									width: '100%',
									placeholder: 'The amount of stock ' + UnitsInStock,
									value: '{oOutOfStockModel>/UnitsInStock}',
									type: 'Number'
								})
							]
						})
					],
					beginButton: new Button({
						type: sap.m.ButtonType.Reject,
						text: 'Out Of Stock',
						press: this._calloOutOfStock.bind(this)
					}),
					endButton: new Button({
						text: '{i18n>cancel}',
						press: function() {
							this.oDialogOutOfStock.close();
						}.bind(this)
					})	
				}).addStyleClass('sapUiContentPadding');
				this.getView().addDependent(this.oDialogOutOfStock);
				this.oDialogOutOfStock.setModel(new JSONModel({
					ProductID,
					ProductName,
					CategoryID,
					SupplierID,
					QuantityPerUnit,
				}), "oOutOfStockModel");
			}			
			this.oDialogOutOfStock.open();			

		},
		
		// Update products
		onEdit : function (oEvent) {
			if (this.oDialogEdit) {
				this.oDialogEdit.destroy();
				this.oDialogEdit = null;
			}
			let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			var oBinding = this.byId("productList").getBinding("items");
			var oSelected = this.byId("productList").getSelectedItem();
			var oContext = oSelected.getBindingContext("products");
			var oModel = oContext.getModel();
			var oldUnitsInStock = oContext.getObject().UnitsInStock;
			var ProductID = oContext.getObject().ProductID;
			var ProductName = oContext.getObject().ProductName;
			var SupplierID = oContext.getObject().SupplierID;
			var CategoryID = oContext.getObject().CategoryID;
			var QuantityPerUnit = oContext.getObject().QuantityPerUnit;
			var ProductCost = oContext.getObject().ProductCost;
			var UnitsInStock = oContext.getObject().UnitsInStock;
			
	        if (!this.oDialogEdit) {

				this.oDialogEdit = new Dialog({
					title: '{i18n>editProduct}',
					content: [
						new sap.ui.layout.form.SimpleForm({
							editable: true,
							layout: 'ResponsiveGridLayout',
							content: [
								new Label({
									text: '{i18n>columnProductID}',
								}),
								new Input({
									width: '100%',
									enabled: false,
									value: '{oEditModel>/ProductID}',
								}),
								new Label({
									text: '{i18n>productName}',
								}),
								new Input({
									width: '100%',
									value: '{oEditModel>/ProductName}',
								}),
								new Label({
									text: '{i18n>categoryName}',
								}),
								new ComboBox({
									width: '100%',
									selectedKey: '{oEditModel>/CategoryID}',
									items : {
										path: "categories>/",
										template: new sap.ui.core.ListItem({
											key: "{categories>CategoryID}",
											text: "{categories>CategoryName}"
										})
									}
								}),
								new Label({
									text: '{i18n>supplierName}',
								}),
								new ComboBox({
									width: '100%',
									selectedKey: '{oEditModel>/SupplierID}',
									items : {
										path: "suppliers>/",
										template: new sap.ui.core.ListItem({
											key: "{suppliers>SupplierID}",
											text: "{suppliers>CompanyName}"
										})
									}
								}),
								new Label({
									text: '{i18n>quantityPerUnit}',
								}),
								new Input({
									width: '100%',
									value: '{oEditModel>/QuantityPerUnit}',
								}),
								new Label({
									text: '{i18n>productCost}',
								}),
								new Input({
									width: '100%',
									value: '{oEditModel>/ProductCost}',
									type: 'Number'
								})
							]
						})
					],
					beginButton: new Button({
						type: sap.m.ButtonType.Emphasized,
						text: '{i18n>editProduct}',
						press: this._callEdit.bind(this)
					}),
					endButton: new Button({
						text: '{i18n>cancel}',
						press: function() {
							this.oDialogEdit.close();
						}.bind(this)
					})	
				}).addStyleClass('sapUiContentPadding');
				this.getView().addDependent(this.oDialogEdit);
				this.oDialogEdit.setModel(new JSONModel({
					ProductID,
					ProductName,
					CategoryID,
					SupplierID,
					QuantityPerUnit,
					ProductCost,
					UnitsInStock,
					oldUnitsInStock
				}), "oEditModel");
			}			
			this.oDialogEdit.open();			
		},

		// Update data in the list
		onRefresh : function (oEvent) {
			const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			
			this.getOwnerComponent().setModel(new JSONModel("http://localhost:3000/products"), "products");
			this.byId("productList").getBinding("items").refresh();

			// this.getOwnerComponent().getModel("products").getData();
			MessageToast.show(oResourceBundle.getText("refreshSuccessMessage"));
		},

		// Delete data in the list
		onDelete : function (oEvent) {
			let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			var oBinding = this.byId("productList").getBinding("items");
			var oSelected = this.byId("productList").getSelectedItem();
			var oContext = oSelected.getBindingContext("products");
			var ProductID = oContext.getObject().ProductID;
			let oModel = this.getView();
			
			let ok = true;
			if (oSelected) {
				jQuery.ajax({
					method: "DELETE",
					url: "http://localhost:3000/status/" + ProductID,
					succes: true,
					error: function() {
						ok = false;
					}
				});

				if (ok) {
					jQuery.ajax({
						method: "DELETE",
						url: "http://localhost:3000/products/" + ProductID,
						success: function (result) {
							oModel.setModel(new JSONModel("http://localhost:3000/products"), "products");
							MessageBox.success(oResourceBundle.getText("successDeleteMessage"));
						},
						error: function (error) {
							console.log(error);
						}
					});
				}
			}
		},

		// Data sent into the chart
		onChart : function (oEvent) {

			let data = [];
			let categories = [];
			let oModel = this.getView();
			var oBinding = this.byId("productList").getBinding("items");

			let products = oBinding.getModel().getData();
			Object.keys(products).forEach(key => {
				data.push(products[key].UnitsInStock);
				categories.push(products[key].CategoryName);
			  });
			
		},

		_callEdit : function (oEvent) {
			let oProductModel = this.oDialogEdit.getModel("oEditModel");
			let productData = oProductModel.getData();
			let ProductID = productData.ProductID;
			let ProductName = productData.ProductName;
			let UnitsInStock = productData.UnitsInStock;
			let oModel = this.getView();
			const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			
			let ok = true;
			let oData = this.byId("productList").getModel("products").getData();
			if (productData.ProductName && 
				productData.SupplierID && 
				productData.CategoryID && 
				productData.QuantityPerUnit && 
				productData.ProductCost && 
				productData.UnitsInStock >=0 && productData.UnitsInStock >= 0) {
				ok = true;
			}    else {
				MessageBox.error(oResourceBundle.getText("mandatoryUserFields"));
			}

			oData.forEach(function (data) {
				if (data.ProductID === productData.ProductID) {
					let productCost = parseFloat(productData.ProductCost) - parseFloat(data.ProductCost);
					if (ok) {
						jQuery.ajax({
							method: "POST",
							url: "http://localhost:3000/products/" + productData.ProductID,
							data: {
								ProductName: productData.ProductName,
								CategoryID: productData.CategoryID,
								SupplierID: productData.SupplierID,
								QuantityPerUnit: productData.QuantityPerUnit,
								ProductCost: productData.ProductCost,
								CostPrice: parseFloat(data.CostPrice) + (parseFloat(productCost) * parseFloat(UnitsInStock)),
							},
							success: function (result) {
								if (productData.UnitsInStock >= productData.oldUnitsInStock || productData.UnitsInStock <= productData.oldUnitsInStock) {
									if (ok) {
										jQuery.ajax({
											method: "POST",
											url: "http://localhost:3000/status",
											data: {
												ProductID: ProductID,
												Status: "The stock number of the " + ProductName + " product in stock has been updated to " + UnitsInStock,
												success: true
											}
										});
									}
								}
								MessageBox.success(oResourceBundle.getText("successEditMessage"));
								oModel.setModel(new JSONModel("http://localhost:3000/products"), "products");
								
							}.bind(this),
							error: function (error) {
								MessageBox.error(error.responseText);
							}
						});
					}
				}
			});
			
			this.oDialogEdit.close();
		},

		_callAdd : function (oEvent) {
			let oProductModel = this.oDialogAdd.getModel("oAddModel");
			let productData = oProductModel.getData();
			const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

			let ok = false;

			if (productData.ProductName && productData.SupplierID && productData.CategoryID && productData.QuantityPerUnit && productData.ProductCost) {
				ok = true;
			}  else {
				
				MessageBox.error(oResourceBundle.getText("mandatoryUserFields"));
			}

			if (ok) {
				jQuery.ajax({
					method: "POST",
					url: "http://localhost:3000/products",
					data: {
						ProductName: productData.ProductName,
						CategoryID: productData.CategoryID,
						SupplierID: productData.SupplierID,
						QuantityPerUnit: productData.QuantityPerUnit,
						ProductCost: productData.ProductCost
					},
					success: function (result) {
						this.getView().setModel(new JSONModel("http://localhost:3000/products"), "products");
						MessageBox.success(oResourceBundle.getText("successAddMessage"));
						this.oDialogAdd.close();
					}.bind(this),
					error: function (error) {
						MessageBox.error(error.responseText);
					}
				});
			}
			
		},	

		_callProductController : function (oEvent) {
			if (this.oDialogExistinAdd) {
				this.oDialogExistinAdd.destroy();
				this.oDialogExistinAdd = null;
			}
			
			if (this.oDialogAdd) {
				this.oDialogAdd.destroy();
				this.oDialogAdd = null;
			}

			let oProductModel = this.oDialogAddControl.getModel("oControlModel");
			let productData = oProductModel.getData();
			let ok = true;

			let oData = this.byId("productList").getModel("products").getData();
			oData.forEach(data => {
				if (productData.ProductID == data.ProductID) {
						
					this.oDialogAddControl.close();
					
					let ProductID = data.ProductID;
					let ProductName = data.ProductName;
					let ProductCost = data.ProductCost;
					let UnitsInStock = data.UnitsInStock;

					alert("The product with this serial number already exists");
					
					if (!this.oDialogExistinAdd) {

						this.oDialogExistinAdd = new Dialog({
							title: 'Add Stock',
							content: [
								new sap.ui.layout.form.SimpleForm({
									editable: true,
									layout: 'ResponsiveGridLayout',
									content: [
										new Label({
											text: '{i18n>columnProductID}',
										}),
										new Input({
											width: '100%',
											enabled: false,
											value: '{oExistingModel>/ProductID}'
										}),
										new Label({
											text: '{i18n>productName}',
										}),
										new Input({
											width: '100%',
											enabled: false,
											value: '{oExistingModel>/ProductName}'
										}),
										new Label({
											text: '{i18n>unitsInStock}',
										}),
										new Input({
											width: '100%',
											placeholder: 'The amount of stock ' + UnitsInStock,
											value: '{oExistingModel>/UnitsInStock}',
											type: 'Number'
										})
									]
								})
							],
							beginButton: new Button({
								type: sap.m.ButtonType.Emphasized,
								text: 'Add Stock',
								press: this._callAddExistingProduct.bind(this)
							}),
							endButton: new Button({
								text: '{i18n>cancel}',
								press: function() {
									this.oDialogExistinAdd.close();
								}.bind(this)
							})	
						}).addStyleClass('sapUiContentPadding');
						this.getView().addDependent(this.oDialogExistinAdd);
						this.oDialogExistinAdd.setModel(new JSONModel({
							ProductID,
							ProductName,
							ProductCost
						}), "oExistingModel");
					}
					ok = false
					this.oDialogExistinAdd.open();
				}			
			});

			if (ok) {
				if (!this.oDialogAdd) {

					this.oDialogAdd = new Dialog({
						title: '{i18n>addProduct}',
						content: [
							new sap.ui.layout.form.SimpleForm({
								editable: true,
								layout: 'ResponsiveGridLayout',
								content: [
									new Label({
										text: '{i18n>productName}',
									}),
									new Input({
										width: '100%',
										value: '{oAddModel>/ProductName}'
									}),
									new Label({
										text: '{i18n>categoryName}',
									}),
									new ComboBox({
										width: '100%',
										selectedKey: '{oAddModel>/CategoryID}',
										items : {
											path: "categories>/",
											template: new sap.ui.core.ListItem({
												key: "{categories>CategoryID}",
												text: "{categories>CategoryName}"
											})
										}
									}),
									new Label({
										text: '{i18n>supplierName}',
									}),
									new ComboBox({
										width: '100%',
										selectedKey: '{oAddModel>/SupplierID}',
										items : {
											path: "suppliers>/",
											template: new sap.ui.core.ListItem({
												key: "{suppliers>SupplierID}",
												text: "{suppliers>CompanyName}"
											})
										}
									}),
									new Label({
										text: '{i18n>quantityPerUnit}',
									}),
									new Input({
										width: '100%',
										value: '{oAddModel>/QuantityPerUnit}'
									}),
									new Label({
										text: '{i18n>productCost}',
									}),
									new Input({
										width: '100%',
										placeholder: '0,00',
										value: '{oAddModel>/ProductCost}',
										type: 'Number'
									})
								]
							})
						],
						beginButton: new Button({
							type: sap.m.ButtonType.Emphasized,
							text: '{i18n>addProduct}',
							press: this._callAdd.bind(this)
						}),
						endButton: new Button({
							text: '{i18n>cancel}',
							press: function() {
								this.oDialogAdd.close();
							}.bind(this)
						})	
					}).addStyleClass('sapUiContentPadding');
					this.getView().addDependent(this.oDialogAdd);

				}		
					
				this.oDialogAdd.setModel(new JSONModel({}), "oAddModel");	
				this.oDialogAdd.open();
				this.oDialogAddControl.close();
			}
		},

		_callAddExistingProduct : function () {
			let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			let oProductModel = this.oDialogExistinAdd.getModel("oExistingModel");
			let productData = oProductModel.getData();
			let oModel = this.getView();
			let ok = false;

			let oData = this.byId("productList").getModel("products").getData();
			if (productData.UnitsInStock > 0) {
				ok = true;

				oData.forEach(function (data) {
					if (data.ProductID === productData.ProductID) {

						if (ok) {

							jQuery.ajax({
								method: "POST",
								url: "http://localhost:3000/products/" + productData.ProductID,
								data: {
									UnitsInStock: parseInt(data.UnitsInStock) + parseInt(productData.UnitsInStock),
									CostPrice: parseFloat(data.CostPrice) + (parseFloat(productData.UnitsInStock) * parseFloat(productData.ProductCost)),
								},
								success: function (result) {
									if (ok) {
										jQuery.ajax({
											method: "POST",
											url: "http://localhost:3000/status",
											data: {
												ProductID: productData.ProductID,
												Status: "Added " + productData.UnitsInStock + " units of " + productData.ProductName + " to stock",
												success: true
											}
										});
									}
									oModel.setModel(new JSONModel("http://localhost:3000/products"), "products");
									MessageBox.success(oResourceBundle.getText("succesAddProductStock"));
									
								}.bind(this),
								error: function (error) {
									MessageBox.error(error.responseText);
								}
							});
						}
					}
				});
				this.oDialogExistinAdd.close();

			} else {
				MessageBox.error("Please enter a unit stock");
			}
		},

		_calloOutOfStock: function() {
			let oProductModel = this.oDialogOutOfStock.getModel("oOutOfStockModel");
			let productData = oProductModel.getData();
			const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			let oModel = this.getView();
			
			let ok = false;

			let oData = this.byId("productList").getModel("products").getData();

			if (productData.UnitsInStock && productData.ProductSale >= 0) {
				ok = true;
			} else {
				MessageBox.error(oResourceBundle.getText("mandatoryUserFields"));
			}

			oData.forEach(function (data) {
				if (data.ProductID === productData.ProductID) {

					let stock = data.UnitsInStock - productData.UnitsInStock;
					let salePrice =parseFloat(data.SalePrice) + parseFloat(productData.UnitsInStock) * parseFloat(productData.ProductSale)
						console.log(salePrice);
						if (salePrice >= data.CostPrice) {
							let profit = salePrice - data.CostPrice;
							console.log(profit);
						} else {
							let loss = parseFloat(data.ExpectedProfit)
							console.log(loss);
						}
					if (stock < 0) {
						MessageBox.error("You cannot issue more than " + data.UnitsInStock + " in stock!");
						ok = false;
					} else {
						
						jQuery.ajax({
							method: "POST",
							url: "http://localhost:3000/products/" + productData.ProductID,
							data: {
								ProductSale: productData.ProductSale,
								SalePrice: salePrice,	
								UnitsInStock: stock,
								ExpectedProfit : (salePrice >= data.CostPrice) ? salePrice - data.CostPrice : parseFloat(data.ExpectedProfit)
							},
							success: function (result) {
								if (ok) {
									jQuery.ajax({
										method: "POST",
										url: "http://localhost:3000/status",
										data: {
											ProductID: productData.ProductID,
											Status: "Issued " + productData.UnitsInStock + " units of " + productData.ProductName + " from stock" + "." + " Sale price: " + productData.ProductSale + " EUR",
											success: true
										}
									});
								}
								oModel.setModel(new JSONModel("http://localhost:3000/products"), "products");
								MessageBox.success(oResourceBundle.getText("succesAddProductStock"));
							}.bind(this),
							error: function (error) {
								MessageBox.error(error.responseText);
							}
						});
					}
				}
			});
			this.oDialogOutOfStock.close();
		},
	});
});