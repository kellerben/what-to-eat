const vueapp = new Vue({
	data: {
			userId: localStorage.userId
	},
	methods: {
		changeUserId: function(event) {
			localStorage.userId = this.userId;
		}
	},
	el: '#root'
});
