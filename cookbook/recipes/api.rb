application "ripple-ripplecharts-api" do
  path "/srv/ripple-ripplecharts-api"
  owner "www-data"
  group "www-data"

  packages ['git']

  repository 'git://github.com/ripple/ripplecharts.git'
  revision 'v2.0' # head of v2.0

  nodejs do
    npm 'api'
    entry_point "node_modules/ripplecharts-api/app.js"
  end
end
