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
		alertMsg: '',
		alertClass: '',
		alertType: '',
		showAlertTime: 0,
		payments: [],
		searchTerm: localStorage.userId.toLowerCase(),
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
				dateOutputFormat: 'do MMM yy',
			},
			{
				label: 'Action',
				field: 'button'
			}
		],
		sortOpts: {
			initialSortBy: [
				{field: 'day'}
			]
		},
		prices: []
	},
	watch: {
		payments: function() {
			this.updatePaymentPool()
		},
		searchTerm: function() {
			this.updatePaymentPool();
			this.updateLocation();
		}
	},
	methods: {
		warning(string) {
			this.showAlert(string, 'warning');
		},
		error(string) {
			this.showAlert(string, 'error');
		},
		showAlert(string, type) {
			this.alertClass = type == 'error' ? 'danger' : type;
			this.alertType = type[0].toUpperCase() + type.slice(1);
			this.alertMsg = string;
			this.showAlertTime = 10;
		},
		getFilteredPayments() {
			return this.filterPayments(this.searchTerm, this.payments)
		},
		filterPayments(filter, allpayments) {
			let filteredpayments = [];
			allpayments.forEach(p => {
				if (
					this.filterUsernameTable(p,{},"",this.searchTerm)
				) {
					filteredpayments.push(p);
				}
			});
			return filteredpayments;
		},
		getPaymentPool(payments) {
			let paymentPool = {};
			payments.forEach(p => {
				if (p.price) {
					if (!paymentPool[p.from_user]) {
						paymentPool[p.from_user] = 0
					}
					if (!paymentPool[p.to_user]) {
						paymentPool[p.to_user] = 0
					}
					paymentPool[p.from_user] += p.price
					paymentPool[p.to_user] -= p.price
				}
			});
			return paymentPool;
		},
		updatePaymentPool() {
			this.paymentPool = this.getPaymentPool(this.getFilteredPayments());
		},
		// function to get <number> of elements combined in <array>
		getArrayCombinations(array, number) {
			let a = structuredClone(array);
			let ret = [];
			if (number === 1) {
				a.forEach((e) => {
					ret.push([e]);
				})
			} else {
				let a_length = a.length;
				for (let i = 0; i < a_length; i++) {
					let elem = a.shift();
					let remainder = this.getArrayCombinations(a, number - 1);
					for (let n = 0; n < remainder.length; n++) {
						ret.push([elem].concat(remainder[n]))
					}
				}
			}
			return ret;
		},
		findNullPayments(searchLength) {
			const result = []
			const currentCombo = this.getArrayCombinations(this.getFilteredPayments(), searchLength);
			currentCombo.forEach((c) => {
				const paymentPool = this.getPaymentPool(c);
				const isZero = Object.values(paymentPool).every(
					(balance) => balance === 0,
				) // Check if all balances are zero
				if (isZero) result.push(c) // Add valid combination to result
			});
			let searchUser = new Set;
			if (result[0]) {
				result[0].forEach((p) => {
					searchUser.add(p.from_user);
					searchUser.add(p.to_user);
				})
				console.log(searchUser)
			}
			return result
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
		setOrderPaid: function (event) {
			lunch.then(
				client => client.apis.Order.updateOrder({ }, {
					requestBody: {
						community: this.community,
						shopId: event.target.dataset["shop"],
						userId: event.target.dataset["user"],
						meal: event.target.dataset["meal"],
						date: event.target.dataset["day"],
						state: 'PAID'
					}
				})
			)
		},
		setOrderPaidEverything() {
			const filteredPayments = this.getFilteredPayments();
			filteredPayments.forEach(payment => {
				lunch.then(
					client => client.apis.Order.updateOrder({}, {
						requestBody: {
							community: this.community,
							shopId: payment.shop,
							userId: payment.from_user,
							meal: payment.meal,
							date: payment.day,
							state: 'PAID'
						}
					})
				).then(
					() => {}, // Success
					error => this.error(`Failed to update payment: ${payment.from_user} → ${payment.to_user} on ${payment.day}`)
				);
			});
			this.$root.$emit('bv::hide::tooltip', 'pay_all_button');
		},
		getSearchTermFromHash() {
			var u = new URLSearchParams(document.location.hash.substr(1));
			if (u.has("search")) {
				this.searchTerm = u.get("search");
			}
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

		/**
		 * Filters a table row based on the search term.
		 *
		 * @param {Object} row - The row object containing the payments.
		 * @param {number} col - Not used in this function.
		 * @param {string} cellValue - Not used in this function.
		 * @param {string} searchTerm - The search term which includes usernames.
		 * @returns {boolean} - Returns true if the row matches the search criteria, otherwise false.
		 */
		filterUsernameTable(row, col, cellValue, searchTerm) {
			// Split the search term into individual words and convert them to lowercase
			let searches = searchTerm.split(" ").map(
				value => value.toLowerCase()
			)

			if (searches.length === 1) {
				if (searches[0] === "") {
					// If the search term is empty, return true (no filtering)
					return true
				} else {
					// Match if either 'from_user' or 'to_user' matches the search term
					return searches.includes(row.from_user.toLowerCase()) ||
						searches.includes(row.to_user.toLowerCase())
				}
			} else {
				// Match if both 'from_user' and 'to_user' include the search terms
				return searches.includes(row.from_user.toLowerCase()) &&
					searches.includes(row.to_user.toLowerCase())
			}
		},
		updateValuesFromHash() {
			this.getSearchTermFromHash();
			let oldcommunity = localStorage.community;
			this.getCommunityFromHash();
			if (typeof(this.community) == "undefined" || this.community == "") {
				document.location = '/config/'
			} else {
				// check if we need to update the payment table
				if (oldcommunity != localStorage.community){
					this.getOpenPayments();
				}
			}
		},
		updateLocation() {
			document.location.hash = "in=" + this.community;
			if (typeof(this.searchTerm) != "undefined" && this.searchTerm != "") {
				document.location.hash += "&search=" + this.searchTerm;
			}
		}
	},
	mounted() {
		this.updateValuesFromHash();
		this.getOpenPayments();
		this.updateLocation();
		window.addEventListener('hashchange', this.updateValuesFromHash);
	},
	el: '#root'
});
// }}}
