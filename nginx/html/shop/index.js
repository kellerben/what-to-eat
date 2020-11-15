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
		case "refreshOrders":
			fetchTodaysOrders();
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
		meal: null,
		specialRequest: '',
		orders: []
	},
	computed: {
		total(){
			return this.orders.reduce((total, product) => product.price + total  ,0);
		}
	},
	el: '#root'
});
// }}}

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
