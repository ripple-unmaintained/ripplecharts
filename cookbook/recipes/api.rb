include_recipe 'ripple-ripplecharts::default'

configuration = node['ripple']['ripplecharts']['api']['app']
database_configuration = configuration['db']

application "ripple-ripplecharts-api" do
  path "/srv/ripple-ripplecharts-api"
  owner "www-data"
  group "www-data"

  packages ['git']

  repository 'git://github.com/ripple/ripplecharts.git'
  revision 'v2.0' # head of v2.0 branch

  nodejs do
    npm 'api'
    entry_point "node_modules/ripplecharts-api/app.js"
  end

  before_deploy do

    file "/srv/ripple-ripplecharts-api/shared/apiConfig.json" do
      owner 'root'
      group 'www-data'
      mode "0640" # owner read/write, group read, world none
      content({
        :port => configuration['port'],
        :couchdb => {
          :username => database_configuration['username'],
          :password => database_configuration['password'],
          :host => database_configuration['host'],
          :port => database_configuration['port'],
          :database => database_configuration['database_name']
        }
      }.to_json)
    end

  end

  symlinks({
    "apiConfig.json" => "node_modules/ripplecharts-api/apiConfig.json"
  })
end
