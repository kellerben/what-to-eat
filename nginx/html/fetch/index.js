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
			fetchTodaysOrders();
			break;
	}
}
renewconnection();
//}}}

// vue {{{
Vue.use(window['vue-good-table'].default);
const vueapp = new Vue({
	data: {
		meal: null,
		specialRequest: '',
		community: localStorage.community,
		orders: [],
		header: [
			{
				label: 'Name',
				field: 'user',
			},
			{
				label: 'Shop',
				field: 'shop',
				hidden: true,
			},
			{
				label: 'Meal',
				field: 'meal',
			},
			{
				label: 'Special Request',
				field: 'specialRequest'
			},
			{
				label: 'Price',
				field: 'price',
				type: 'number',
				formatFn: (value) => value == null ? '' : value+" ct"
			}
		],
		sortOpts: {
			initialSortBy: [
				{field: 'shop'},
				{field: 'meal'}
			]
		}
	},
	computed: {
		total(){
			return this.orders.reduce((total, product) => product.price + total  ,0);
		}
	},
	methods: {
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
				fetchTodaysOrders();
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

// current orders {{{
function fetchTodaysOrders() {
	function updateOrders(orders){
		var o = {};
		orders.forEach(function(elem){
			if (elem.state != 'DISCARDED') {
				if (typeof(o[elem.shop]) == 'undefined') {
					o[elem.shop] = {
						mode: 'span',
						label: elem.shop,
						html: false,
						children: [ elem ]
					}
				} else {
					o[elem.shop].children.push(elem);
				}
			}
		});
		vueapp.orders = [];
		for (const key in o) {
			vueapp.orders.push(o[key]);
		}
	}
	lunch.then(
		client => client.apis.Order.getOrdersOfDay({ community: vueapp.community })
	).then(
		result => updateOrders(JSON.parse(result.text).rows)
	);
}
// }}}
