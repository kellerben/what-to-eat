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
		userId: localStorage.userId,
		suggestions: [],
		meal: null,
		shopId: '',
		shopOptions: [],
		foodOptions: [],
		price: '',
		editField: '',
		orders: []
	},
	computed: {
		total(){
			return this.orders.reduce((total, product) => product.price + total  ,0);
		}
	},
	methods: {
		foodOptionLabel(option) {
			return option.meal;
		},
		focusField(name){
			this.editField = name;
		},
		addShop(name) {
			this.shopOptions.push(name)
			this.shopId = name;
			this.selectShop(name);
		},
		selectShop(shop) {
			updateFoodSuggestions(shop);
		},
		addFood(foodName) {
			var food = {meal: foodName, price: this.price};
			this.foodOptions.push(food)
			this.meal = food;
			this.selectFood(food);
		},
		selectFood(food) {
			this.price = food.price;
		},
		blurField(){
			this.editField = '';
		},
		showField(name){
			return (this.editField == name);
		},
		deleteSuggestion: function (event) {
			lunch.then(
				client => client.apis.Shop.deleteShopAnnouncement({}, {
					requestBody: {
						userId: event.target.dataset["user"],
						shopId: event.target.dataset["shop"]
					}
				})
			)
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
			)
		},
		announceShop: function (event) {
			if (this.userId === "" || this.shopId === "") {
				return;
			}
			lunch.then(
				client => client.apis.Shop.announceShop({}, { requestBody: { userId: this.userId, shopId: this.shopId } })
			);
		},
		orderLunch: function (event) {
			if (this.userId === "" || this.shopId === '' || this.meal === null) {
				return;
			}
			var order = { shopId: this.shopId, meal: this.meal.meal};
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
					vueapp.price = "";
					vueapp.meal = "";
				}()
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
	}

	lunch.then(
		client => client.apis.Shop.getShopAnnouncements(),
	).then(
		result => updateSuggestions(JSON.parse(result.text).rows),
		reason => console.error('failed on api call: ' + reason)
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
		client => client.apis.Shop.getOrdersOfDay(),
	).then(
		result => updateOrders(JSON.parse(result.text).rows),
		reason => console.error('failed on api call: ' + reason)
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
		client => client.apis.Shop.getShops(),
	).then(
		result => updateSuggestion(JSON.parse(result.text)),
		reason => console.error('failed on api call: ' + reason)
	);
}
updateShopSuggestions();
function updateFoodSuggestions(shop) {
	function updateSuggestion(meals){
		vueapp.foodOptions = meals;
	}
	lunch.then(
		client => client.apis.Shop.getMenu({
					shopId: shop
				}),
	).then(
		result => updateSuggestion(JSON.parse(result.text)),
		reason => console.error('failed on api call: ' + reason)
	);
}
// }}}
