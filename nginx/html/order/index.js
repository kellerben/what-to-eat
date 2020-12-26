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
			vueapp.fetchSuggestions();
			vueapp.updateShopSuggestions();
			vueapp.updateFoodSuggestions();
			break;
		case "refreshOrders":
			vueapp.fetchTodaysOrders();
			if (vueapp.shopId != ''){
				vueapp.updateFoodSuggestions();
			}
			break;
	}
}
renewconnection();
//}}}

// vue {{{
const vueapp = new Vue({
	data: {
		alertMsg: '',
		alertClass: '',
		alertType: '',
		showAlertTime: 0,
		community: localStorage.community,
		userId: localStorage.userId,
		suggestions: [],
		meal: null,
		specialRequest: '',
		specialRequestOptions: [],
		shopId: '',
		shopOptions: [],
		foodOptions: [],
		meals: {},
		price: '',
		orders: []
	},
	computed: {
		total(){
			return this.orders.reduce((total, product) => product.price + total  ,0);
		}
	},
	methods: {
		warning(string) {//{{{ alerts
			this.showAlert(string, 'warning');
		},
		error(string) {
			this.showAlert(string, 'error');
		},
		info(string) {
			this.showAlert(string, 'info');
		},
		showAlert(string, type) {
			this.alertClass = type == 'error' ? 'danger' : type;
			this.alertType = type[0].toUpperCase() + type.slice(1);
			this.alertMsg = string;
			this.showAlertTime = 10;
		},//}}}

		setShopOptions(o){// {{{ auto-suggestions
			this.shopOptions = o;
		},
		updateShopSuggestions() {
			lunch.then(
				client => client.apis.Shop.getShops({ community: this.community })
			).then(
				result => this.setShopOptions(JSON.parse(result.text)),
				reason => this.warning('Could not fetch Shop suggestions. (' + reason + ')')
			);
		},
		setFoodSuggestions(meals){
			var f = [];
			var mealobj = {};
			meals.forEach(function(m){
				f.push(m.meal);
				mealobj[m.meal] = m.price;
			});
			this.foodOptions = f;
			this.meals = mealobj;
		},
		setSpecialRequestOptions(sr){
			this.specialRequestOptions = sr;
		},
		updateFoodSuggestions() {
			if (this.shopId != "") {
				lunch.then(
					client => client.apis.Shop.getMenu({ community: this.community, shopId: this.shopId })
				).then(
					result => this.setFoodSuggestions(JSON.parse(result.text)),
					reason => this.warning('Could not fetch the shop\'s menu. (' + reason + ')')
				);
				lunch.then(
					client => client.apis.Shop.getSpecialRequests({ community: this.community, shopId: this.shopId })
				).then(
					result => this.setSpecialRequestOptions(JSON.parse(result.text)),
					reason => this.warning('Could not fetch special request suggestions. (' + reason + ')')
				);
			}
		},//}}}

		deleteSuggestion: function (event) {//{{{ server interaction methods
			lunch.then(
				client => client.apis.Fetch.deleteShopAnnouncement({}, {
					requestBody: {
						userId: event.target.dataset["user"],
						community: this.community,
						shopId: event.target.dataset["shop"]
					}
				})
			).then(
				result => null,
				reason => this.error('Could not delete the suggestion. (' + reason.response.body.error + ')')
			);
		},
		deleteOrder: function (event) {
			lunch.then(
				client => client.apis.Order.updateOrder({ }, {
					requestBody: {
						community: this.community,
						shopId: event.target.dataset["shop"],
						userId: event.target.dataset["user"],
						meal: event.target.dataset["meal"],
						state: 'DISCARDED'
					}
				})
			).then(
				result => null,
				reason => this.error('Could not delete the order. (' + reason.response.body.error + ')')
			);
		},
		announceShop: function (event) {
			if (this.userId === "" || this.shopId === "") {
				return;
			}
			lunch.then(
				client => client.apis.Fetch.announceShop({}, { requestBody: { community: this.community, userId: this.userId, shopId: this.shopId } })
			).then(
				result => null,
				reason => this.error('Could not send the suggestion. (' + reason.response.body.error + ')')
			);
		},
		orderLunch: function (event) {
			if (this.userId === "" || this.shopId === '' || this.meal === null) {
				return;
			}
			var order = { userId: this.userId, community: this.community, shopId: this.shopId, meal: this.meal, specialRequest: this.specialRequest};
			if (this.price !== "" && typeof this.price != "undefined") {
				order.price = this.price;
				lunch.then(client => client.apis.Shop.setPrice(order));
			}
			lunch.then(
				client => client.apis.Order.orderLunch({}, {
					requestBody: order
				})
			).then(
				result => function(){
					this.price = "";
					this.meal = "";
					this.specialRequest = "";
				}(),
				reason => this.error('Could not place the order. (' + reason.response.body.error + ')')
			);
		},
		// current Suggestions {{{
		updateSuggestions(suggestions){
			this.suggestions = suggestions;
			if (suggestions.length == 1 && this.shopId == '') {
				this.shopId = suggestions[0].shop;
				this.updateFoodSuggestions(this.shopId);
			}
		},
		fetchSuggestions() {

			lunch.then(
				client => client.apis.Fetch.getShopAnnouncements({ community: this.community })
			).then(
				result => this.updateSuggestions(JSON.parse(result.text).rows),
				reason => this.warning('Could not fetch today\'s suggestions. ('+reason+')')
			);
		},
		//}}}

		updateOrders(orders){
			this.orders = orders;
		},
		fetchTodaysOrders() {// current orders {{{
			lunch.then(
				client => client.apis.Order.getOrdersOfDay({ community: this.community })
			).then(
				result => this.updateOrders(JSON.parse(result.text).rows),
				reason => this.warning('Could not fetch today\'s orders. ('+reason+')')
			);
		},// }}}
		// }}}

		selectFood() {
			this.price = this.meals[this.meal];
		},

		userId2LocalStorage() {
			if ((typeof localStorage.userId == "undefined" || localStorage.userId == "") && typeof this.userId != "undefined" && this.userId != "") {
				localStorage.userId = this.userId;
				this.info('User id (' + this.userId+ ') was stored for later usage. This can be changed in the config-tab…')
			}
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
				this.fetchSuggestions();
				this.fetchTodaysOrders();
				this.updateShopSuggestions();
			}
		}
	},
	mounted() {
		this.init();
		document.location.hash = "in=" + this.community;
		window.addEventListener('hashchange', this.init);
	},
	el: '#root'
});
// }}}
