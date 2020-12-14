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
		case "getShopSuggestions":
			updateShops();
			break;
		case "getShopAnnouncements":
			updateShops();
			break;
		case "refreshOrders":
			updateShops();
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
		alertMsg: '',
		alertClass: '',
		alertType: '',
		showAlertTime: 0,
		edit: {},
		shops: {},
		shopAry: [],
		shopHeader: [
			{
				label: 'Food Store',
				field: 'shop',
			},
			{
				label: 'Distance',
				field: 'distance',
				type: 'number'
			},
			{
				label: 'Phone',
				field: 'phone',
			},
			{
				label: 'Comment',
				field: 'comment',
			},
			{
				label: 'Action',
				field: 'action'
			}
		],
	},
	watch: {
		shops: function(){
			this.shopAry = Object.values(this.shops)
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
		/*proposeShop(e) {
			var shop = e.target.dataset.shop;
		},*/
		editShop(e) {
			this.edit = Object.assign({}, this.shops[e.target.dataset.shop]);
		},
		cancelEdit(e) {
			this.edit = {};
		},
		confirmEdit(e) {
			var postBody = {};
			if(this.edit.distance != "") { postBody.distance = this.edit.distance }
			if(this.edit.phone != "") { postBody.phone = this.edit.phone }
			if(this.edit.comment != "") { postBody.comment = this.edit.comment }
			lunch.then(
				client => client.apis.Shop.setShopData({ shopId: this.edit.shop }, { requestBody: postBody })
			).then(
				result => this.cancelEdit(),
				reason => this.error('Could not edit the shop data. (' + reason.response.body.error + ')')
			);
		}
	},
	el: '#root'
});
// }}}


// current orders {{{
function updateShops() {
	function setShops(shops){
		function setShopDetails(shop, details) {
			if (Object.keys(details).length == 0){
				vueapp.shops[shop] = { shop: shop };
			} else {
				vueapp.shops[shop] = details;
			}
			vueapp.shopAry = Object.values(vueapp.shops)
		}
		vueapp.shops = {};
		shops.forEach(function(elem){
			//vueapp.shops.push({shop: elem});
			lunch.then(
				client => client.apis.Shop.getShopData({ shopId: elem })
			).then(
				result => setShopDetails(elem, JSON.parse(result.text)),
				reason => vueapp.warning('Could not fetch available shops. ('+reason+')')
			);
		});
	}
	lunch.then(
		client => client.apis.Shop.getShops()
	).then(
		result => setShops(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch available shops. ('+reason+')')
	);
}
updateShops();
// }}}

