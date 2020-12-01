var lunch = new SwaggerClient('/openapi.json');

// ws {{{
var connection;
function renewconnection(){
	var prot;
	if (window.location.protocol === "https:") {
		prot = "wss://";
	} else {
		prot = "ws://";
	}
	connection = new WebSocket(prot+location.hostname+":"+location.port+"/ws/", "json");
	connection.onmessage = incommingMessage;
	connection.onclose = renewconnection;
}
function incommingMessage(e) {
	switch(e.data) {
		case "getShopAnnouncements":
			fetchSuggestions();
			updateShopSuggestions();
			break;
		case "refreshOrders":
			fetchTodaysOrders();
			if (vueapp.shopId != ''){
				updateFoodSuggestions(vueapp.shopId);
			}
			break;
	}
}
renewconnection();
//}}}

// vue {{{
const vueapp = new Vue({
	components: {
		Multiselect: window.VueMultiselect.default
	},
	data: {
		alertMsg: '',
		alertClass: '',
		alertType: '',
		showAlertTime: 0,
		userId: localStorage.userId,
		suggestions: [],
		meal: null,
		specialRequest: '',
		specialRequestOptions: [],
		saveSpecialRequestValue: '',
		saveFoodValue: '',
		shopId: '',
		saveShopValue: '',
		shopOptions: [],
		foodOptions: [],
		price: '',
		orders: []
	},
	computed: {
		total(){
			return this.orders.reduce((total, product) => product.price + total  ,0);
		}
	},
	methods: {
		warning(string) {
			this.showAlert(string, 'warning');
		},
		error(string) {
			this.showAlert(string, 'error');
		},
		showAlert(string, type) {
			this.alertClass = type == 'error' ? 'danger' : type;
			this.alertType = type[0].toUpperCase() + type.slice(1);
			this.alertMsg = string;
			this.showAlertTime = 10;
		},
		saveAddShop(name){// shop multiselect methods {{{
			// check if we pressed backspace or tab -> the active element is not inside the class anymore
			if (name == '' && [].indexOf.call(document.querySelectorAll('.shopInput input'), document.activeElement) == -1) {
				if (this.shopOptions.includes(this.saveShopValue)) {
					this.shopId = this.saveShopValue;
					this.selectShop(this.saveShopValue);
				} else {
					this.addShop(this.saveShopValue);
				}
			} else {
				this.saveShopValue = name;
			}
		},
		addShop(name) {
			this.shopOptions.push(name)
			this.shopId = name;
			this.selectShop(name);
		},
		selectShop(shop) {
			updateFoodSuggestions(shop);
		},// }}}

		foodOptionLabel(option) {// food multiselect methods {{{
			if (option.price != ''){
				return option.meal + ' (' + option.price + ' ct)';
			} else {
				return option.meal;
			}
		},
		saveAddFood(name){
			if (name == '' && [].indexOf.call(document.querySelectorAll('.foodInput input'), document.activeElement) == -1) {
				var food;
				var newfood = this.saveFoodValue;
				this.foodOptions.forEach(function(elem){
					if (elem.meal == newfood) {
						food = elem;
					}
				});

				if (typeof food != 'undefined') {
					this.meal = food;
					this.selectFood(food);
				} else {
					this.addFood(newfood);
				}
			} else {
				this.saveFoodValue = name;
			}
		},
		addFood(foodName) {
			var food = {meal: foodName, price: this.price};
			this.foodOptions.push(food)
			this.meal = food;
			this.selectFood(food);
		},
		selectFood(food) {
			this.price = food.price;
		}, // }}}

		saveAddSpecialRequest(name){// specialRequest multiselect methods {{{
			// check if we pressed backspace or tab -> the active element is not inside the class anymore
			if (name == '' && [].indexOf.call(document.querySelectorAll('.specialRequestInput input'), document.activeElement) == -1) {
				if (this.specialRequestOptions.includes(this.saveSpecialRequestValue)) {
					this.specialRequest = this.saveSpecialRequestValue;
				} else {
					this.addSpecialRequest(this.saveSpecialRequestValue);
				}
			} else {
				this.saveSpecialRequestValue = name;
			}
		},
		addSpecialRequest(name) {
			this.specialRequestOptions.push(name)
			this.specialRequest = name;
		},// }}}

		deleteSuggestion: function (event) {
			lunch.then(
				client => client.apis.Fetch.deleteShopAnnouncement({}, {
					requestBody: {
						userId: event.target.dataset["user"],
						shopId: event.target.dataset["shop"]
					}
				})
			).then(
				result => null,
				reason => this.error('Could not delete the suggestion. (' + reason.response.body.error + ')')
			);
		},
		deleteOrder: function (event) {
			lunch.then(
				client => client.apis.Order.deleteOrder({ userId: event.target.dataset["user"] }, {
					requestBody: {
						shopId: event.target.dataset["shop"],
						meal: event.target.dataset["meal"],
						price: event.target.dataset["price"]
					}
				})
			).then(
				result => null,
				reason => this.error('Could not delete the order. (' + reason.response.body.error + ')')
			);
		},
		announceShop: function (event) {
			if (this.userId === "" || this.shopId === "") {
				return;
			}
			lunch.then(
				client => client.apis.Fetch.announceShop({}, { requestBody: { userId: this.userId, shopId: this.shopId } })
			).then(
				result => null,
				reason => this.error('Could not send the suggestion. (' + reaso.response.body.error + ')')
			);
		},
		orderLunch: function (event) {
			if (this.userId === "" || this.shopId === '' || this.meal === null) {
				return;
			}
			var order = { shopId: this.shopId, meal: this.meal.meal, specialRequest: this.specialRequest};
			if (this.price !== "") {
				order.price = this.price;
				lunch.then(client => client.apis.Shop.setPrice(order));
			}
			lunch.then(
				client => client.apis.Order.orderLunch({
					userId: this.userId
				}, {
					requestBody: order
				})
			).then(
				result => function(){
					this.price = "";
					this.meal = "";
					this.specialRequest = "";
				}(),
				reason => this.error('Could not place the order. (' + reason.response.body.error + ')')
			);
		}
	},
	el: '#root'
});
// }}}

