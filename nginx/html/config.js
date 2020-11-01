const vueapp = Vue.createApp({
	data() {
		return {
			userId: localStorage.userId
		}
	},
	methods: {
		changeUserId: function(event) {
			localStorage.userId = this.userId;
		}
	}
}).mount('#root')
