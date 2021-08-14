var lunch = new SwaggerClient('/openapi.json');
Vue.use(VueMarkdown);
new Vue({
	data: {
		community: localStorage.community,
		alertMsg: '',
		alertClass: '',
		alertType: '',
		showAlertTime: 0,
		userId: localStorage.userId,
		paymentInstructions: '',
		paymentInstructionsSample: '',
		anchorAttrs: {
			target: '_blank',
			rel: 'noopener noreferrer nofollow'
		}
	},
	watch: {
		userId: function() {
			this.getPaymentInstructions()
		},
		paymentInstructions: function() {
			var val = this.paymentInstructions;
			[
				["price","5.50"],
				["from","Peter"],
				["day","1970-01-01"],
				["shop","Eva's Pizza"],
				["meal","Pizza Quattro Formaggi"]
			].forEach(([k,v]) => {
				val = val.replaceAll("{"+k+"}",v);
				val = val.replaceAll("{"+k+":uri}",encodeURI(v));
			});
			this.paymentInstructionsSample = val;
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
		changeUserId(event) {
			localStorage.userId = this.userId;
		},
		changeCommunity(event) {
			localStorage.community = this.community;
			document.location.hash = "in=" + this.community;
		},
		getCommunityFromHash() {
			var u = new URLSearchParams(document.location.hash.substr(1));
			if (u.has("in") && u.get("in") != "") {
				this.community = u.get("in");
				this.changeCommunity();
			}
		},
		parseGetPaymentInstructionsResult(instructions) {
			this.paymentInstructions = instructions.paymentInstructions;
		},
		getPaymentInstructions(){
			if (this.userId) {
				lunch.then(
					client => client.apis.User.getPaymentInstructions({
						community: this.community, userId: this.userId
					})
				).then(
					result => this.parseGetPaymentInstructionsResult(
						JSON.parse(result.text)
					),
					reason => this.error(
						'Could not get payment instructions (' +
						reason.response.body.message +
						')'
					)
				);
			}
		},
		setPaymentInstructions(){
			lunch.then(
				client => client.apis.User.setPaymentInstructions({
					community: this.community, userId: this.userId
				}, {
					requestBody: { paymentInstructions: this.paymentInstructions }
				}).then(
					result => {},
					reason => this.error(
						'Could not set payment instructions (' +
						reason.response.body.message +
						')')
				)
			);
		}
	},
	computed: {
		communityState() {
			return (typeof(this.community) != "undefined" && this.community != "")
		}
	},
	mounted() {
		this.getCommunityFromHash();
		this.getPaymentInstructions();
		window.addEventListener('hashchange', this.getCommunityFromHash);
		if (typeof(this.community) != "undefined" && this.community != "") {
			document.location.hash = "in=" + this.community;
		}
	},
	el: '#root'
});