// current Suggestions {{{
function fetchSuggestions() {
	function updateSuggestions(suggestions){
		vueapp.suggestions = suggestions;
		if (suggestions.length == 1 && vueapp.shopId == '') {
			vueapp.shopId = suggestions[0].shop;
			updateFoodSuggestions(vueapp.shopId);
		}
	}

	lunch.then(
		client => client.apis.Fetch.getShopAnnouncements()
	).then(
		result => updateSuggestions(JSON.parse(result.text).rows),
		reason => vueapp.warning('Could not fetch today\'s suggestions. ('+reason+')')
	);
}
fetchSuggestions();
//}}}

// current orders {{{
function fetchTodaysOrders() {
	function updateOrders(orders){
		vueapp.orders = orders;
	}
	lunch.then(
		client => client.apis.Order.getOrdersOfDay()
	).then(
		result => updateOrders(JSON.parse(result.text).rows),
		reason => vueapp.warning('Could not fetch today\'s orders. ('+reason+')')
	);
}
fetchTodaysOrders();
// }}}

// update all suggestions {{{
function updateShopSuggestions() {
	function updateSuggestion(shops){
		vueapp.shopOptions = shops;
	}
	lunch.then(
		client => client.apis.Shop.getShops()
	).then(
		result => updateSuggestion(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch Shop suggestions. (' + reason + ')')
	);
}
updateShopSuggestions();
function updateFoodSuggestions(shop) {
	function updateSuggestion(meals){
		vueapp.foodOptions = meals;
	}
	function updateSpecialRequestSuggestion(specialRequests){
		vueapp.specialRequestOptions = specialRequests;
	}
	lunch.then(
		client => client.apis.Shop.getMenu({ shopId: shop })
	).then(
		result => updateSuggestion(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch the shop\'s menu. (' + reason + ')')
	);
	lunch.then(
		client => client.apis.Shop.getSpecialRequests({ shopId: shop })
	).then(
		result => updateSpecialRequestSuggestion(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch special request suggestions. (' + reason + ')')
	);
}
// }}}
