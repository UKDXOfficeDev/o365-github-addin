/// <reference path="../App.js" />

(function () {
    "use strict";

    var github,
        user,
        vm;

    var MainViewModel = function () {
        this.items = ko.observableArray();
        this.selectedRepo = ko.observable();
        this.commits = ko.observableArray();
        this.contributors = ko.observableArray();
        this.userName = ko.observable();
        this.password = ko.observable();
        this.userData = ko.observable();
        this.createdOn = ko.observable();
        this.cloneUrl = ko.observable();;
        this.description = ko.observable();;
        this.stargazersCount = ko.observable();;
        this.watchersCount = ko.observable();;
        this.userDisplayName = ko.observable('Login with your Github username and password to access repository data');
        this.avatarUrl = ko.observable();
        this.showLogin = ko.observable(true);
        this.showMain = ko.observable(false);
        this.showSummary = ko.observable(false);
        this.loading = ko.observable(false);
        this.login = function (formElement) {
            github = new Github({
                username: this.userName(),
                password: this.password(),
                auth: "basic"
            });

            user = github.getUser();
            var that = this;
            user.show(this.userName(), function (err, res) {
                if (err) {
                    app.showNotification('Error:', err.error);
                    return;
                }
                that.showLogin(false);
                that.showMain(true);
                that.userData = res;
                that.userDisplayName(res.name);
                that.avatarUrl(res.avatar_url);
            });
            user.repos(function (err, repos) {
                vm.items(repos);
            });
        };

        this.selectionChanged = function (event, data) {
            this.loading(true);
            this.contributors([]);
            this.commits([]);
            var repo1 = event.selectedRepo();
            if (!repo1) {
                this.loading(false);
                return;
            }

            // populate the repo info...
            var repository = this.selectedRepo();
            var that = this;
            var repo = github.getRepo("peted70", repository.name);
            this.createdOn(repository.created_at);
            this.cloneUrl(repository.clone_url);
            this.description(repository.description);
            this.stargazersCount(repository.stargazers_count);
            this.watchersCount(repository.watchers_count);
            repo.contributors(function (err, data) {
                if (err) {
                    app.showNotification('Error ' + err.error);
                    that.loading(false);
                    return;
                }
                var contributorData = data.map(function (c) {
                    return {
                        avatarUrl: c.author.avatar_url,
                        commitCount: c.total
                    };
                })
                that.contributors(contributorData);
            });

            repo.getCommits({}, function (err, commits) {
                if (!commits) {
                    app.showNotification('No Commits ' + err.error);
                    that.loading(false);
                    return;
                }

                var commitTexts = commits.map(function (c) {
                    return {
                        commitMessage: c.commit.message,
                        committerName: c.commit.committer.name,
                        committerEmail: c.commit.committer.email,
                        committerDate: c.commit.committer.date
                    };
                });

                that.commits(commitTexts);
                that.showSummary(true);
                that.loading(false);
            });

            /** create a table of commits for each branch */
            repo.listBranches(function (err, branches) {
                //just gives branch names
                repo.getRef('heads/master', function (err, sha) {
                });
            });
        };
    };

    // The initialize function must be run each time a new page is loaded
    Office.initialize = function (reason) {
        $(document).ready(function () {
            vm = new MainViewModel();
            app.initialize();
            ko.applyBindings(vm);
        });
    };

    // Reads data from current document selection and displays a notification
    function getDataFromSelection() {
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    app.showNotification('The selected text is:', '"' + result.value + '"');
                } else {
                    app.showNotification('Error:', result.error.message);
                }
            }
        );
    }
})();