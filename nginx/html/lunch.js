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
			break;
		case "refreshOrders":
			fetchTodaysOrders();
			break;
	}
}
renewconnection();
//}}}

// vue {{{
const vueapp = new Vue({
	data: {
			userId: localStorage.userId,
			suggestions: [],
			meal: '',
			shopId: '',
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
		focusField(name){
			this.editField = name;
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
			if (this.userId === "" || this.shopId === "" || this.meal === "") {
				return;
			}
			var order = { shopId: this.shopId, meal: this.meal};
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
