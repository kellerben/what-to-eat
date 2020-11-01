var lunch = new SwaggerClient('/openapi.json');

// ws {{{
var loc = window.location, new_uri;
new_uri += "//" + loc.host;
new_uri += loc.pathname + "/to/ws";

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
		case "refreshOrders":
			vueapp.getOpenPayments();
			break;
		case "refreshPrices":
			vueapp.getOpenPayments();
			break;
	}
}
renewconnection();
//}}}

// vue {{{
const vueapp = Vue.createApp({
	data() {
		return {
			userId: localStorage.userId,
			payments: [],
			prices: []
		}
	},
	methods: {
		getOpenPayments: function (event) {
			lunch.then(
				client => client.apis.Shop.getOpenPayments()
			).then(
				result => function(){
					vueapp.payments = JSON.parse(result.text).rows;
					var today = new Date().toISOString().substring(0,10);
					var prices = [];
					var seen = {};
					vueapp.payments.forEach(function(elem){
						var n = {
							day: elem.day.substring(0,10),
							shop: elem.shop,
							meal: elem.meal,
							price: elem.price
						};
						var key = elem.shop+elem.meal;
						if (n.day === today && !seen[key]) {
							seen[key] = true;
							prices.push(n);
						}
					});
					vueapp.prices = prices;
				}()
			)
		},
		deleteOrder: function (event) {
			lunch.then(
				client => client.apis.Order.deleteOrder({ userId: event.target.dataset["user"] }, {
					requestBody: {
						shopId: event.target.dataset["shop"],
						meal: event.target.dataset["meal"],
						price: event.target.dataset["price"],
						date: event.target.dataset["day"]
					}
				})
			)
		},
		updatePrice: function (event) {
			var elem = this.prices[event.target.dataset["id"]];
			if (elem.price === "") {
				return;
			}
			lunch.then(
				client => client.apis.Shop.setPrice({ shopId: elem.shop, meal: elem.meal, price: elem.price})
			)
		}
	}
}).mount('#root')
// }}}
vueapp.getOpenPayments();

// get open payments {{{
function fetchOpenPayments() {
	function updateOrders(orders){
		vueapp.orders = orders;
	}
	lunch.then(
		client => client.apis.Shop.getOpenPayments(),
	).then(
		result => updateOrders(JSON.parse(result.text).rows),
		reason => console.error('failed on api call: ' + reason)
	);
}
// }}}
