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
Vue.use(VueMarkdown);
const vueapp = new Vue({
	data: {
		community: localStorage.community,
		userId: localStorage.userId,
		payments: [],
		searchTerm: "",
		paymentPool: {},
		paymentInstructions: { },
		anchorAttrs: {
			target: '_blank',
			rel: 'noopener noreferrer nofollow'
		},
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
	watch: {
		payments: function() {
			this.updatePaymentPool()
		},
		searchTerm: function() {
			this.updatePaymentPool()
		}
	},
	methods: {
		setSearchTerm(p) {
			this.searchTerm = p.searchTerm
		},
		updatePaymentPool: function () {
			this.paymentPool = {}
			this.payments.forEach(p => {
				if (p.price) {
					if (
						this.searchTerm === "" ||
						this.filterUsernameTable(p,{},"",this.searchTerm)
					) {
						if (!this.paymentPool[p.from_user]) {
							this.paymentPool[p.from_user] = 0
						}
						if (!this.paymentPool[p.to_user]) {
							this.paymentPool[p.to_user] = 0
						}
						this.paymentPool[p.from_user] += p.price
						this.paymentPool[p.to_user] -= p.price
					}
				}
			})
		},
		getOpenPayments: function (event) {
			lunch.then(
				client => client.apis.Payments.getPayments({
					community: this.community,
					states: ["NEW","FETCHED"]
				})
			).then(
				result => function(){
					var p = JSON.parse(result.text).rows;
					var today = new Date().toISOString().substring(0,10);
					var prices = [];
					var seen = {};
					var payment_receivers = new Set();
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
						payment_receivers.add(elem.to_user);
					});
					vueapp.payments = p;
					vueapp.prices = prices;
					payment_receivers.forEach(function(user){
						vueapp.getPaymentInstructions(user);
					});
				}()
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
		getCommunityFromHash() {
			var u = new URLSearchParams(document.location.hash.substr(1));
			if (u.has("in")) {
				this.community = u.get("in");
				localStorage.community = this.community;
			}
		},
		transformPaymentInstruction(instruction,payment) {
			var val = instruction;
			[
				["price",payment.price/100],
				["from",payment.from_user],
				["day",payment.day],
				["shop",payment.shop],
				["meal",payment.meal]
			].forEach(function([k,v]){
				val = val.replaceAll("{"+k+"}",v);
				val = val.replaceAll("{"+k+":uri}",encodeURI(v));
			});
			return val;
		},
		parseGetPaymentInstructionsResult(userId, instructions) {
			var n = {};
			n[userId] = instructions.paymentInstructions;
			this.paymentInstructions = Object.assign({}, this.paymentInstructions, n) ;
		},
		getPaymentInstructions(userId){
			if (userId) {
				lunch.then(
					client => client.apis.User.getPaymentInstructions({
						community: this.community, userId: userId
					})
				).then(
					result => this.parseGetPaymentInstructionsResult(
						userId,
						JSON.parse(result.text)
					),
					reason => this.error(
						'Could not get payment instructions (' +
						reason.response.body.error + ')'
					)
				);
			}
		},
		filterUsernameTable(row, col, cellValue, searchTerm){
			let searches = searchTerm.split(" ").map(
				value => value.toLowerCase()
			)
			if (searches.length === 1) {
				// match if either from or to matches the searchterm
				return searches.includes(row.from_user.toLowerCase()) ||
					searches.includes(row.to_user.toLowerCase())
			} else {
				// match if searches are in from && to
				return searches.includes(row.from_user.toLowerCase()) &&
					searches.includes(row.to_user.toLowerCase())
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
