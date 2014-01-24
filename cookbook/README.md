# Ripple RippleCharts Cookbook
A Chef Cookbook which installs and configures the Ripple Labs
Ripple Charts backend service.

## Canonical Repository
The canonical repository for this project is located at https://github.com/ripple/ripple-ripplecharts
in the subdirectory 'cookbook'.

## Testing

This cookbook includes support for running tests via Test Kitchen (> 1.0). This has some requirements.

1. You must be using the Git repository, rather than the downloaded cookbook from the Chef Community Site.
2. You must have Vagrant 1.1 installed.
3. You must have a "sane" Ruby 1.9.3 environment (if you're using RVM you're fine).

Once the above requirements are met, install the additional requirements:

Install the berkshelf plugin for vagrant, and berkshelf to your local Ruby environment.

    vagrant plugin install vagrant-berkshelf
    gem install berkshelf

Install Test Kitchen 1.0 (unreleased yet, use the alpha / prerelease version).

    gem install test-kitchen --pre

Install the Vagrant driver for Test Kitchen.

    gem install kitchen-vagrant

Once the above are installed, you should be able to run Test Kitchen:

    kitchen list
    kitchen test

If you experience authentication related issues please make sure the following configuration
changes are in place:

Add the following to ~/.ssh/config:

Host 127.0.0.1 localhost
  IdentitiesOnly yes
  ForwardAgent yes

If you get ssh authentication errors on cloning the git repository please make sure your
ssh key is available to ssh agent by executing the following:

ssh-add <key>

If you do not want kitchen to destroy the VM after running "kitchen test" use the following command-line
switch:

kitchen test --destroy=never
