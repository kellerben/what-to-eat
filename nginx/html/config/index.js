new Vue({
	data: {
		community: localStorage.community,
		userId: localStorage.userId
	},
	methods: {
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
		}
	},
	computed: {
		communityState() {
			return (typeof(this.community) != "undefined" && this.community != "")
		}
	},
	mounted() {
		this.getCommunityFromHash();
		window.addEventListener('hashchange', this.getCommunityFromHash);
		if (typeof(this.community) != "undefined" && this.community != "") {
			document.location.hash = "in=" + this.community;
		}
	},
	el: '#root'
});
