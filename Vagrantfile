# -*- mode: ruby -*-
# vi: set ft=ruby noexpandtab :

Vagrant.configure("2") do |config|
	config.vm.define "lunch"
	config.vm.hostname = "lunch"
	config.vm.box = "bento/debian-12"
	ENV['LC_ALL']="en_US.UTF-8"

	config.vm.network "forwarded_port", guest: 80, host_ip: "127.0.0.1", host: 8080
	config.vm.network "forwarded_port", guest: 443, host_ip: "127.0.0.1", host: 8443
	config.vm.network "forwarded_port", guest: 8080, host_ip: "127.0.0.1", host: 8888
	config.vm.network "forwarded_port", guest: 3306, host_ip: "127.0.0.1", host: 3306

	config.vm.provision "shell", inline: <<~SHELL
		cd /vagrant
		./bin/init
	SHELL

	# dev only
	config.vm.provision "shell", inline: <<~SHELL
		apt-get install -y ntp make

		adduser vagrant docker

		echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
		mkdir -p /etc/apt/keyrings/
		curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
		apt-get update
		apt-get install -y npm
		npm install -g eslint prettier
	SHELL

	# restart rsyslog in development after /vagrant mount
	config.vm.provision "shell", run: "always", inline: <<~SHELL
		systemctl restart rsyslog
	SHELL

	config.vm.provision "shell", run: "always", inline: <<~SHELL
		cd /vagrant
		make
	SHELL
end
