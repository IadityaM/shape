pkill -F tmp/pids/test.pid
CYPRESS=true bin/rails server -d -e test -p 3001 -P tmp/pids/test.pid
yarn cypress
