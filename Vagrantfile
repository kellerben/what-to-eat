# -*- mode: ruby -*-
# vi: set ft=ruby noexpandtab :

Vagrant.configure("2") do |config|
	config.vm.define "lunch"
	config.vm.hostname = "lunch"
	config.vm.box = "bento/debian-10"
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
		apt-get install -y python-pip
		pip install watchntouch
	SHELL

	config.vm.provision "shell", run: "always", inline: <<~SHELL
		# restart rsyslog in development after /vagrant mount
		systemctl restart rsyslog

		cd /vagrant
		./bin/update dev

		sudo -u vagrant tmux new-session -d 'watchntouch -w /vagrant/nodejs'
	SHELL
end
