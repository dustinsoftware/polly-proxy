workflow "Build, Test" {
  on = "push"
  resolves = ["Build", "Test"]
}

action "Package restore" {
  uses = "actions/npm@master"
  args = "install"
}

action "Build" {
  uses = "actions/npm@master"
  needs = ["Package restore"]
  args = "build"
}

action "Test" {
  uses = "actions/npm@master"
  needs = ["Package restore"]
  args = "test"
}
