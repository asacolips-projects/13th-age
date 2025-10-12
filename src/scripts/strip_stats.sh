printf "Cleaning YAML"
for f in $(find src/packs/src -iname "*.yml"); do
	printf "."
	if [[ "$OSTYPE" == "darwin"* ]]; then
		sed -E -i '' \
			 -e "/^ {0}_stats:/ {
				:a
				N
				/\n {0}_[^[:space:]]/!ba
				s/^ {0}_stats:.*\n(.* {0}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {2}_stats:/ {
				:b
				N
				/\n {2}_[^[:space:]]/!bb
				s/^ {2}_stats:.*\n(.* {2}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {4}_stats:/ {
				:c
				N
				/\n {4}_[^[:space:]]/!bc
				s/^ {4}_stats:.*\n(.* {4}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {6}_stats:/ {
				:d
				N
				/\n {6}_[^[:space:]]/!bd
				s/^ {6}_stats:.*\n(.* {6}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {8}_stats:/ {
				:e
				N
				/\n {8}_[^[:space:]]/!be
				s/^ {8}_stats:.*\n(.* {8}_[^[:space:]].*)/\1/
			}" \
			"$f"
	else
		sed -E -i \
			 -e "/^ {0}_stats:/ {
				:a
				N
				/\n {0}_[^[:space:]]/!ba
				s/^ {0}_stats:.*\n(.* {0}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {2}_stats:/ {
				:b
				N
				/\n {2}_[^[:space:]]/!bb
				s/^ {2}_stats:.*\n(.* {2}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {4}_stats:/ {
				:c
				N
				/\n {4}_[^[:space:]]/!bc
				s/^ {4}_stats:.*\n(.* {4}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {6}_stats:/ {
				:d
				N
				/\n {6}_[^[:space:]]/!bd
				s/^ {6}_stats:.*\n(.* {6}_[^[:space:]].*)/\1/
			}" \
			-e "/^ {8}_stats:/ {
				:e
				N
				/\n {8}_[^[:space:]]/!be
				s/^ {8}_stats:.*\n(.* {8}_[^[:space:]].*)/\1/
			}" \
			"$f"
	fi
done
echo "done."
