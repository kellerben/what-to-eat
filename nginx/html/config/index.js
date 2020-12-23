new Vue({
	data: {
		community: localStorage.community,
		userId: localStorage.userId
	},
	methods: {
		changeUserId: function(event) {
			localStorage.userId = this.userId;
		},
		changeCommunity: function(event) {
			localStorage.community = this.community;
		}
	},
	el: '#root'
});
