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
Vue.use(VueMarkdown);
Vue.component('l-map', window.Vue2Leaflet.LMap);
Vue.component('l-tile-layer', window.Vue2Leaflet.LTileLayer);
Vue.component('l-marker', window.Vue2Leaflet.LMarker);
Vue.component('l-icon', window.Vue2Leaflet.LIcon);
Vue.component('l-tooltip', window.Vue2Leaflet.LTooltip);
Vue.component('l-popup', window.Vue2Leaflet.LPopup);
Vue.component('l-icon', window.Vue2Leaflet.LIcon);
const vueapp = new Vue({
	data: {
		community: localStorage.community,
		communityLatLng: {},
		alertMsg: '',
		alertClass: '',
		alertType: '',
		showAlertTime: 0,
		editShop: {},
		shops: {},
		shopsBackup: {},
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
		anchorAttrs: {
			target: '_blank',
			rel: 'noopener noreferrer nofollow'
		},
		shopMapCenter: {},
		searchMarker: { position: {} },
		mapSearchAddress: '',
		paginationOptions: {
			setCurrentPage: 2,
			enabled: true,
			perPage: 5,
			perPageDropdown: [5, 10, 15, 20, 25],
			position: 'top'
		}
	},
	watch: {
		shops: function(){
			this.shopAry = Object.values(this.shops)
		},
		mapSearchAddress() {
			this.searchAddress(this.mapSearchAddress)
		}
	},
	methods: {
		searchAddress(address){
			fetch(
				`https://nominatim.openstreetmap.org/search.php?q=${address}&polygon_geojson=1&format=jsonv2`
			).then(result => result.json())
				.then(data => {
					if (data.length > 0) {
						var position = { lat: data[0].lat, lng: data[0].lon };
						this.searchMarker.position = position;
						this.shopMapCenter = position;
						this.searchMarker.tooltip = address;
						if (typeof(this.editShop.shop) == "undefined") {
							this.searchMarker.actionText = "Update community location"
						} else {
							this.searchMarker.actionText = "Update shop location"
						}
					}
				})
		},
		clickMap(e){
			this.searchMarker.position = e.latlng
			fetch(
				`https://nominatim.openstreetmap.org/reverse.php?lat=${this.searchMarker.position.lat}&lon=${this.searchMarker.position.lng}&format=jsonv2`
			).then(result => result.json())
				.then(data => {
					this.searchMarker.tooltip = data.display_name;
					if (typeof(this.editShop.shop) == "undefined") {
						this.searchMarker.actionText = "Update community location"
					} else {
						this.searchMarker.actionText = "Update shop location"
					}
				})
		},
		getFootDistance(e) {
			var to = this.shops[e.target.dataset.shop].position;
			fetch(
				`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${this.communityLatLng.lng},${this.communityLatLng.lat};${to.lng},${to.lat}`
			).then(result => result.json())
				.then(data => {
					this.shops[e.target.dataset.shop].distance = Math.round(
						data.routes[0].distance
					);
				})
		},
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
		showShop(e) {
			let shop = this.shops[e.target.dataset.shop]
			if (shop.position.lat && shop.position.lng) {
				this.shopMapCenter = shop.position
			} else {
				this.shopMapCenter = this.communityLatLng
			}
		},
		editShopFunc(e) {
			this.shopsBackup = Object.assign({}, this.shops);
			this.editShop = this.shops[e.target.dataset.shop];
			this.editShop.draggable = true;
			if (this.editShop.position.lat && this.editShop.position.lng) {
				this.shopMapCenter = this.editShop.position;
			}
			this.shops = {}
			this.shops[this.editShop.shop] = this.editShop;
		},
		cancelEdit(e) {
			this.shops = Object.assign({}, this.shopsBackup);
			this.shops[this.editShop.shop].draggable = false;
			this.editShop = {};
		},
		confirmEdit(e) {
			var postBody = {};
			if(this.editShop.distance != "") {
				postBody.distance = this.editShop.distance
			}
			if(this.editShop.phone != "") {
				postBody.phone = this.editShop.phone
			}
			if(this.editShop.comment != "") {
				postBody.comment = this.editShop.comment
			}
			if(this.editShop.lat != "") {
				postBody.lat = this.editShop.position.lat
			}
			if(this.editShop.lng != "") {
				postBody.lng = this.editShop.position.lng
			}
			lunch.then(client => {
				client.apis.Shop.setShopData(
					{ community: this.community, shopId: this.editShop.shop },
					{ requestBody: postBody }
				)
				this.shops = Object.assign({}, this.shopsBackup);
			}).then(
				result => this.cancelEdit(),
				reason => this.error('Could not edit the shop data.')
			);
		},
		getCommunityFromHash() {
			var u = new URLSearchParams(document.location.hash.substr(1));
			if (u.has("in")) {
				this.community = u.get("in");
				localStorage.community = this.community;
			}
		},
		setLatLon(){
			var pos = {
				lat: this.searchMarker.position.lat,
				lng: this.searchMarker.position.lng
			}
			if (typeof(this.editShop.shop) == "undefined") {
				lunch.then(
					client => client.apis.Community.setCommunityInformation({
						community: this.community
					}, { requestBody:  pos }).then(
						result => {
							this.mapSearchAddress = ''
							this.communityLatLng = pos;
							this.searchMarker.position = {}
						},
						error => {
							this.error('Could not update the communities address');
						}
					)
				);
			} else {
				this.shops[this.editShop.shop].position = pos
				this.editShop.position = pos
				this.searchMarker.position = {}
				this.mapSearchAddress = ''
				this.searchMarker.actionText = ''
			}
		},
		getCommunityInformation(){
			lunch.then(
				client => client.apis.Community.getCommunityInformation({
					community: this.community
				}).then(
					result => {
						if (result && result.obj.lng && result.obj.lat) {
							var pos = { lat: result.obj.lat, lng: result.obj.lng };
							this.communityLatLng = pos;
							this.shopMapCenter = pos;
						}
					},
					error => {
						this.warning('The community\'s location was not found.');
					}
				)
			);
		},
		init() {
			this.getCommunityFromHash();
			if (typeof(this.community) == "undefined" || this.community == "") {
				document.location = '/config/'
			} else {
				updateShops();
				this.getCommunityInformation();
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
function updateShops() {
	function setShops(shops){
		function setShopDetails(shop, details) {
			if (Object.keys(details).length == 0){
				vueapp.shops[shop] = {
					shop: shop,
					position: {}
				};
			} else {
				var pos = { lat: details.lat, lng: details.lng };
				details.position = pos;
				vueapp.shops[shop] = details;
				vueapp.shops[shop].draggable = false;
			}
			vueapp.shopAry = Object.values(vueapp.shops)
		}
		vueapp.shops = {};
		shops.forEach(function(elem){
			//vueapp.shops.push({shop: elem});
			lunch.then(
				client => client.apis.Shop.getShopData(
					{ community: vueapp.community, shopId: elem }
				)
			).then(
				result => setShopDetails(elem, JSON.parse(result.text)),
				reason => vueapp.warning(
					'Could not fetch available shops. ('+reason+')'
				)
			);
		});
	}
	lunch.then(
		client => client.apis.Shop.getShops({ community: vueapp.community })
	).then(
		result => setShops(JSON.parse(result.text)),
		reason => vueapp.warning('Could not fetch available shops. ('+reason+')')
	);
}
// }}}
