workflow "Build, Test" {
  on = "push"
  resolves = ["Docker build"]
}

action "Docker build" {
	uses = "actions/docker/cli@master"
	args = "build . -t dustinsoftware/polly"
}

action "Package restore" {
  uses = "docker://node:10"
  runs = "yarn"
}

action "Build" {
  uses = "docker://node:10"
  needs = ["Package restore"]
  runs = "yarn build"
}

action "Test" {
  uses = "docker://node:10"
  needs = ["Build"]
  runs = "yarn test:ci"
}
