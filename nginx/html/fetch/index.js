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
	connection = new WebSocket(
		prot+location.hostname+":"+location.port+"/ws/", "json"
	);
	connection.onopen = () => {
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
		case "refreshPrices":
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
		prices: [],
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
	watch: {
		orders: function() {
			this.orders.forEach(o => {
				lunch.then(
					client => client.apis.Shop.getShopData({
						community: vueapp.community, shopId: o.shop
					})
				).then(
					result => vueapp.updateShopLabel(JSON.parse(result.text))
				);
			});
		},
	},
	methods: {
		updateShopLabel(shopDetails){
			this.orders.forEach(o => {
				if (o.shop == shopDetails.shop) {
					o.label = o.shop
					if (shopDetails.phone) {
						var number = shopDetails.phone.replace(/[^+0-9 ()-]/g,"");
						var URInumber = number.replace(/[() ]/g,"-");
						o.label += ` (<a href='tel:${encodeURI(URInumber)}'>${number}</a>)`
						o.html = true
					}
					o.label += `, total: ${o.totalPrice} ct`
				}
			});
		},
		getCommunityFromHash() {
			var u = new URLSearchParams(document.location.hash.substr(1));
			if (u.has("in")) {
				this.community = u.get("in");
				localStorage.community = this.community;
			}
		},
		updatePrice(event) {
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
		vueapp.prices = [];
		orders.forEach(elem => {
			if (elem.state != 'DISCARDED') {
				vueapp.prices.push(elem);
				if (typeof(o[elem.shop]) == 'undefined') {
					o[elem.shop] = {
						totalPrice: elem.price,
						mode: 'span',
						label: elem.shop,
						shop: elem.shop,
						html: false,
						children: [ elem ]
					}
				} else {
					o[elem.shop].children.push(elem);
					o[elem.shop].totalPrice += elem.price;
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
