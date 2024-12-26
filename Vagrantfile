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

		apt-get install -y jsbeautifier
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
