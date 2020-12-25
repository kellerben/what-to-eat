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
		community: localStorage.community,
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
		warning(string) {//{{{ alerts
			this.showAlert(string, 'warning');
		},
		error(string) {
			this.showAlert(string, 'error');
		},
		info(string) {
			this.showAlert(string, 'info');
		},
		showAlert(string, type) {
			this.alertClass = type == 'error' ? 'danger' : type;
			this.alertType = type[0].toUpperCase() + type.slice(1);
			this.alertMsg = string;
			this.showAlertTime = 10;
		},//}}}
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

		deleteSuggestion: function (event) {//{{{ server interaction methods
			lunch.then(
				client => client.apis.Fetch.deleteShopAnnouncement({}, {
					requestBody: {
						userId: event.target.dataset["user"],
						community: this.community,
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
				client => client.apis.Order.deleteOrder({ }, {
					requestBody: {
						community: this.community,
						shopId: event.target.dataset["shop"],
						userId: event.target.dataset["user"],
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
				client => client.apis.Fetch.announceShop({}, { requestBody: { community: this.community, userId: this.userId, shopId: this.shopId } })
			).then(
				result => null,
				reason => this.error('Could not send the suggestion. (' + reason.response.body.error + ')')
			);
		},
		orderLunch: function (event) {
			if (this.userId === "" || this.shopId === '' || this.meal === null) {
				return;
			}
			var order = { userId: this.userId, community: this.community, shopId: this.shopId, meal: this.meal.meal, specialRequest: this.specialRequest};
			if (this.price !== "") {
				order.price = this.price;
				lunch.then(client => client.apis.Shop.setPrice(order));
			}
			lunch.then(
				client => client.apis.Order.orderLunch({}, {
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
		},// }}}

		userId2LocalStorage() {
			if ((typeof localStorage.userId == "undefined" || localStorage.userId == "") && typeof this.userId != "undefined" && this.userId != "") {
				localStorage.userId = this.userId;
				this.info('User id (' + this.userId+ ') was stored for later usage. This can be changed in the config-tab…')
			}
		},
		getCommunityFromHash() {
			var u = new URLSearchParams(document.location.hash.substr(1));
			if (u.has("in")) {
				this.community = u.get("in");
				localStorage.community = this.community;
			}
		},
		init() {
			this.getCommunityFromHash();
			if (typeof(this.community) == "undefined" || this.community == "") {
				document.location = '/config/'
			} else {
				fetchSuggestions();
				fetchTodaysOrders();
				updateShopSuggestions();
			}
		}
	},
	mounted() {
		this.init();
		document.location.hash = "in=" + this.community;
		window.addEventListener('hashchange', this.init);
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
		client => client.apis.Fetch.getShopAnnouncements({ community: vueapp.community })
	).then(
		result => updateSuggestions(JSON.parse(result.text).rows),
		reason => vueapp.warning('Could not fetch today\'s suggestions. ('+reason+')')
	);
}
//}}}

// current orders {{{
function fetchTodaysOrders() {
	function updateOrders(orders){
		vueapp.orders = orders;
	}
	lunch.then(
		client => client.apis.Order.getOrdersOfDay({ community: vueapp.community })
	).then(
		result => updateOrders(JSON.parse(result.text).rows),
		reason => vueapp.warning('Could not fetch today\'s orders. ('+reason+')')
	);
}
// }}}

// update all suggestions {{{
function updateShopSuggestions() {
	function updateSuggestion(shops){
		vueapp.shopOptions = shops;
	}
	lunch.then(
		client => client.apis.Shop.getShops({ community: vueapp.community })
	).then(
		result => updateSuggestion(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch Shop suggestions. (' + reason + ')')
	);
}
function updateFoodSuggestions(shop) {
	function updateSuggestion(meals){
		vueapp.foodOptions = meals;
	}
	function updateSpecialRequestSuggestion(specialRequests){
		vueapp.specialRequestOptions = specialRequests;
	}
	lunch.then(
		client => client.apis.Shop.getMenu({ community: vueapp.community, shopId: shop })
	).then(
		result => updateSuggestion(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch the shop\'s menu. (' + reason + ')')
	);
	lunch.then(
		client => client.apis.Shop.getSpecialRequests({ community: vueapp.community, shopId: shop })
	).then(
		result => updateSpecialRequestSuggestion(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch special request suggestions. (' + reason + ')')
	);
}
// }}}
