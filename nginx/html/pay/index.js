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
const vueapp = new Vue({
	data: {
		community: localStorage.community,
		userId: localStorage.userId,
		payments: [],
		header: [
			{
				label: 'From',
				field: 'from_user',
			},
			{
				label: 'To',
				field: 'to_user',
			},
			{
				label: 'Price',
				field: 'price',
				type: 'number',
				formatFn: (value) => value == null ? '' : value+" ct"
			},
			{
				label: 'Food Store',
				field: 'shop',
			},
			{
				label: 'Meal',
				field: 'meal',
			},
			{
				label: 'Day',
				field: 'day',
				type: 'date',
				dateInputFormat: 'yyyy-MM-dd',
				dateOutputFormat: 'do MMM',
			},
			{
				label: 'Action',
				field: 'button'
			}
		],
		sortOpts: {
			initialSortBy: [
				{field: 'to_user'},
				{field: 'from_user'},
				{field: 'meal'}
			]
		},
		prices: []
	},
	methods: {
		getOpenPayments: function (event) {
			lunch.then(
				client => client.apis.Payments.getOpenPayments({ community: this.community })
			).then(
				result => function(){
					var p = JSON.parse(result.text).rows;
					var today = new Date().toISOString().substring(0,10);
					var prices = [];
					var seen = {};
					p.forEach(function(elem){
						elem.day = elem.day.substring(0,10);
						var n = {
							day: elem.day,
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
					vueapp.payments = p;
					vueapp.prices = prices;
				}()
			)
		},
		deleteOrder: function (event) {
			lunch.then(
				client => client.apis.Order.deleteOrder({ }, {
					requestBody: {
						community: this.community,
						shopId: event.target.dataset["shop"],
						userId: event.target.dataset["user"],
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
				client => client.apis.Shop.setPrice({
					community: this.community,
					shopId: elem.shop,
					meal: elem.meal,
					price: elem.price
				})
			)
		}
	},
	mounted() {
		if (typeof(this.community) == "undefined" || this.community == "") {
			document.location = '/config/'
		} else {
			this.getOpenPayments();
		}
	},
	el: '#root'
});
// }}}
