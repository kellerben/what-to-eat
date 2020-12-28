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
	connection.onopen = function() {
		connection.send(JSON.stringify({'community':vueapp.community}));
	}
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
				label: 'State',
				field: 'state',
				hidden: true,
				sortFn: function (x,y) {
					var sortary = ['NEW', 'FETCHED', 'PAYED', 'DISCARDED'];
					var a = sortary.indexOf(x);
					var b = sortary.indexOf(y);
					return (a < b ? -1 : (a > b ? 1 : 0));
				},
			},
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
			}
		],
		sortOpts: {
			initialSortBy: [
				{field: 'state'},
				{field: 'day'},
			]
		},
		prices: []
	},
	methods: {
		parsePaymentLog(log) {
			var o = {};
			log.forEach(function(elem){
				elem.day = elem.day.substring(0,10);
				if (typeof(o[elem.state]) == 'undefined') {
					var label;
					switch(elem.state) {//['NEW', 'FETCHED', 'PAYED', 'DISCARDED']
						case 'NEW':
							label = 'New and unpaid orders';
							break;
						case 'FETCHED':
							label = 'Fetched but unpaid orders';
							break;
						case 'PAYED':
							label = 'Payed orders';
							break;
						case 'DISCARDED':
							label = 'Discarded orders';
							break;
						default:
							label = 'error'
					}
					o[elem.state] = {
						mode: 'span',
						label: label,
						html: false,
						children: [ elem ]
					}
				} else {
					o[elem.state].children.push(elem);
				}
			});
			this.payments = [];
			for (const key in o) {
				this.payments.push(o[key]);
			}
		},
		getOpenPayments: function (event) {
			lunch.then(
				client => client.apis.Payments.getPayments({ community: this.community, from: this.userId, to: this.userId })
			).then(
				result => this.parsePaymentLog(JSON.parse(result.text).rows)
			)
		},
		setOrderFetched: function (event) {
			lunch.then(
				client => client.apis.Order.updateOrder({ }, {
					requestBody: {
						community: this.community,
						shopId: event.target.dataset["shop"],
						userId: event.target.dataset["user"],
						meal: event.target.dataset["meal"],
						date: event.target.dataset["day"],
						state: 'FETCHED'
					}
				})
			)
		},
		setOrderPayed: function (event) {
			lunch.then(
				client => client.apis.Order.updateOrder({ }, {
					requestBody: {
						community: this.community,
						shopId: event.target.dataset["shop"],
						userId: event.target.dataset["user"],
						meal: event.target.dataset["meal"],
						date: event.target.dataset["day"],
						state: 'PAYED'
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
				this.getOpenPayments();
			}
		}
	},
	mounted() {
		this.init();
		if (typeof(this.community) != "undefined" && this.community != "") {
			document.location.hash = "in=" + this.community;
		}
		window.addEventListener('hashchange', this.init);
	},
	el: '#root'
});
// }}}
